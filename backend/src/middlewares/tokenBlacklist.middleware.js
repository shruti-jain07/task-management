const pool=require('../db/pool');
const {sendError}=require('../utils/response');
async function tokenBlacklist(req,res,next){
    const authHeader=req.headers.authorization;
    if(!authHeader||!authHeader.startsWith('Bearer ')) return next();
    const token=authHeader.split(' ')[1];
    if(!token) return next();
    const [rows]=await pool.query(
        'SELECT 1 from token_blacklist WHERE token=? LIMIT 1',[token]
    );
    if(rows.length>0){
        return sendError(res,'Token Revoked.Please Login again',null,401);
        }
    next();
}
module.exports=tokenBlacklist;