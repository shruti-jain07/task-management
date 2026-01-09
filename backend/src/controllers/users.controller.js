const usersService = require("../services/users.service");
const { sendSuccess, sendError } = require("../utils/response");
//get users/me
async function getMe(req, res) {
  try {
    const user = await usersService.getMe(
      req.user.user_id,
      req.user.organization_id
    );
    return sendSuccess(res, "User Fetched Successfully", user);
  } catch (err) {
    if (err.message === "User Not Found") {
      return sendError(res, "User not found", null, 404);
    }
    return sendError(res, "Failed to Fetch User", null, 500);
  }
}
//get all users
async function listUsers(req, res) {
  try {
    const users = await usersService.listUsers(req.user.organization_id);
    return sendSuccess(res, "Users List Fetched", users);
  } catch {
    return sendError(res, "Failed to Fetch Users", null, 500);
  }
}
//update status
async function updateStatus(req, res) {
  try {
    await usersService.updateStatus({
      targetUserId: parseInt(req.params.id, 10),
      newStatus: req.body.status,
      actorUserId: req.user.user_id,
      organizationId: req.user.organization_id,
    });
    return sendSuccess(res, "User Status Updated");
  } catch (err) {
    if (err.message === "Invalid Status") {
      return sendError(res, "Invalid Status Value", null, 400);
    }
    if (err.message === "Cannot Modify Self") {
      return sendError(res, "You Cannot Change Your Own Status", null, 400);
    }
    if (err.message === "User Not Found") {
      return sendError(res, "User Not Found", null, 404);
    }
    return sendError(res, "Failed To update status", null, 500);
  }
}
module.exports = {
  getMe,
  listUsers,
  updateStatus,
};
