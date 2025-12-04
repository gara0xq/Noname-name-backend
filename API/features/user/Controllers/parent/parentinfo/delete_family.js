const verifyJwt = require('../../../../../config/jwt_token_for_parent');
const family_model = require('../../../models/family_model');
const parent_model = require('../../../models/parent_model');
const permissions_model = require('../../../models/permissions_model');
const user_model = require('../../../models/user_model');
const child_model = require('../../../models/child_model');
const tasks_model = require('../../../models/tasks_model');

exports.deleteFamily = async (req, res) => {
  
  const mongoose = parent_model?.db?.mongoose || require('mongoose');
  let session;

  try {
    const authheader = req.headers['authorization'];
    const token = authheader && authheader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = await verifyJwt.verifyJwt(token);
    if (!decoded || !decoded.userId || !decoded.familyId || !decoded.parentId || !decoded.role) {
      return res.status(400).json({ message: "problem with token function" });
    }

    const userId = decoded.userId;
    const familyId = decoded.familyId;
    const role = decoded.role;
    const parentId = decoded.parentId;

    const existparent = await parent_model.findById(parentId);
    if (!existparent) return res.status(404).json({ message: "no such parent" });

    const existuser = await user_model.findById(existparent.user_id);
    if (!existuser) return res.status(404).json({ message: "no such user" });
    if (String(existuser._id) !== String(userId)) {
      return res.status(403).json({ message: "user doesnt belong to this family" });
    }

    const existpermission = await permissions_model.findById(existuser.permissions_id);
    if (!existpermission) return res.status(404).json({ message: "no such permission" });
    if (existpermission.title !== role) return res.status(403).json({ message: "user isn't parent" });

    const existfamily = await family_model.findById(existuser.family_id);
    if (!existfamily) return res.status(404).json({ message: "no such family" });
    if (String(existfamily._id) !== String(familyId)) {
      return res.status(403).json({ message: "user isn't in the family" });
    }

    // start transaction
    session = await mongoose.startSession();
    session.startTransaction();
    try {
      // find children of the family
      const children = await child_model.find({ family_id: familyId }).session(session);
      const childIds = children.map(c => c._id);

      // delete tasks for these children
      if (childIds.length > 0) {
        await tasks_model.deleteMany({ child_id: { $in: childIds } }, { session });
      }

      // delete children
      await child_model.deleteMany({ family_id: familyId }, { session });

      // delete parents
      await parent_model.deleteMany({ family_id: familyId }, { session });

      // delete users
      await user_model.deleteMany({ family_id: familyId }, { session });

      // delete family
      const deleted = await family_model.findByIdAndDelete(familyId).session(session);
      if (!deleted) {
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
      return res.status(500).json({ message: 'Could not delete family and related data', error: txErr.message });
    }
  } catch (error) {
    if (session) {
      try { await session.abortTransaction(); session.endSession(); } catch (_) {}
    }
    console.error('deleteFamily error:', error);
    return res.status(500).json({ status: false, message: 'Something went wrong', error: error.message });
  }
};
