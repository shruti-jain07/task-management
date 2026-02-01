const express=require('express');
const router=express.Router();
const authenticate=require('../middlewares/auth.middleware');
const {authorizeRoles}=require('../middlewares/role.middleware');
const teamController=require('../controllers/teams.controller');
const Roles=require('../config/roles');
//create team
router.post('/',authenticate,authorizeRoles([Roles.ADMIN]),teamController.createTeam);
//List Teams
router.get('/',authenticate,authorizeRoles([Roles.ADMIN,Roles.MANAGER]),teamController.listTeams);
//get team by id
router.get('/:id',authenticate,authorizeRoles([Roles.ADMIN,Roles.MANAGER]),teamController.getTeamById);
//update team name
router.patch('/:id',authenticate,authorizeRoles([Roles.ADMIN]),teamController.updateTeamName);
//update team status
router.patch('/:id/status',authenticate,authorizeRoles([Roles.ADMIN]),teamController.updateTeamStatus);

module.exports=router;
