const teamsService=require('../services/teams.service');
const TEAM_ERRORS=require('../config/team.errors');
const {sendSuccess,sendError} =require('../utils/response');
//create team
async function createTeam(req,res){
    const {name}=req.body;
    if(!name||typeof name!=='string'||name.trim().length<2){
        return sendError(res,'Invalid Team Name',null,400);
    }
    try{
        const team=await teamsService.createTeam({
            name,
            organizationId:req.user.organization_id,
            createdByUserId:req.user.user_id
        });
        return sendSuccess(res,'Team Created Successfully',team,201);
    }catch(err){
        if(err.message===TEAM_ERRORS.TEAM_ALREADY_EXISTS){
            return sendError(res,'Team Already Exists',null,409);
        }
        console.error(err);
        return sendError(res,'Failed to create team',null,500);
    }
}
//list teams
async function listTeams(req,res){
    const limit=Math.min(parseInt(req.query.limit,10)||10,50);
    const page=parseInt(req.query.page,10)||1;
    const offset=(page-1)*limit;
    try{
        const teams=await teamsService.listTeams({
            organizationId:req.user.organization_id,
            limit,offset
        });
        return sendSuccess(res,'Teams Fetched Sucessfully',{page,limit,count:teams.length,data:teams});
    }catch(err){
        console.error(err)
        return sendError(res,'Failed to fetch teams',null,500);
    }
}
//get team by id
async function getTeamById(req,res){
    const teamId=parseInt(req.params.id,10);
    if(isNaN(teamId)){
    return sendError(res,'Invalid team ID',null,400);
    }
    try{
        const team=await teamsService.getTeamById({
            teamId,
            organizationId:req.user.organization_id
        });
        return sendSuccess(res,'Team Fetched Successfully',team);
    }catch(err){
        if(err.message===TEAM_ERRORS.TEAM_NOT_FOUND){
            return sendError(res,'Team not found',null,404);
        }
        console.error(err);
        return sendError(res,'Failed to fetch team',null,500);
    }
}
//updating team name
async function updateTeamName(req,res){
    const teamId=parseInt(req.params.id,10);
    const {name}=req.body;
    if(isNaN(teamId)){
    return sendError(res,'Invalid team ID',null,400);
    }
    if(!name||typeof name!=='string'||name.trim().length<2){
    return sendError(res,'Invalid team name',null,400);
    }

    try{
        await teamsService.updateTeamName({
            teamId,
            name,
            organizationId:req.user.organization_id,
            updatedByUserId:req.user.user_id
        });
        return sendSuccess(res,'Team Name Updated Successfully');
    }catch(err){
        if(err.message===TEAM_ERRORS.TEAM_NOT_FOUND){
            return sendError(res,'Team not found or inactive',null,404);
            }

    if(err.message===TEAM_ERRORS.TEAM_ALREADY_EXISTS){
      return sendError(res,'Team name already exists',null,409);
    }
    console.error(err);
    return sendError(res,'Failed to update team',null,500);
    }
}
//update team status
async function updateTeamStatus(req,res){
    const teamId=parseInt(req.params.id,10);
    const {status}=req.body;
    if(isNaN(teamId)){
        return sendError(res,'Invalid team ID',null,400);
    }
    if(!['ACTIVE','INACTIVE'].includes(status)) {
        return sendError(res,'Invalid status value',null,400);
    }
    try{
        await teamsService.updateTeamStatus({
            teamId,
            organizationId:req.user.organization_id,
            status,
            updatedByUserId:req.user.user_id
        });

    return sendSuccess(res,'Team status updated successfully');
    }catch(err){
        if(err.message===TEAM_ERRORS.TEAM_NOT_FOUND){
            return sendError(res,'Team not found',null,404);
        }
        console.error(err);
        return sendError(res,'Failed to update team status',null,500);
    }
}
module.exports = {
  createTeam,
  listTeams,
  getTeamById,
  updateTeamName,
  updateTeamStatus
};