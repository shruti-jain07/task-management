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
module.exports=authorizeRoles;