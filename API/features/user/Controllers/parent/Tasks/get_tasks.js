const auth = require('../../../../../utils/auth');
const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');
const parent_model = require('../../../models/parent_model');
const taskModel = require('../../../models/tasks_model');
const childModel = require('../../../models/child_model');
const taskHelpers = require('../../../../../utils/taskHelpers');
const childHelpers = require('../../../../../utils/childHelpers');

exports.get_tasks = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = await auth.verifyParentToken(req);
    } catch (err) {
      console.error('get_tasks auth error:', err);
      return res.status(err.status || 401).json({ message: err.message || 'Invalid or expired token' });
    }

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

    if (!tasks) return res.status(400).json({ message: 'there is no tasks' , tasks: [] });
    // if (Array.isArray(tasks) && tasks.length === 0 && tasks ==[]) {
    //   return res.status(200).json({ message: 'there is no tasks', tasks: [] });
    // }

    return res.status(200).json({
      message: 'tasks fetched successfully',
      tasks,
    });
  } catch (error) {
    console.error('get_tasks error:', error);
    if (error && error.code === 'NO_PARENT') {
      return res.status(404).json({ message: 'Parent not found' });
    }
    if (error && error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: error.message || 'Internal server error' });
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

  const taskIds = tasks.map((u) => u._id);
  const taskss = await taskModel.find({ _id: { $in: taskIds } });
  if (!taskss || taskss.length === 0) return res.status(400).json({ message: 'there is no tasks', tasks: [] });

  const mapped = [];
  for (const t of taskss) {
    const finalStatus = await taskHelpers.updateTaskIfExpired(t);

    const name = await childHelpers.getNameById(t.child_id);
    await taskHelpers.deleteTaskIfstatusExpired(t._id);
    await taskHelpers.deleteTaskIfApprovedExpired(t._id);
    
    if(t.status == "completed" || t.status == "Declined")
      continue

    mapped.push({
      id: t._id,
      title: t.title,
      points: t.points,
      status: finalStatus,
      expire_date: t.expire_date,
      name: name,
    });
  }

  if (mapped.length === 0) return null;

  return mapped;
}



