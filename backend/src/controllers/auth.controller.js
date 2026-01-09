//validateRequest,call service,return response
const authService=require('../services/auth.service');
const {sendError, sendSuccess}=require('../utils/response');

async function signup(req,res){
    const {name,email,password,organization_id,role_id}=req.body;
    if(!name||!email||!password||!organization_id||!role_id){
        return sendError(res,'Missing Required fields',null,400);
    }

    try{
        const user=await authService.signup({
            name,email,password,organization_id,role_id
        })
        return sendSuccess(res,'User Registered Successfully',user,201);
    } catch(err){
        if(err.message==='Email Exists'){
            return sendError(res,'Email already exists',null,400);
        }
        console.error(err);
        return sendError(res,'Signup Failed',null,500);
    }
}
async function login(req,res){
    const {email,password}=req.body;
    if(!email||!password){
        return sendError(res,'Email and Password required',null,400);
    }

    try{
        const result=await authService.login({email,password});
        return sendSuccess(res,'Login Successful',result);
    } catch(err){
        if(err.message==='INVALID CREDENTIALS'){
            return sendError(res,'Invalid email or password',null,401);
        }
        console.error(err);
        return sendError(res,'Login Failed',null,500);
    }
}

//logout
async function logout(req,res){
    try{
        await authService.logout(req.token);
        return sendSuccess(res,'Logged Out Successfully');
    }catch{
        return sendError(res,'Logout Failed',null,500);
    }
}
module.exports={
    signup,login,logout
};