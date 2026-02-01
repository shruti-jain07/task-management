const pool=require('../db/pool');
const TEAM_ERRORS=require('../config/team.errors');
const auditLogsService=require("../services/auditLogs.service");

//add member
//reactivate if inactive
//fails if already active
async function addMemberToTeam({organizationId,teamId,userId,createdByUserId}){
    const connection=await pool.getConnection();
    try{
        await connection.beginTransaction();


    //1.validating user belong to org or not
    const [userRows]=await connection.query(
        `SELECT id FROM users WHERE id=? AND organization_id=? AND status='ACTIVE'`,[userId,organizationId]
    );
    if(userRows.length===0){
        throw new Error(TEAM_ERRORS.INVALID_USER)
    }


    //2. existing membership
    const [memberRows]=await connection.query(
        `SELECT id,status FROM team_members WHERE organization_id=? AND team_id=? AND user_id=?`,[organizationId,teamId,userId]
    );
    if(memberRows.length>0){
        if(memberRows[0].status==="ACTIVE"){
            throw new Error(TEAM_ERRORS.MEMBER_ALREADY_ACTIVE);
        }
        //reactivate
        await connection.query(
            `UPDATE team_members SET status='ACTIVE',updated_by_user_id=? WHERE id=?`,[createdByUserId,memberRows[0].id]
        );
        await auditLogsService.createAuditLog({
            organizationId,
            actorUserId:createdByUserId,
            actionType:'TEAM_MEMBER_REACTIVATED',
            entityType:'TEAM_MEMBER',
            entityId:memberRows[0].id,
            metadata:{teamId,userId}
        },
    connection);

        await connection.commit();
        return true;
    }
        //new insertion
        const [result]=await connection.query(
            `INSERT INTO team_members(organization_id,team_id,user_id,role,status,added_by_user_id)VALUES(?,?,?,?,?,?)`,
            [organizationId,teamId,userId,"MEMBER","ACTIVE",createdByUserId]
        );
        await auditLogsService.createAuditLog({
            organizationId,
            actorUserId: createdByUserId,
            actionType: 'TEAM_MEMBER_ADDED',
            entityType: 'TEAM_MEMBER',
            entityId: result.insertId,
            metadata: { teamId, userId }
        }, connection);

        await connection.commit();
        return true;
   }catch(err){
        await connection.rollback();
        throw err;
    }finally{
        connection.release();
    }
}

//Assign manager
//-demote old manager, promote new manger, sync teams table
async function assignManagerToTeam({organizationId,teamId,newManagerUserId,updatedByUserId}){
    const connection=await pool.getConnection();
    try{
        await connection.beginTransaction();

        //checking team exists
        const [teamRows]=await connection.query(
            `SELECT id FROM teams WHERE id=? AND organization_id=? AND status='ACTIVE'`,[teamId,organizationId]
        );
        if(teamRows.length===0){
            throw new Error(TEAM_ERRORS.TEAM_NOT_FOUND);
        }


        //checking user exists
        const [userRows]=await connection.query(
            `SELECT id FROM users WHERE id=? AND organization_id=? AND status='ACTIVE'`,[newManagerUserId,organizationId]
        );
        if(userRows.length===0){
            throw new Error(TEAM_ERRORS.INVALID_USER);
        }


        //demoting existing manager
        await connection.query(
            `UPDATE team_members SET role='MEMBER',updated_by_user_id=? WHERE organization_id=? AND team_id=? AND role='MANAGER' AND status='ACTIVE'`,[updatedByUserId,organizationId,teamId]
        );


        //promote to the role manager
        const [memberRows]=await connection.query(
            `SELECT id,status FROM team_members WHERE organization_id=? AND team_id=? AND user_id=?`,[organizationId,teamId,newManagerUserId]
        );
        let managerMemberId;
        if(memberRows.length>0){
            await connection.query(
                `UPDATE team_members SET role='MANAGER',status='ACTIVE',updated_by_user_id=? WHERE id=?`,
                [updatedByUserId,memberRows[0].id]
            );
            managerMemberId=memberRows[0].id;
        }else{
            const [result]=await connection.query(
                `INSERT INTO team_members (organization_id,team_id,user_id,role,status,added_by_user_id)VALUES (?,?,?,?,?,?)`,
                [organizationId,teamId,newManagerUserId,"MANAGER","ACTIVE",updatedByUserId]
            );
            managerMemberId=result.insertId;
        }


        //aligning with teams table
        await connection.query(
            `UPDATE teams SET manager_user_id=?,updated_by_user_id=? WHERE id=? AND organization_id=?`,[newManagerUserId,updatedByUserId,teamId,organizationId]
        );

        await auditLogsService.createAuditLog({
            organizationId,
            actorUserId: updatedByUserId,
            actionType: 'TEAM_MANAGER_ASSIGNED',
            entityType: 'TEAM_MEMBER',
            entityId: managerMemberId,
            metadata: { teamId, newManagerUserId }
        }, connection);

        await connection.commit();
        return true;
    }catch(err){
        await connection.rollback();
        throw err;
    }finally{
        connection.release();
    }
}


//REMOVING  the user with role 'MEMBER'
async function removeTeamMember({organizationId,teamId,userId,removedByUserId}){
    const connection=await pool.getConnection();
    try{
        const [result]=await connection.query(
        `UPDATE team_members SET status='INACTIVE',removed_by_user_id=? WHERE organization_id=? AND team_id=? AND user_id=? AND role!='MANAGER' AND status='ACTIVE'`,[removedByUserId,organizationId,teamId,userId]
    );
    if(result.affectedRows===0){
        throw new Error(TEAM_ERRORS.CANNOT_REMOVE_MEMBER);
    }
    await auditLogsService.createAuditLog({
            organizationId,
            actorUserId: removedByUserId,
            actionType: 'TEAM_MEMBER_REMOVED',
            entityType: 'TEAM_MEMBER',
            entityId: userId,
            metadata: { teamId }
        }, connection);
    return true;
    }catch(err){
        throw err;
    }finally{
        connection.release();
    } 
} 


//List Team Members
async function listTeamMembers({organizationId,teamId,limit,offset}){
    const [rows]=await pool.query(
        `SELECT 
        tm.user_id,tm.role,tm.status,tm.created_at,
        u.name,u.email 
        FROM 
        team_members tm INNER JOIN teams t 
        ON t.id=tm.team_id 
        AND t.organization_id=tm.organization_id 
        INNER JOIN users u 
        ON u.id=tm.user_id 
        AND u.organization_id=tm.organization_id 
        WHERE 
        tm.organization_id=? AND tm.team_id=? 
        AND 
        tm.status='ACTIVE' AND t.status='ACTIVE' AND u.status='ACTIVE' 
        ORDER BY tm.role='MANAGER' DESC ,tm.created_at ASC LIMIT ? OFFSET ?`,[organizationId,teamId,limit,offset]
    );
    return rows;
}

module.exports={
    addMemberToTeam,assignManagerToTeam,removeTeamMember,listTeamMembers
}
