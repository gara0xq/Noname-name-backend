// controllers/child/get_current_task.js
const jwtUtil = require('../../../../../config/jwt_token_for_child');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
require('dotenv').config();

exports.get_current_task = async (req, res) => {
  try {
    // Extract token
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "token not found" });


    let decoded;
    try {
      decoded = await jwtUtil.verifyJwt(token);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const { role, childId, userId } = decoded;

   
    if (!role || role.toLowerCase().trim() !== "child") {
      return res.status(403).json({ message: "Token role is not child" });
    }

    let existingChild = null;

    if (childId) {
      existingChild = await childModel
        .findById(childId)
        .select("_id user_id code")
        .lean();
    }

    if (!existingChild && userId) {
      existingChild = await childModel
        .findOne({ user_id: userId })
        .select("_id user_id code")
        .lean();
    }

    if (!existingChild) {
      return res.status(404).json({ message: "child not found" });
    }

    const { taskId } = req.body;
    if (!taskId) {
      return res.status(400).json({ message: "taskId is required" });
    }

    const task = await fetchTaskByIdForChild(taskId, existingChild._id);
    if (!task) {
      return res.status(404).json({ message: "Task not found or not yours" });
    }

    return res.status(200).json({
      message: "Task fetched successfully",
      task
    });

  } catch (error) {
    console.error("get_current_task error:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

async function fetchTaskByIdForChild(taskId, childAllowedId,res) {
  const task = await taskModel.findById(taskId).lean();
  if (!task) return null;

  const now = new Date();
  const expireDate = task.expire_date ? new Date(task.expire_date) : null;

  if (expireDate && expireDate < now && task.status !== 'completed') {

    try {
      await taskModel.findByIdAndUpdate(task._id, { status: 'expired' });
    } catch (err) {
      console.error('Failed to update task status to expired:', err);
    }
    return { expired: true };
  }

  return {
    id: task._id,
    title: task.title,
    description: task.description,
    punishment: task.punishment,
    points: task.points,
    status: task.status,
    expire_date: task.expire_date,
    created_at: task.created_at
  };
}
