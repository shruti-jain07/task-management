//validateRequest,call service,return response
const authService = require("../services/auth.service");
const { sendError, sendSuccess } = require("../utils/response");
const AUTH_ERRORS = require("../config/auth.errors");
const {isValidEmail}=require('../utils/validators');
//signup
async function signup(req, res) {
  const { name, email, password, organization_id, role_id } = req.body;
  if (!name || !email || !password || !organization_id || !role_id) {
    return sendError(res, "Missing Required fields", null, 400);
  }
  if (!isValidEmail(email)) {
    return sendError(res, "Invalid email format", null, 400);
  }
  if (password.length < 8) {
    return sendError(res, "Password must be atleast 8 characters", null, 400);
  }
  try {
    const user = await authService.signup({
      name,
      email,
      password,
      organization_id,
      role_id,
    });
    return sendSuccess(res, "User Registered Successfully", user, 201);
  } catch (err) {
    if (err.message === AUTH_ERRORS.EMAIL_EXISTS) {
      return sendError(
        res,
        "Email already exists in this organization",
        null,
        400
      );
    }
    if (err.message === AUTH_ERRORS.ORGANIZATION_NOT_FOUND) {
      return sendError(res, "Organization Not Found", null, 404);
    }

    console.error(err);
    return sendError(res, "Signup Failed", null, 500);
  }
}
//login
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendError(res, "Email and Password required", null, 400);
  }
  if (!isValidEmail(email)) {
    return sendError(res, "Invalid email format", null, 400);
  }
  try {
    const result = await authService.login({ email, password });
    return sendSuccess(res, "Login Successful", result);
  } catch (err) {
    if (err.message === AUTH_ERRORS.INVALID_CREDENTIALS) {
      return sendError(res, "Invalid email or password", null, 401);
    }
    if (err.message === AUTH_ERRORS.USER_INACTIVE) {
      return sendError(res, "User account is inactive", null, 403);
    }
    if (err.message === AUTH_ERRORS.USER_DELETED) {
      return sendError(res, "User account no longer exists", null, 403);
    }
    console.error(err);
    return sendError(res, "Login Failed", null, 500);
  }
}
//refresh token
async function refresh(req,res){
  const {refreshToken}=req.body;
  if(!refreshToken){
    return sendError(res,"Refresh Token is Required",null,400);
  }
  
  try{
    const tokens=await authService.refreshAccessToken(refreshToken);
    return sendSuccess(res,"Token Refreshed Successfully",tokens);
  }catch(err){
    if(err.message===AUTH_ERRORS.INVALID_TOKEN){
      return sendError(res,"Invalid or expired token",null,401);
    }
    if(err.message===AUTH_ERRORS.USER_NOT_FOUND){
      return sendError(res, "User no longer exists", null, 404);
    }
    console.error(err);
    return sendError(res, "Token refresh failed", null, 500);
  }
}
//logout
async function logout(req, res) {
  const {refreshToken}=req.body;
  try {
    await authService.logout(req.token,refreshToken);
    return sendSuccess(res, "Logged Out Successfully");
  } catch(err) {
    return sendError(res, "Logout Failed", null, 500);
  }
}
module.exports = {
  signup,
  login,
  refresh,
  logout
};
