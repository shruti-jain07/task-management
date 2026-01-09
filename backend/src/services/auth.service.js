//talk to db, hash passwords, verify credentials, generate token
const pool=require('../db/pool');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');

const JWT_SECRET=process.env.JWT_SECRET;
const JWT_EXPIRES_IN=process.env.JWT_EXPIRES_IN || '1h';

//sign-up
async function signup({
    name,email,password,organization_id,role_id
}){
    //checking if there is duplicate email in organization
    const [existing]=await pool.query(
        'SELECT id FROM users WHERE email=? AND organization_id=?',
        [email,organization_id]
    );
    if(existing.length>0){
        throw new Error('EMAIL EXISTS');
    }

    const password_hash=await bcrypt.hash(password,10);

    const [result]=await pool.query(
        `INSERT INTO users (name, email, password_hash,organization_id, role_id) VALUES (?,?,?,?,?)`,[name,email,password_hash,organization_id,role_id]
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
        throw new Error('INVALID CREDENTIALS');
    }
    const user=rows[0];
    
    const isMatch=await bcrypt.compare(password,user.password_hash);
    if(!isMatch){
        throw new Error('INVALID CREDENTIALS');
    } 

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
    return{
        token,
        user:{
            user_id:user.id,
            name:user.name,
            email:user.email,
            organization_id:user.organization_id,
            role_id:user.role_id
        }
    };
   
}
//logout 
async function logout(token){
    const decoded=jwt.decode(token);
    if(!decoded || !decoded.exp){
        throw new Error('INVALID TOKEN');
    }
    const expiresAt=new Date(decoded.exp*1000);
    await pool.query(
        `INSERT IGNORE INTO token_blacklist (token,user_id,expires_at) VALUES (?,?,?)`,[token,decoded.user_id,expiresAt]
    );
    return true;
}
 module.exports={
        signup,login,logout
    };
