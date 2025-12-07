const jwtUtil = require('../../../../../config/jwt_token_for_parent');
const userModel = require('../../../models/user_model');
const parentModel = require('../../../models/parent_model');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
const submitModel = require('../../../models/submit_model');
const approveModel = require('../../../models/approve_model');
require('dotenv').config();

exports.approve_task = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    let decoded;
    try {
      decoded = await jwtUtil.verifyJwt(token);
    } catch (err) {
      console.error('Token verify failed:', err);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { role, parentId, userId } = decoded || {};
    if (!role || role.toLowerCase().trim() !== 'parent') {
      return res.status(403).json({ message: 'Token role is not parent' });
    }

    let parent = null;
    if (parentId) {
      parent = await parentModel
        .findById(parentId)
        .select('_id user_id')
        .lean();
    }
    if (!parent && userId) {
      parent = await parentModel
        .findOne({ user_id: userId })
        .select('_id user_id')
        .lean();
    }
    if (!parent) {
      return res.status(404).json({ message: 'parent not found' });
    }

    const parentUser = await userModel
      .findById(parent.user_id)
      .select('_id family_id')
      .lean();

    if (!parentUser || !parentUser.family_id) {
      return res
        .status(400)
        .json({ message: 'Parent is not linked to any family' });
    }

    const parentFamilyId = parentUser.family_id;

    const { taskId } = req.params.id || {};
    if (!taskId || typeof taskId !== 'string' || !taskId.trim()) {
      return res.status(400).json({ message: 'taskId is required' });
    }
    const tid = taskId.trim();

    const task = await taskModel
      .findById(tid)
      .select('_id parent_id child_id points status')
      .lean();

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (String(task.parent_id) !== String(parent._id)) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to approve this task' });
    }


    const child = await childModel
      .findById(task.child_id)
      .select('_id user_id points')
      .lean();

    if (!child) {
      return res.status(404).json({ message: 'child not found' });
    }

    const childUser = await userModel
      .findById(child.user_id)
      .select('_id family_id')
      .lean();

    if (!childUser || !childUser.family_id) {
      return res
        .status(400)
        .json({ message: 'Child is not linked to any family' });
    }

    const childFamilyId = childUser.family_id;

    if (String(parentFamilyId) !== String(childFamilyId)) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to approve this child task' });
    }

    if (task.status === 'completed') {
      return res.status(400).json({ message: 'Task already completed' });
    }
    if (task.status === 'Declined') {
      return res.status(400).json({ message: 'Task was declined before' });
    }

    const submission = await submitModel
      .findOne({ task_id: task._id })
      .sort({ submited_at: -1 }) 
      .lean();

    if (!submission) {
      return res
        .status(400)
        .json({ message: 'No submission found for this task to approve' });
    }

    const existingApprovement = await approveModel
      .findOne({ task_submition_id: submission._id })
      .lean();

    if (existingApprovement) {
      return res
        .status(400)
        .json({ message: 'This submission is already approved' });
    }

    const redeemedPoints = Number(task.points) || 0;

    const approvement = await approveModel.create({
      task_submition_id: submission._id,
      redeemed_point: redeemedPoints,
    });

    const updatedTask = await taskModel
      .findByIdAndUpdate(
        task._id,
        { status: 'completed' }, 
        { new: true }
      )
      .lean();

    let updatedChild = await childModel
      .findByIdAndUpdate(
        child._id,
        { $inc: { points: redeemedPoints } },
        { new: true }
      )
      .lean();

    return res.status(200).json({
      message: 'Task approved successfully',
       
    });
  } catch (error) {
    console.error('approve_task error:', error);
    return res
      .status(500)
      .json({ message: error.message || 'Internal server error' });
  }
};
