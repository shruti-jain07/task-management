//Express server
require('dotenv').config();
const express=require('express');
//const tokenBlacklist=require('./middlewares/tokenBlacklist.middleware');

const app=express();
app.use(express.json());

const pool = require('./db/pool');

//require 
const authRoutes=require('./routes/auth.routes');
const usersRoutes=require('./routes/users.routes');
app.get('/check',(req,res)=>{
    res.json({status:'ok'});
})
//my routes
app.use('/api/auth',authRoutes);
app.use('/api/users',usersRoutes);
const PORT=process.env.PORT || 3000;

app.listen(PORT,()=>{
    console.log(`Backend Running on Port ${PORT}`);
});
