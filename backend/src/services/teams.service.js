const pool=require('../db/pool');
const TEAM_ERRORS=require('../config/team.errors');

//create new team
async function createTeam({name,organizationId,createdByUserId}){
    const teamName=name.trim().toLowerCase();
    try{
        const [result]=await pool.query(
            `INSERT INTO teams(organization_id,name,created_by_user_id) VALUES (?,?,?)`,[organizationId,teamName,createdByUserId]
        );
        
        return {
            id:result.insertId,
            name:teamName,
            status:'ACTIVE'
        };
    }catch(err){
        //Duplicate team name in same organization
        if(err.code==='ER_DUP_ENTRY'){
            throw new Error(TEAM_ERRORS.TEAM_ALREADY_EXISTS);
        }
        throw err;
    }
}
//list teams
async function listTeams({organizationId,limit,offset}){
    const [rows]=await pool.query(
        `SELECT id, name, status, created_at FROM teams WHERE organization_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?`,[organizationId,limit,offset]
    );
    return rows;
}
//get teams by id
async function getTeamById({teamId,organizationId}){
    const [rows]=await pool.query(
        `SELECT id, name, status, created_at FROM teams WHERE id=? AND organization_id=?`,[teamId,organizationId]
    );

if(rows.length===0){
    throw new Error(TEAM_ERRORS.TEAM_NOT_FOUND);
}
return rows[0];
}
//update team name
async function updateTeamName({teamId,name,organizationId,updatedByUserId}){
    const teamName=name.trim().toLowerCase();
    const [result]=await pool.query(
        `UPDATE teams SET name=?,updated_by_user_id=? WHERE id=? AND organization_id=? AND status='ACTIVE'`,[teamName,updatedByUserId,teamId,organizationId]
    );
    if(result.affectedRows===0){
        throw new Error(TEAM_ERRORS.TEAM_NOT_FOUND);
    }
    return true;
}

//update team status
async function updateTeamStatus({teamId,organizationId,status,updatedByUserId}){
    const [result]=await pool.query(
        `UPDATE teams SET status=? ,updated_by_user_id=? WHERE id=? AND organization_id=?`,[status,updatedByUserId,teamId,organizationId]
    );
    if (result.affectedRows === 0) {
    throw new Error(TEAM_ERRORS.TEAM_NOT_FOUND);
    }

  return true;
}

module.exports={
    createTeam,listTeams,getTeamById,updateTeamName,updateTeamStatus
};