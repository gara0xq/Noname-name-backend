const verifyJwt = require('../../../../../config/jwt_token_for_parent');
const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const tasks_model = require('../../../models/tasks_model');

exports.deleteTask = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = await verifyJwt.verifyJwt(token);
    if (!decoded || !decoded.userId || !decoded.familyId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;

    let taskId = req.params.id;
    if (!taskId) return res.status(400).json({ message: 'taskId is required' });
    taskId = String(taskId).trim();

    const family = await familyModel.findById(familyId);
    if (!family) return res.status(403).json({ message: 'Invalid family (from token)' });

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to delete a task from this family' });
    }

    const existtask = await tasks_model.findById(taskId);
    if (!existtask) return res.status(404).json({ message: 'Task not found by taskId' });

    if (existtask.child_id) {
      const child = await childModel.findById(existtask.child_id);
      if (!child) return res.status(404).json({ message: 'Child for this task not found' });

      if (child.family_id && String(child.family_id) !== String(family._id)) {
        return res.status(403).json({ message: 'Task does not belong to this family' });
      }

      const currentChildUser = await userModel.findOne({
        family_id: familyId,
        _id: child.user_id,
      });
      if (!currentChildUser)
        return res.status(404).json({ message: 'Child does not belong to this family' });
    }

    const delRes = await tasks_model.deleteOne({ _id: existtask._id });
    if (delRes.deletedCount === 0) {
      return res.status(500).json({ message: 'Failed to delete task' });
    }

    return res.status(200).json({
      message: 'Task deleted successfully',
      deleted: { taskDeleted: delRes.deletedCount, task_id: existtask._id },
    });
  } catch (error) {
    console.error('deleteTask error:', { message: error.message, stack: error.stack });
    if (error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
