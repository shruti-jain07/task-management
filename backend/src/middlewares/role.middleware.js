const pool = require('../db/pool');
const {sendError}=require('../utils/response')

function authorizeRoles(allowedRoles=[]){
    return(req,res,next)=>{
        if(!req.user||!req.user.role_id){
            return sendError(res,'Unauthorized',null,401);
        }
        const userRole=req.user.role_id;
        if(!allowedRoles.includes(userRole)){
            return sendError(res,'Forbidden:Insufficient Permissions',null,403);
        }
        next();
    };
}
async function authorizeTeamAccess(req, res, next) {
  const user = req.user;
  const teamId = parseInt(req.params.id, 10);

  // Admin → full access
  if (user.role === 'ADMIN') {
    return next();
  }

  // Manager → only their team
  if (user.role === 'MANAGER') {
    const [[team]] = await pool.query(
      `SELECT id FROM teams
       WHERE id = ? AND manager_user_id = ?`,
      [teamId, user.user_id]
    );

    if (!team) {
      return sendError(res, 'Forbidden: not your team', null, 403);
    }

    return next();
  }

  return sendError(res, 'Forbidden', null, 403);
}

module.exports={authorizeRoles,authorizeTeamAccess};