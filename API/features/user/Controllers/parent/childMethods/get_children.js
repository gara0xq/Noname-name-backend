const userModel = require('../../../models/user_model');
const permissionsModel = require('../../../models/permissions_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
const verifyJwt = require('../../../../../config/jwt_token_for_parent')

exports.get_children = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    const decoded = await verifyJwt.verifyJwt(token);

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;

    const family = await familyModel.findById(familyId);
    if (!family) {
      return res.status(403).json({ message: 'Invalid family (from token)' });
    }

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res.status(403).json({
        message: 'You are not allowed to show a child to this family',
      });
    }

    const result = await fetchAllChildren(familyId);

    if (!result.children.length) {
      return res.status(409).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error(error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

async function fetchAllChildren(familyId, permissionTitle = 'child') {
  const permission = await permissionsModel.findOne({ title: permissionTitle });
  if (!permission) {
    return {
      message: 'there is no children',
      children: []
    };
  }

  const users = await userModel.find({
    family_id: familyId,
    permissions_id: permission._id
  }).select('_id');

  if (!users.length) {
    return {
      message: 'there is no children',
      children: []
    };
  }

  const userIds = users.map(u => u._id);

  const children = await childModel
    .find({ user_id: { $in: userIds } })
    .populate('user_id', 'name')
    .select('code gender points user_id birth_date');

  if (!children.length) {
    return {
      message: 'there is no children',
      children: []
    };
  }

  const childrenWithTasks = await Promise.all(
    children.map(async (c) => {
      const status = await fetchTaskStatusByChildCode(c.code, familyId);

      return {
        name: c.user_id ? c.user_id.name : null,
        code: c.code,
        gender: c.gender,
        birth_date: c.birth_date,
        points: c.points ?? 0,
        tasks: {
          pending: status ? status.pending : 0,
          completed: status ? status.completed : 0,
          expired: status ? status.expired : 0,
          progress: status ? status.progress : 0
        }
      };
    })
  );

  return {
    message: 'children fetched successfully',
    children: childrenWithTasks
  };
}

async function fetchTaskStatusByChildCode(childcode, familyId) {
  const existchild = await childModel.findOne({ code: childcode });
  if (!existchild) return null;

  const currentChildUser = await userModel.findOne({
    family_id: familyId,
    _id: existchild.user_id
  });
  if (!currentChildUser) return null;

  const tasks = await taskModel.find({ child_id: existchild._id });

  if (!tasks || tasks.length === 0) {
    return {
      pending: 0,
      completed: 0,
      expired: 0,
      progress: 0
    };
  }

  let pending = 0;
  let completed = 0;
  let expired = 0;
  const now = new Date();

  for (const t of tasks) {
    let finalStatus = t.status;

    const expireDate = new Date(t.expire_date);
    if (expireDate < now && t.status !== "completed") {
      finalStatus = await updateTaskIfExpired(t);
    }

    if (finalStatus === "pending") pending++;
    else if (finalStatus === "completed") completed++;
    else if (finalStatus === "expired") expired++;
  }

  const total = tasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    pending,
    completed,
    expired,
    progress
  };
}

async function updateTaskIfExpired(task) {
  const now = new Date();
  const expireDate = new Date(task.expire_date);

  if (expireDate < now && task.status !== "completed") {
    await taskModel.findByIdAndUpdate(
      task._id,
      { status: "expired" },
      { new: true }
    );

    return "expired";
  }

  return task.status;
}
