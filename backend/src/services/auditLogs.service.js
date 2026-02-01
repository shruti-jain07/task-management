const pool=require('../db/pool');
async function createAuditLog({organizationId,actorUserId,actionType,entityType,entityId,metadata=null},connection=null){
    const executor=connection||pool;
    await executor.query(
        `INSERT INTO audit_logs (organization_id,actor_user_id,action_type,entity_type,entity_id,metadata) VALUES (?,?,?,?,?,?) `,[organizationId,actorUserId,actionType,entityType,entityId,metadata?JSON.stringify(metadata):null]
    );
}
module.exports={createAuditLog};