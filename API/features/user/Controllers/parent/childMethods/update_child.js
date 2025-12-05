const verifyJwt = require('../../../../../config/jwt_token_for_parent');
const userModel = require('../../../models/user_model');
const permissionsModel = require('../../../models/permissions_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');

exports.updatedChild = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    const decoded = await verifyJwt.verifyJwt(token);

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;

    let { name, gender, title, code, birth_date } = req.body;
    if (!name || !gender || !code || !birth_date) {
      return res.status(400).json({
        message: 'name and gender and code are required',
      });
    }

    name = String(name).trim();
    gender = String(gender).trim().toLowerCase();
    birth_date = new Date(birth_date)

    const parentUserDoc = await userModel.findById(parentUserId);
    if (parentUserDoc && parentUserDoc.name && parentUserDoc.name.trim().toLowerCase() === name.toLowerCase()) {
      return res.status(409).json({ message: "child name can't be the same as parent name" });
    }
     if (isNaN(birth_date.getTime())) {
      return res.status(400).json({ message: 'Invalid birthDate format' });
}

    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: 'gender must be male or female' });
    }

    const family = await familyModel.findById(familyId);
    if (!family) {
      return res.status(403).json({ message: 'Invalid family (from token)' });
    }

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res.status(403).json({
        message: 'You are not allowed to add a child to this family',
      });
    }

    const existchild = await childModel.findOne({ code: code });
    if (!existchild) {
      return res.status(404).json({ message: 'Child not found by code' });
    }

    const existingSameName = await userModel.findOne({
      family_id: family._id,
      name: { $regex: `^${name}$`, $options: 'i' },
    });
    if (existingSameName) {
      return res.status(409).json({ message: 'A user with this name already exists in the family' });
    }

    const permissionTitle = title ? String(title).trim() : 'child';
    let permission = await permissionsModel.findOne({ title: permissionTitle });
    if (!permission) {
      return res.status(404).json({ message: 'permission not found' });
    }

        const currentChildUser = await userModel.findOne({
          family_id : familyId,
          _id:existchild.user_id
        })
        if(!currentChildUser) return res.status(404).json({
            message: 'code is incorrect',
          });

    const updatedUser = await userModel.findByIdAndUpdate(
      existchild.user_id,
      { $set: { name: name } },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: 'Associated user for child not found' });
    }

    const updatedChild = await childModel.findOneAndUpdate(
      { code: code },
      { $set: { gender: gender ,birth_date:birth_date} },
      { new: true }
    );
    if (!updatedChild) {
      return res.status(500).json({ message: 'Failed to update child record' });
    }

    return res.status(200).json({
      message: 'Child updated successfully',
      child: {
        user_id: updatedUser._id,
        name: updatedUser.name,
        family_id: updatedUser.family_id,
        child_code: updatedChild.code,
        gender: updatedChild.gender,
        created_at: updatedUser.created_at,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || 'Internal server error',
    });
  }
};
