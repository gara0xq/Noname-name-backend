const userModel = require('../../../models/user_model');
const permissionsModel = require('../../../models/permissions_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
const verifyJwt = require('../../../../../config/jwt_token_for_parent');

exports.get_child = async (req, res) => {
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
        message: 'You are not allowed to show a child to this family',
      });
    }

    let { code } = req.body;

    if (typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ message: 'code is required' });
    }

    code = code.trim();

    const currentChild = await childModel.findOne({ code });
    if (!currentChild) {
      return res.status(404).json({ message: 'child not found' });
    }

    const currentChildUser = await userModel.findOne({
      family_id: familyId,
      _id: currentChild.user_id,
    });

    if (!currentChildUser) {
      return res.status(404).json({ message: 'code is incorrect' });
    }

    const progress = await fetchTaskStatusByChildCode(code, familyId);

    const childResponse = {
      name: currentChildUser.name || null,
      code: currentChild.code,
      gender: currentChild.gender,
      birth_date: currentChild.birth_date,
      points: currentChild.points ?? 0,
      pendingTask: progress?.pending ?? 0,
      completedTask: progress?.completed ?? 0,
      expiredTask: progress?.expired ?? 0,
      submittedTask: progress?.submitted ?? 0,
      declinedTask: progress?.declined ?? 0,
      progress: progress?.progress ?? 0,
    };

    return res.status(200).json({
      message: 'child fetched successfully',
      child: childResponse,
    });
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

async function fetchTaskStatusByChildCode(childcode, familyId) {
  const existchild = await childModel.findOne({ code: childcode });
  if (!existchild) return null;

  const currentChildUser = await userModel.findOne({
    family_id: familyId,
    _id: existchild.user_id,
  });
  if (!currentChildUser) return null;

  const tasks = await taskModel.find({ child_id: existchild._id });

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
      t.status !== 'Declined' &&
      t.status !== 'declined'
    ) {
      finalStatus = await updateTaskIfExpired(t);
    }

    if (finalStatus === 'pending') pending++;
    else if (finalStatus === 'completed') completed++;
    else if (finalStatus === 'expired') expired++;
    else if (finalStatus === 'submitted') submitted++;
    else if (finalStatus === 'Declined' || finalStatus === 'declined') declined++;
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
    task.status !== 'Declined' &&
    task.status !== 'declined'
  ) {
    await taskModel.findByIdAndUpdate(task._id, { status: 'expired' }, { new: true });
    return 'expired';
  }

  return task.status;
}
