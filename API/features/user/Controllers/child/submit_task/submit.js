const mongoose = require('mongoose');
const jwtUtil = require('../../../../../config/jwt_token_for_child');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
const submitModel = require('../../../models/submit_model');
require('dotenv').config();

exports.submit_task_proof = async (req, res) => {
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

    const { role, childId, userId } = decoded;
    if (!role || role.toLowerCase().trim() !== 'child') {
      return res.status(403).json({ message: 'Token role is not child' });
    }

    let existingChild = null;
    if (childId) {
      existingChild = await childModel.findById(childId).select('_id user_id code').lean();
    }
    if (!existingChild && userId) {
      existingChild = await childModel
        .findOne({ user_id: userId })
        .select('_id user_id code')
        .lean();
    }
    if (!existingChild) {
      return res.status(404).json({ message: 'child not found' });
    }

    const { taskId, proof_image_url } = req.body || {};
    if (!taskId || typeof taskId !== 'string' || !taskId.trim()) {
      return res.status(400).json({ message: 'taskId is required' });
    }
    if (!proof_image_url || typeof proof_image_url !== 'string' || !proof_image_url.trim()) {
      return res.status(400).json({ message: 'proof_image_url is required' });
    }

    const tid = taskId.trim();
    const imageUrl = proof_image_url.trim();

    if (!mongoose.Types.ObjectId.isValid(tid)) {
      return res.status(400).json({ message: 'Invalid taskId format' });
    }

    const task = await taskModel.findById(tid).lean();
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (String(task.child_id) !== String(existingChild._id)) {
      return res.status(403).json({ message: 'You are not allowed to submit for this task' });
    }

    const now = new Date();
    const expireDate = task.expire_date ? new Date(task.expire_date) : null;
    if (expireDate && expireDate < now && task.status !== 'completed') {
      return res.status(403).json({ message: 'task is expired' });
    }

    if (task.status === 'submitted') {
      return res.status(400).json({ message: 'task already submitted' });
    }

    if (task.status === 'completed') {
      return res.status(400).json({ message: 'task already completed' });
    }

    const existingSubmit = await submitModel
      .findOne({
        task_id: tid,
        child_id: existingChild._id,
      })
      .lean();

    if (existingSubmit) {
      return res.status(400).json({ message: 'You have already submitted proof for this task' });
    }

    const createdSubmit = await submitModel.create({
      task_id: tid,
      child_id: existingChild._id,
      proof_image_url: imageUrl,
      submited_at: new Date(),
    });

    const updatedTask = await taskModel
      .findByIdAndUpdate(
        tid,
        { status: 'submitted' },
        { new: true } // <- MUST BE HERE
      )
      .lean();

    return res.status(201).json({
      message: 'Proof submitted successfully',
      submission: createdSubmit,
      task: updatedTask,
    });
  } catch (error) {
    console.error('submit_task_proof error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
