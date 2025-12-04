const verifyJwt = require('../../../../../config/jwt_token_for_parent');
const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');
const parent_model = require('../../../models/parent_model');
const taskModel = require('../../../models/tasks_model');
const childModel = require('../../../models/child_model');

exports.get_tasks = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = await verifyJwt.verifyJwt(token);

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;
    const parentId = decoded.parentId;

    const family = await familyModel.findById(familyId);
    if (!family) return res.status(403).json({ message: 'Invalid family' });

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const tasks = await fetchAlltasks(parentId);

    if (!tasks) return res.status(404).json({ message: 'Parent not found' });
    if (Array.isArray(tasks) && tasks.length === 0) {
      return res.status(200).json({ message: 'there is no tasks', tasks: [] });
    }

    return res.status(200).json({
      message: 'tasks fetched successfully',
      tasks
    });
  } catch (error) {
    if (error && error.code === 'NO_PARENT') {
      return res.status(404).json({ message: 'Parent not found' });
    }
    if (error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return res.status(500).json({ message: error.message });
  }
};

async function fetchAlltasks(parentId) {
  const parent = await parent_model.findById(parentId);
  if (!parent) {
    const e = new Error('NO_PARENT');
    e.code = 'NO_PARENT';
    throw e;
  }

  const tasks = await taskModel.find({ parent_id: parentId }).select('_id');
  if (!tasks || tasks.length === 0) return [];

  const taskIds = tasks.map(u => u._id);
  const taskss = await taskModel.find({ _id: { $in: taskIds } });
  if (!taskss || taskss.length === 0) return [];

  const tasksss = await Promise.all(
    taskss.map(async t => {
      const name = await getNameById(t.child_id);
      return {
        id: t._id,
        title: t.title,
        points: t.points,
        status: t.status,
        expire_date: t.expire_date,
        name: name
      };
    })
  );

  return tasksss;
}

async function getNameById(child_id) {
  if (!child_id) return null;
  const child = await childModel.findById(child_id).populate('user_id', 'name');
  if (!child || !child.user_id) return null;
  return child.user_id.name;
}
