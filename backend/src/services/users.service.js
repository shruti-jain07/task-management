const pool=require('../db/pool');
//getting current user
async function getMe(userId,organizationId){
    const [rows]=await pool.query(
        `SELECT id,name,email,role_id,status,organization_id,created_at FROM users 
        WHERE id=? AND organization_id=? AND deleted_at IS NULL`,
        [userId,organizationId]
    );
    if(rows.length===0){
        throw new Error('User Not Found');
    }
    return rows[0]||null;
}
//list of users
async function listUsers(organizationId){
    const [rows]=await pool.query(
        `SELECT id, name, email, role_id, status, created_at FROM users WHERE organization_id=? AND deleted_at IS NULL ORDER BY created_at DESC`,
        [organizationId]
    );
    return rows;
}
//updating user status
async function updateStatus({targetUserId,actorUserId,organizationId,newStatus}){
    newStatus = newStatus?.toUpperCase();
    if(!['ACTIVE','INACTIVE'].includes(newStatus)){
        throw new Error('Invalid Status');
    }
    if(targetUserId===actorUserId){
        throw new Error('Cannot Modify Self');
    }
    const [result]=await pool.query(
        `UPDATE users SET status=? WHERE id=? AND organization_id=? AND deleted_at IS NULL`,
        [newStatus,targetUserId,organizationId]
    );
    if(result.affectedRows===0){
        throw new Error('User Not Found or Forbidden');
    }
    await pool.query(
        `INSERT INTO audit_logs (organization_id,actor_user_id,action_type,entity_type,entity_id) VALUES (?,?,'UPDATE STATUS','USER',?)`,[organizationId,actorUserId,targetUserId]
    );
    return true;
}

module.exports={
    getMe,listUsers,updateStatus
};