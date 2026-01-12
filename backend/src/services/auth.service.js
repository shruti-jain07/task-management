//talk to db, hash passwords, verify credentials, generate token
const pool=require('../db/pool');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const AUTH_ERRORS=require('../config/auth.errors');
const JWT_SECRET=process.env.JWT_SECRET;
const JWT_EXPIRES_IN=process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';
const SALT_ROUNDS=10;
//sign-up
async function signup({
    name,email,password,organization_id,role_id
}){
    //checking if organization exists
    const [orgRows]=await pool.query(
        'SELECT id FROM organizations WHERE id=? AND status="ACTIVE"',[organization_id]
    );
    if(orgRows.length===0){
        throw new Error(AUTH_ERRORS.ORGANIZATION_NOT_FOUND);
    }
    //checking if there is duplicate email in organization
    const [existing]=await pool.query(
        'SELECT id FROM users WHERE email=? AND organization_id=? AND deleted_at IS NULL',
        [email,organization_id]
    );
    if(existing.length>0){
        throw new Error(AUTH_ERRORS.EMAIL_EXISTS);
    }
    //Hash Password
    const password_hash=await bcrypt.hash(password,SALT_ROUNDS);
    //INSERT in User
    const [result]=await pool.query(
        `INSERT INTO users 
        (name,email,password_hash,organization_id,role_id,status) 
        VALUES (?,?,?,?,?,'ACTIVE')`,
        [name,email,password_hash,organization_id,role_id]
    );

    return {
        user_id:result.insertId,
        name,
        email,
        organization_id,
        role_id
    };
}

//Login service
async function login({email,password}){
    const [rows]=await pool.query(
        'SELECT * FROM users WHERE email=? AND status="ACTIVE"',
        [email]
    );

    if(rows.length===0){
        throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
    }
    const user=rows[0];
    //user deleted
    if(user.deleted_at){
        throw new Error(AUTH_ERRORS.USER_DELETED);
    }
    //User Inactive
    if(user.status!=='ACTIVE'){
        throw new Error(AUTH_ERRORS.USER_INACTIVE);
    }
    const isMatch=await bcrypt.compare(password,user.password_hash);
    if(!isMatch){
        throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
    } 
    //Access Token
    const token=jwt.sign(
        {
            user_id:user.id,
            organization_id:user.organization_id,
            role_id:user.role_id
        },
        JWT_SECRET,
        {
            expiresIn:JWT_EXPIRES_IN
        }
    );
    //Refresh Token
    const refreshToken=jwt.sign(
        {user_id:user.id},
        JWT_REFRESH_SECRET,
        {expiresIn:REFRESH_TOKEN_EXPIRY}
    );
    await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
    [user.id, refreshToken]
  );

    return{
        token,
        refreshToken,
        user:{
            user_id:user.id,
            name:user.name,
            email:user.email,
            organization_id:user.organization_id,
            role_id:user.role_id
        }
    };
   
}
//refresh token
async function refreshAccessToken(refreshToken){
    let decoded;
    try{
        decoded=jwt.verify(refreshToken,JWT_REFRESH_SECRET);
    }catch{
        throw new Error(AUTH_ERRORS.INVALID_TOKEN);
    }
    const [rows]=await pool.query(
        `SELECT id FROM refresh_tokens WHERE token=? AND revoked=FALSE AND expires_at>NOW()`,[refreshToken]
    );
    if(rows.length===0){
        throw new Error(AUTH_ERRORS.INVALID_TOKEN);
    }
    const tokenRow=rows[0];
    //revoking old token
    await pool.query(
        `UPDATE refresh_tokens SET revoked=TRUE WHERE id=?`,[tokenRow.id]);
    const [userRows]=await pool.query(
        'SELECT organization_id ,role_id FROM users WHERE id=?',[decoded.user_id]
    );
    if (userRows.length === 0) {
    throw new Error(AUTH_ERRORS.USER_NOT_FOUND);
  }
    //new Access token
    const token=jwt.sign(
        {
            user_id:decoded.user_id,
            organization_id:userRows[0].organization_id,
            role_id:userRows[0].role_id
        },
        JWT_SECRET,
        {expiresIn:JWT_EXPIRES_IN}
    );
    //Refresh Token
    const newRefreshToken=jwt.sign(
        {user_id:decoded.user_id},
        JWT_REFRESH_SECRET,
        {expiresIn:REFRESH_TOKEN_EXPIRY}
    );
    await pool.query(
        `INSERT INTO refresh_tokens (user_id,token,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 7 DAY))`,[decoded.user_id,newRefreshToken]
    );
    return {
        token,
        refreshToken:newRefreshToken
    }
}
//logout 
async function logout(token,refreshToken){
    const decoded=jwt.decode(token);
    if(!decoded || !decoded.exp){
        throw new Error(AUTH_ERRORS.INVALID_TOKEN);
    }
    const expiresAt=new Date(decoded.exp*1000);
   
    await pool.query(
        `INSERT IGNORE INTO token_blacklist (token,user_id,expires_at) VALUES (?,?,?)`,[token,decoded.user_id,expiresAt]
    );
    // revoke refresh token
  if (refreshToken) {
    await pool.query(
      `UPDATE refresh_tokens SET revoked = TRUE WHERE token = ?`,
      [refreshToken]
    );
  }
    return true;
}
 module.exports={
        signup,login,refreshAccessToken,logout
    };
