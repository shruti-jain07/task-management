const express=require('express');
const router=express.Router();

const usersController=require('../controllers/users.controller');
const authenticate=require('../middlewares/auth.middleware');
const authorizeRoles=require('../middlewares/role.middleware');
const ROLES=require('../config/roles');

//current user
router.get('/me',authenticate,usersController.getMe);
// list users (ADMIN + MANAGER)
router.get('/',authenticate,authorizeRoles([ROLES.ADMIN, ROLES.MANAGER]),usersController.listUsers);
// update user status (ADMIN only)
router.patch('/:id/status',authenticate,authorizeRoles([ROLES.ADMIN]),usersController.updateStatus);

module.exports = router;