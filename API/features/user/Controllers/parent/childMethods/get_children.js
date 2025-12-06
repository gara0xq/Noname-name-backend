const userModel = require('../../../models/user_model');
const permissionsModel = require('../../../models/permissions_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
const verifyJwt = require('../../../../../config/jwt_token_for_parent');

exports.get_children = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'token not found' });
    }

    const decoded = await verifyJwt.verifyJwt(token);
    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;

    const family = await familyModel.findById(familyId);
    if (!family) {
      return res.status(403).json({ message: 'Invalid family (from token)' });
    }

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) {
      return res.status(403).json({ message: 'Parent user not found' });
    }

    if (String(parentUser.family_id) !== String(family._id)) {
      return res.status(403).json({
        message: 'You are not allowed to show children for this family',
      });
    }

    const result = await fetchChildren(familyId);

    if (!result || !result.children || result.children.length === 0) {
      return res.status(409).json({ message: 'there is no children' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return res.status(500).json({
      message: error.message || 'Internal server error',
    });
  }
};

async function fetchChildren(familyId, permissionTitle = 'child') {
  const permission = await permissionsModel.findOne({ title: permissionTitle });
  if (!permission) return { message: 'there is no children', children: [] };

  const users = await userModel
    .find({
      family_id: familyId,
      permissions_id: permission._id,
    })
    .select('_id')
    .lean();

  if (!users.length) {
    return { message: 'there is no children', children: [] };
  }

  const userIds = users.map((u) => u._id);

  const children = await childModel
    .find({ user_id: { $in: userIds } })
    .populate('user_id', 'name')
    .select('code gender points user_id birth_date');

  if (!children.length) {
    return { message: 'there is no children', children: [] };
  }

  const resultChildren = [];

  for (const child of children) {
    const progress = await fetchTaskStatusByChildId(child._id);

    resultChildren.push({
      name: child.user_id ? child.user_id.name : null,
      code: child.code,
      gender: child.gender,
      birth_date: child.birth_date,
      points: child.points ?? 0,
      pendingTask: progress.pending,
      completedTask: progress.completed,
      expiredTask: progress.expired,
      submittedTask: progress.submitted,
      declinedTask: progress.declined,
      progress: progress.progress,
    });
  }

  return {
    message: 'children fetched successfully',
    children: resultChildren,
  };
}

async function fetchTaskStatusByChildId(childId) {
  const tasks = await taskModel.find({ child_id: childId });

  if (!tasks || tasks.length === 0) {
    return {
      pending: 0,
      completed: 0,
      expired: 0,
      submitted: 0,
      declined: 0,
      progress: 0,
    };
  }

  let pending = 0;
  let completed = 0;
  let expired = 0;
  let submitted = 0;
  let declined = 0;

  const now = new Date();

  for (const t of tasks) {
    let finalStatus = t.status;

    const expireDate = t.expire_date ? new Date(t.expire_date) : null;

    if (
      expireDate &&
      expireDate < now &&
      t.status !== 'completed' &&
      t.status !== 'submitted' &&
      t.status !== 'Declined'
    ) {
      finalStatus = await updateTaskIfExpired(t);
    }

    if (finalStatus === 'pending') pending++;
    else if (finalStatus === 'completed') completed++;
    else if (finalStatus === 'expired') expired++;
    else if (finalStatus === 'submitted') submitted++;
    else if (finalStatus === 'Declined') declined++;
  }

  const total = tasks.length;
  const progress = total > 0 ? completed / total : 0;

  return {
    pending,
    completed,
    expired,
    submitted,
    declined,
    progress,
  };
}

async function updateTaskIfExpired(task) {
  const now = new Date();
  const expireDate = task.expire_date ? new Date(task.expire_date) : null;

  if (
    expireDate &&
    expireDate < now &&
    task.status !== 'completed' &&
    task.status !== 'submitted' &&
    task.status !== 'Declined'
  ) {
    await taskModel.findByIdAndUpdate(task._id, { status: 'expired' });
    return 'expired';
  }

  return task.status;
}
