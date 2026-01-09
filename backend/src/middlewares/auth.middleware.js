//JWT Verification,rbac enforcement
const jwt=require('jsonwebtoken');
const pool=require('../db/pool');
const {sendError}=require('../utils/response');
const JWT_SECRET=process.env.JWT_SECRET;

async function authenticate(req,res,next){
    const authHeader=req.headers.authorization;

    if(!authHeader||!authHeader.startsWith('Bearer ')){
        return sendError(res,'Authentication required',null,401);
    }

    const token=authHeader.split(' ')[1];
    try{
        const decoded=jwt.verify(token,JWT_SECRET);
        //check blacklist
        const [rows]=await pool.query(
            'SELECT id FROM token_blacklist where token=? LIMIT 1',[token]
        );
        if(rows.length>0){
            return sendError(res,'Token Has Been Logged Out',null,401);
        }
        req.user=decoded;
        req.token=token;
        next();
    } catch(err){
        return sendError(res,'Invalid or Expired Token',null,401);
    }
}
module.exports=authenticate;


