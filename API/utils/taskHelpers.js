const childModel = require('../features/user/models/child_model');
const taskModel = require('../features/user/models/tasks_model');
const userModel = require('../features/user/models/user_model');
const submittedTaskModel = require('../features/user/models/submit_model');
const approveModel = require('../features/user/models/approve_model');

async function updateTaskIfExpired(task) {
  const now = new Date();
  const expireDate = task.expire_date ? new Date(task.expire_date) : null;

  if (task.status === 'submitted') {
    return 'submitted';
  }

  if (expireDate && expireDate < now && task.status !== 'completed') {
    try {
      await taskModel.findByIdAndUpdate(task._id, { status: 'expired' });
    } catch (err) {
      
      console.error('taskHelpers.updateTaskIfExpired failed:', err);
    }
    return 'expired';
  }

  return task.status;
}

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

  const tasks = await taskModel.find({ child_id: existchild._id }).select('status expire_date').lean();

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

async function fetchTaskByChildId(childId) {
  const child = await childModel.findById(childId).populate('user_id', 'name').lean();
  if (!child) return [];

  const tasks = await taskModel.find({ child_id: childId }).sort({ created_at: -1 }).lean();
  if (!tasks || tasks.length === 0) return [];

  const mapped = [];
  for (const t of tasks) {
    const finalStatus = await updateTaskIfExpired(t);
    await deleteTaskIfApprovedExpired(t._id);
    await deleteTaskIfstatusExpired(t._id);

    mapped.push({
      id: t._id,
      title: t.title,
      description: t.description,
      punishment: t.punishment,
      points: t.points,
      status: finalStatus,
      expire_date: t.expire_date,
      created_at: t.created_at,
      child_name: child.user_id?.name || null,
    });
  }

  return mapped;
}

async function fetchTaskByChildCode(childcode, familyId) {
  const existchild = await childModel.findOne({ code: childcode });
  if (!existchild) return [];

  const currentChildUser = await userModel.findOne({ family_id: familyId, _id: existchild.user_id });
  if (!currentChildUser) {
    const err = new Error('code is incorrect');
    err.status = 404;
    throw err;
  }

  const childName = await (async function getNameById(child_id) {
    if (!child_id) return null;
    const child = await childModel.findById(child_id).populate('user_id', 'name');
    if (!child || !child.user_id) return null;
    return child.user_id.name;
  })(existchild._id);

  const tasks = await taskModel.find({ child_id: existchild._id }).lean();
  if (!tasks || tasks.length === 0) return [];

  const mapped = [];
  for (const t of tasks) {
    const finalStatus = await updateTaskIfExpired(t);

    await deleteTaskIfApprovedExpired(t._id);
    await deleteTaskIfstatusExpired(t._id);

       if(t.status == "completed" || t.status == "Declined")
      continue

    mapped.push({
      id: t._id,
      title: t.title,
      description: t.description,
      punishment: t.punishment,
      points: t.points,
      status: finalStatus,
      expire_date: t.expire_date,
      created_at: t.created_at,
      child_name: childName,
    });
  }

  return mapped;
}

async function fetchTaskByIdForChild(taskId, childAllowedId) {
  const task = await taskModel.findById(taskId).lean();
  if (!task) return null;

  const now = new Date();
  const expireDate = task.expire_date ? new Date(task.expire_date) : null;

  if (expireDate && expireDate < now && task.status !== 'completed') {
    try {
      await taskModel.findByIdAndUpdate(task._id, { status: 'expired' });
    } catch (err) {
      console.error('taskHelpers.fetchTaskByIdForChild failed to mark expired:', err);
    }
    return { expired: true };
  }

  if (String(task.child_id) !== String(childAllowedId)) return null;

  return {
    id: task._id,
    title: task.title,
    description: task.description,
    punishment: task.punishment,
    points: task.points,
    status: task.status,
    expire_date: task.expire_date,
    created_at: task.created_at,
  };
}

async function deleteTaskIfApprovedExpired(taskId) {
  try {

    const submission = await submittedTaskModel.findOne({ task_id: taskId });
    if (!submission) return; 


    const approval = await approveModel.findOne({ task_submission_id: submission._id });
    if (!approval || !approval.submitted_at) return;

    const expireDate = new Date(
      approval.submitted_at.getTime() + 5 * 24 * 60 * 60 * 1000
    );

    if (expireDate <= new Date()) {
      await Approve.deleteOne({ _id: approval._id });
      await Submit.deleteOne({ _id: submission._id });
      await Task.deleteOne({ _id: taskId });
    }
  } catch (err) {
    console.error('taskHelpers.deleteTaskIfApprovedExpired failed:', err);
  }
}


  async function deleteTaskIfstatusExpired(taskId) {
  try {
    const task = await taskModel.findById(taskId);
    if (!task) return;
    if (task.status !== 'expired') return;

    const expireDate = new Date(
      task.expire_date.getTime() + 5 * 24 * 60 * 60 * 1000
    );
    console.log("Expire Date:", expireDate);

    if (expireDate <= new Date()) {
      await taskModel.deleteOne({ _id: taskId });
    }
  } catch (err) {
    console.error('taskHelpers.deleteTaskIfApprovedExpired failed:', err);
  }
}


module.exports = {
  updateTaskIfExpired,
  fetchTaskStatusByChildId,
  fetchTaskByChildId,
  fetchTaskByChildCode,
  fetchTaskByIdForChild,
  deleteTaskIfApprovedExpired,
  deleteTaskIfstatusExpired
};
