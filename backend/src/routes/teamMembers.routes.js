const express=require('express');
const router=express.Router();
const authenticate=require('../middlewares/auth.middleware');
const {authorizeRoles}=require('../middlewares/role.middleware');
const teamMembersController=require('../controllers/teamMembers.controller');
const Roles=require('../config/roles');

router.use(authenticate);
//add team member
router.post('/:teamId/members',authorizeRoles([Roles.ADMIN,Roles.MANAGER]),teamMembersController.addMember);
//list members
router.get('/:teamId/members',authorizeRoles([Roles.ADMIN,Roles.MANAGER]),teamMembersController.listTeamMembers);

//remove (only changing status from active to inactive)
router.delete('/:teamId/members/:userId',authorizeRoles([Roles.ADMIN,Roles.MANAGER]),teamMembersController.removeMember)
//assign-manager
router.put('/:teamId/manager',authorizeRoles([Roles.ADMIN]),teamMembersController.assignManager);
module.exports=router;


