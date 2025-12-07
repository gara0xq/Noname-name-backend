const auth = require('../../../../../utils/auth');
const family_model = require('../../../models/family_model');
const parent_model = require('../../../models/parent_model');
const permissions_model = require('../../../models/permissions_model');
const user_model = require('../../../models/user_model');
const child_model = require('../../../models/child_model');
const tasks_model = require('../../../models/tasks_model');
const redeem_model = require('../../../models/reward_model');
const submit_model = require('../../../models/submit_model');
const approve_model = require('../../../models/approve_model');

exports.deleteFamily = async (req, res) => {
  const mongoose = parent_model?.db?.mongoose || require('mongoose');
  let session;

  try {
    let decoded;
    try {
      decoded = await auth.verifyParentToken(req);
    } catch (err) {
      console.error('deleteFamily auth error:', err);
      return res.status(err.status || 401).json({ message: err.message || 'Invalid or expired token' });
    }

    const userId = decoded.userId;
    const familyId = decoded.familyId;
    const role = decoded.role;
    const parentId = decoded.parentId;

    const existparent = await parent_model.findById(parentId);
    if (!existparent) return res.status(404).json({ message: 'no such parent' });

    const existuser = await user_model.findById(existparent.user_id);
    if (!existuser) return res.status(404).json({ message: 'no such user' });

    if (String(existuser._id) !== String(userId)) {
      return res.status(403).json({ message: 'user doesnt belong to this family' });
    }

    const existpermission = await permissions_model.findById(existuser.permissions_id);
    if (!existpermission) return res.status(404).json({ message: 'no such permission' });
    if (String(existpermission.title).toLowerCase() !== String(role).toLowerCase()) {
      return res.status(403).json({ message: "user isn't parent" });
    }

    const existfamily = await family_model.findById(existuser.family_id);
    if (!existfamily) return res.status(404).json({ message: 'no such family' });

    if (String(existfamily._id) !== String(familyId)) {
      return res.status(403).json({ message: "user isn't in the family" });
    }


    session = await parent_model.db.startSession();
    session.startTransaction();

    try {
      const users = await user_model.find({ family_id: familyId }).session(session);
      const userIds = users.map((u) => u._id);
      const permissionIds = users.map((u) => u.permissions_id).filter((id) => !!id);

      const parents = await parent_model.find({ family_id: familyId }).session(session);
      const parentIds = parents.map((p) => p._id);

      const children = await child_model.find({ family_id: familyId }).session(session);
      const childIds = children.map((c) => c._id);

      const tasks = await tasks_model
        .find({
          $or: [{ child_id: { $in: childIds } }, { parent_id: { $in: parentIds } }],
        })
        .session(session);
      const taskIds = tasks.map((t) => t._id);

      const submissions = await submit_model.find({ task_id: { $in: taskIds } }).session(session);
      const submissionIds = submissions.map((s) => s._id);

      if (submissionIds.length > 0) {
        await approve_model.deleteMany({ submission_id: { $in: submissionIds } }, { session });
      }

      if (taskIds.length > 0) {
        await submit_model.deleteMany({ task_id: { $in: taskIds } }, { session });
      }

      if (taskIds.length > 0) {
        await tasks_model.deleteMany({ _id: { $in: taskIds } }, { session });
      }

      if (childIds.length > 0) {
        await redeem_model.deleteMany({ child_id: { $in: childIds } }, { session });
      }

      if (parentIds.length > 0) {
        await parent_model.deleteMany({ _id: { $in: parentIds } }, { session });
      }

      if (childIds.length > 0) {
        await child_model.deleteMany({ _id: { $in: childIds } }, { session });
      }

      if (userIds.length > 0) {
        await user_model.deleteMany({ _id: { $in: userIds } }, { session });
      }


      const deletedFamily = await family_model.findByIdAndDelete(familyId).session(session);

      if (!deletedFamily) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: 'Family not found or already deleted' });
      }

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({ message: 'Family and related data deleted successfully' });
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({
        message: 'Could not delete family and related data',
        error: txErr.message,
      });
    }
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (_) {}
    }
    console.error('deleteFamily error:', error);
    return res.status(500).json({
      status: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};
