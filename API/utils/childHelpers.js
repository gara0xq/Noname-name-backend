const permissionsModel = require('../features/user/models/permissions_model');
const userModel = require('../features/user/models/user_model');
const childModel = require('../features/user/models/child_model');

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
    .select('code gender points user_id birth_date')
    .lean();

  if (!children.length) {
    return { message: 'there is no children', children: [] };
  }

  const resultChildren = [];

  // reuse task helpers lazily to avoid circular require issues
  const { fetchTaskStatusByChildId } = require('./taskHelpers');

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

module.exports = {
  fetchChildren,
};

async function getNameById(child_id) {
  if (!child_id) return null;
  const child = await require('../features/user/models/child_model').findById(child_id).populate('user_id', 'name');
  if (!child || !child.user_id) return null;
  return child.user_id.name;
}

module.exports.getNameById = getNameById;
