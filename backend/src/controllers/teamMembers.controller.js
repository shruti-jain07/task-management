const teamMembersService=require('../services/teamMembers.service');
const TEAM_ERRORS=require('../config/team.errors');
const {sendSuccess,sendError}=require('../utils/response');

async function addMember(req,res){
  const teamId=parseInt(req.params.teamId,10);
  const {userId}=req.body;
  if(isNaN(teamId)){
    return sendError(res,"Invalid Team ID",null,400);
  }
  if(!userId||isNaN(userId)){
    return sendError(res,"Invalid User ID",null,400);
  }

  try{
    await teamMembersService.addMemberToTeam({
      organizationId:req.user.organization_id,
      teamId,
      userId:userId,
      createdByUserId:req.user.user_id
    })
    return sendSuccess(res, "Member added to team successfully");

  }catch(err){
    if(err.message===TEAM_ERRORS.MEMBER_ALREADY_ACTIVE){
      return sendError(res,"Member already active in team",null,409);
    }
    if (err.message === TEAM_ERRORS.INVALID_USER) {
      return sendError(res,"Invalid user for this organization",null,400);
    }
    console.error(err);
    return sendError(res,"Failed to add member",null,500);
  }
}

async function assignManager(req,res){
  const teamId=parseInt(req.params.teamId,10);
  const {manager_user_id}=req.body;
    if(isNaN(teamId)){
      return sendError(res,"Invalid team ID",null,400);
    }

    if(!manager_user_id||isNaN(manager_user_id)){
      return sendError(res,"Invalid manager user ID",null,400);
    }

    try{
      await teamMembersService.assignManagerToTeam({
        organizationId:req.user.organization_id,
        teamId,
        newManagerUserId:manager_user_id,
        updatedByUserId:req.user.user_id
      });
       return sendSuccess(res,"Manager assigned successfully");
    }catch(err){
      if(err.message===TEAM_ERRORS.TEAM_NOT_FOUND){
        return sendError(res,"Team Not Found",null,404);
      }
      if(err.message===TEAM_ERRORS.INVALID_USER){
        return sendError(res,"Invalid Manager User",null,400);
      }

      console.error(err);
      return sendError(res,"Failed to assign manager",null,500);
    }
}

async function removeMember(req,res){
  const teamId=parseInt(req.params.teamId,10);
  const userId=parseInt(req.params.userId,10);
  if(isNaN(teamId)||isNaN(userId)){
    return sendError(res,"Invalid team or user ID",null,400);
  }

  try{
    await teamMembersService.removeTeamMember({
      organizationId:req.user.organization_id,
      teamId,userId,
      removedByUserId:req.user.user_id
    });
    return sendSuccess(res,"Member Removed Successfully");
  }catch(err){
    if(err.message===TEAM_ERRORS.CANNOT_REMOVE_MEMBER){
      return sendError(res,"Cannot Remove Manager or Inactive Member",null,400);
    }
    console.error(err);
    return sendError(res,"Failed to remove member",null,500);
  }
}

async function listTeamMembers(req,res){
  const teamId=parseInt(req.params.teamId,10);
  if(isNaN(teamId)){
    return sendError(res,"Invalid Team ID",null,400);
  }
  const limit=Math.min(parseInt(req.query.limit,10)||10,50);
  const page=Math.max(parseInt(req.query.page,10)||1,1);
  const offset=(page-1)*limit;
  try{
    const members=await teamMembersService.listTeamMembers({
      organizationId:req.user.organization_id,teamId,limit,offset
    });
    return sendSuccess(res,"Team Members Fetched Successfully",{page,limit,count:members.length,data:members});
  }catch(err){
    console.error(err);
    return sendError(res,"Failed to fetch Team Members",null,500);
  }
}
module.exports={
  addMember,assignManager,removeMember,listTeamMembers
}