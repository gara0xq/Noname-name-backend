const verifyJwt = require('../../../../../config/jwt_token_for_parent');
const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');
const parent_model = require('../../../models/parent_model');
const childModel = require('../../../models/child_model');
const tasks_model = require('../../../models/tasks_model');

exports.updateFamilyTask = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = await verifyJwt.verifyJwt(token);

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;

    const parentId = decoded.parentId;

    const family = await familyModel.findById(familyId);
    if (!family) return res.status(403).json({ message: 'Invalid family (from token)' });

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id ? family._id : family._id)) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to perform this action for this family' });
    }

    let { title, description, points, punishment, expire_date, taskId } = req.body;
    if (!title || !description || !points || !punishment || !taskId) {
      return res.status(400).json({
        message: 'title, description, points, punishment and taskId are required',
      });
    }

    points = Number(points);
    if (Number.isNaN(points)) return res.status(400).json({ message: 'points must be a number' });

    if (expire_date) {
      const d = new Date(expire_date);
      if (isNaN(d.getTime())) return res.status(400).json({ message: 'Invalid expire_date' });
      expire_date = d;
    }

    const parentLookupId = parentId || parentUserId;
    const existParent = await parent_model.findById(parentLookupId);
    if (!existParent) return res.status(404).json({ message: 'Parent not found' });

    const existtask = await tasks_model.findById(taskId);
    if (!existtask) return res.status(404).json({ message: 'task not found' });

    if (existtask.child_id) {
      const child = await childModel.findById(existtask.child_id);
      if (!child) return res.status(404).json({ message: 'Child for this task not found' });
    }
    const updateobj = {
      parent_id: parentLookupId,
      child_id: existtask.child_id,
      title: title,
      description: description,
      points: points,
      punishment: punishment,
      expire_date: expire_date ?? existtask.expire_date,
    };

    const updateResult = await tasks_model.updateOne({ _id: taskId }, { $set: updateobj });

    if (!updateResult.acknowledged) {
      return res.status(500).json({ message: 'Failed to update task' });
    }
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'Task not found (no match for update)' });
    }

    return res
      .status(200)
      .json({ message: 'task updated successfully', modifiedCount: updateResult.modifiedCount });
  } catch (error) {
    console.error(error);
    if (error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
