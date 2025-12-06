
const jwtUtil = require('../../../../../config/jwt_token_for_parent');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
const submitModel = require('../../../models/submit_model');
const parent_model = require('../../../models/parent_model');
const familyModel = require('../../../models/family_model');
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

    const { role, parentId, userId } = decoded;
    if (!role || role.toLowerCase().trim() !== 'parent') {
      return res.status(403).json({ message: 'Token role is not parent' });
    }

    let existingParent = null;
    if (parentId) {
      existingParent = await parent_model
        .findById(parentId)
        .select('_id user_id family_id')
        .lean();
    }
    if (!existingParent && userId) {
      existingParent = await parent_model
        .findOne({ user_id: userId })
        .select('_id user_id family_id')
        .lean();
    }
    if (!existingParent) {
      return res.status(404).json({ message: 'parent not found' });
    }

    const { taskId } = req.body || {};
    if (!taskId || typeof taskId !== 'string' || !taskId.trim()) {
      return res.status(400).json({ message: 'taskId is required' });
    }

    const tid = taskId.trim();

    const task = await taskModel.findById(tid).lean();
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const child = await childModel
      .findById(task.child_id)
      .select('_id family_id code')
      .lean();

    if (!child) {
      return res.status(404).json({ message: 'child not found' });
    }

    if (!existingParent.family_id || !child.family_id) {
      return res
        .status(400)
        .json({ message: 'parent or child is not linked to a family' });
    }

    if (String(existingParent.family_id) !== String(child.family_id)) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to approve this child task' });
    }

    if (task.status === 'completed') {
      return res.status(400).json({ message: 'task already completed' });
    }

    if (task.status !== 'submitted') {
      return res
        .status(400)
        .json({ message: 'task must be in submitted status to approve' });
    }

    const submitDoc = await submitModel
      .findOne({ task_id: tid, child_id: child._id })
      .lean();

    if (!submitDoc) {
      return res
        .status(400)
        .json({ message: 'No submission found for this task to approve' });
    }

    const approvedSubmit = await submitModel
      .findByIdAndUpdate(
        submitDoc._id,
        {
          status: 'approved',
          approved_at: new Date(),
          approved_by: existingParent._id,
        },
        { new: true }
      )
      .lean();

    const updatedTask = await taskModel
      .findByIdAndUpdate(
        tid,
        { status: 'completed' },
        { new: true }
      )
      .lean();

    return res.status(200).json({
      message: 'Task approved successfully',
      submission: approvedSubmit,
      task: updatedTask,
    });
  } catch (error) {
    console.error('approve_task error:', error);
    return res
      .status(500)
      .json({ message: error.message || 'Internal server error' });
  }
};
