const pool = require("../db/pool");
const TEAM_ERRORS = require("../config/team.errors");
const auditLogsService=require("../services/auditLogs.service");
//create new team
async function createTeam({
  name,
  organizationId,
  managerUserId,
  createdByUserId,
}) {
 
  const teamName = name.trim().toLowerCase();
  const connection=await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const [managerRows]=await connection.query(
      `SELECT id FROM users WHERE id=? AND organization_id=? AND status='ACTIVE'`,[managerUserId,organizationId]
    );
    if(managerRows.length===0){
      throw new Error(TEAM_ERRORS.INVALID_MANAGER);
    }

    const [result] = await connection.query(
      `INSERT INTO teams(organization_id,name,manager_user_id,created_by_user_id) VALUES (?,?,?,?)`,
      [organizationId, teamName, managerUserId, createdByUserId]
    );
    const teamId=result.insertId;
    await connection.query(
  `INSERT INTO team_members
   (organization_id, team_id, user_id, role, status, added_by_user_id)
   VALUES (?, ?, ?, 'MANAGER', 'ACTIVE', ?)`,
  [organizationId, teamId, managerUserId, createdByUserId]
);
    await auditLogsService.createAuditLog(
  {
    organizationId,
    actorUserId: createdByUserId,
    actionType: 'TEAM_CREATED',
    entityType: 'TEAM',
    entityId: teamId,
    metadata: {
      name: teamName,
      managerUserId
    }
  },
  connection
);
    await connection.commit();
    return {
      id: teamId,
      name: teamName,
      manager_user_id: managerUserId,
      status: "ACTIVE",
    };
  } catch (err) {
    await connection.rollback();
    //Duplicate team name in same organization
    if (err.code === "ER_DUP_ENTRY") {
      throw new Error(TEAM_ERRORS.TEAM_ALREADY_EXISTS);
    }
    throw err;
  }finally{
    connection.release();
  }
}
//list teams
async function listTeams({ organizationId, limit, offset }) {
  const [rows] = await pool.query(
    `SELECT id,name,status,manager_user_id,created_at FROM teams WHERE organization_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [organizationId, limit, offset],
  );
  return rows;
}
//get teams by id
async function getTeamById({ teamId, organizationId }) {
  const [rows] = await pool.query(
    `SELECT id,name,status,manager_user_id,created_at FROM teams WHERE id=? AND organization_id=?`,
    [teamId, organizationId],
  );

  if (rows.length === 0) {
    throw new Error(TEAM_ERRORS.TEAM_NOT_FOUND);
  }
  return rows[0];
}
//update team name
async function updateTeamName({
  teamId,
  name,
  organizationId,
  updatedByUserId,
}) {
  const teamName = name.trim().toLowerCase();
  try {
    const [result] = await pool.query(
      `UPDATE teams SET name=?,updated_by_user_id=? WHERE id=? AND organization_id=? AND status='ACTIVE'`,
      [teamName, updatedByUserId, teamId, organizationId],
    );
    if (result.affectedRows === 0) {
      throw new Error(TEAM_ERRORS.TEAM_NOT_FOUND);
    }
    return true;
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new Error(TEAM_ERRORS.TEAM_ALREADY_EXISTS);
    }
    throw err;
  }
}

//update team status
async function updateTeamStatus({
  teamId,
  organizationId,
  status,
  updatedByUserId,
}) {
  const connection=await pool.getConnection();
  try{
  await connection.beginTransaction();
  const [result] = await connection.query(
    `UPDATE teams SET status=? ,updated_by_user_id=? WHERE id=? AND organization_id=?`,
    [status, updatedByUserId, teamId, organizationId],
  );
  if (result.affectedRows === 0) {
    throw new Error(TEAM_ERRORS.TEAM_NOT_FOUND);
  }
await auditLogsService.createAuditLog(
  {
  organizationId,
  actorUserId:updatedByUserId,
  actionType:'TEAM_STATUS_UPDATED',
  entityType:'TEAM',
  entityId:teamId,
  metadata:{status}
},
connection
);
  await connection.commit();
  return true;
  }catch(err){
    await connection.rollback();
    throw err;
  }finally{
    connection.release();
  } 
}

module.exports = {
  createTeam,
  listTeams,
  getTeamById,
  updateTeamName,
  updateTeamStatus,
};
