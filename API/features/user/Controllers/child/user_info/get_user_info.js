const userModel = require('../../../models/user_model');
const permissionsModel = require('../../../models/permissions_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
const jwtUtil = require('../../../../../config/jwt_token_for_child');

exports.getChildData = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'token not found' });

    let decoded;
    try {
      decoded = await jwtUtil.verifyJwt(token);
    } catch (err) {
      console.error('JWT verify error:', err);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { role, childId, userId, familyId } = decoded;

    if (!role || (role.toLowerCase && role.toLowerCase().trim() !== 'child')) {
      return res.status(403).json({ message: 'Token role is not child' });
    }

    let existingChild = null;
    if (childId) {
      existingChild = await childModel
        .findById(childId)
        .select('_id user_id code gender points birth_date')
        .lean();
    }
    if (!existingChild && userId) {
      existingChild = await childModel
        .findOne({ user_id: userId })
        .select('_id user_id code gender points birth_date')
        .lean();
    }
    if (!existingChild) {
      return res.status(404).json({ message: 'child not found' });
    }

    let user;
    if (familyId && existingChild.user_id) {
      user = await userModel.findById(existingChild.user_id).select('family_id name').lean();

      if (!user || String(user.family_id) !== String(familyId)) {
        return res.status(403).json({ message: 'Family mismatch' });
      }
    }

    const progress = await fetchTaskStatusByChildId(existingChild._id);

    return res.status(200).json({
      message: 'child fetched successfully',
      child: {
        name: user.name,
        code: existingChild.code,
        gender: existingChild.gender,
        birth_date: existingChild.birth_date,
        points: existingChild.points ?? 0,
        pendingTask: progress.pending,
        completedTask: progress.completed,
        expiredTask: progress.expired,
        submittedTask: progress.submitted,
        declinedTask: progress.declined,
        progress: progress.progress,
      },
    });
  } catch (error) {
    console.error('get_my_child error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

async function fetchTaskStatusByChildId(childId) {
  const existchild = await childModel.findById(childId).select('_id user_id code').lean();

  if (!existchild) {
    return {
      pending: 0,
      completed: 0,
      expired: 0,
      submitted: 0,
      declined: 0,
      progress: 0,
    };
  }

  const tasks = await taskModel
    .find({ child_id: existchild._id })
    .select('status expire_date')
    .lean();

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

    const expireDate = new Date(t.expire_date);
    if (
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
  const expireDate = new Date(task.expire_date);

  if (
    expireDate < now &&
    task.status !== 'completed' &&
    task.status !== 'submitted' &&
    task.status !== 'Declined'
  ) {
    await taskModel.findByIdAndUpdate(task._id, { status: 'expired' }, { new: true });
    return 'expired';
  }

  return task.status;
}
