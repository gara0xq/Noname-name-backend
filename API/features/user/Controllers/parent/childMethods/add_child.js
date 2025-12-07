const verifyJwt = require('../../../../../config/jwt_token_for_parent');
const userModel = require('../../../models/user_model');
const permissionsModel = require('../../../models/permissions_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');

exports.addChild = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    const decoded = await verifyJwt.verifyJwt(token, res);

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;

    let { name, gender, title, birthDate } = req.body;
    if (!name || !gender || !birthDate) {
      return res.status(400).json({
        message: 'name and gender and birthDate are required',
      });
    }

    const parentUserDoc = await userModel.findById(parentUserId);
    if (parentUserDoc.name && parentUserDoc.name.trim().toLowerCase() === name.toLowerCase()) {
      return res.status(409).json({ message: "child name can't be the same as parent name" });
    }

    name = String(name).trim();
    gender = String(gender).trim().toLowerCase();
    birthDate = new Date(birthDate);
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({ message: 'Invalid birthDate format' });
    }

    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: 'gender must be male, female ' });
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

    const existingSameName = await userModel.findOne({
      family_id: family._id,
      name: { $regex: `^${name}$`, $options: 'i' },
    });

    if (existingSameName) {
      return res.status(409).json({
        message: 'A user with this name already exists in the family',
      });
    }

    const permissionTitle = title ? String(title).trim() : 'child';
    let permission = await permissionsModel.findOne({ title: permissionTitle });
    if (!permission) {
      permission = await permissionsModel.create({ title: permissionTitle });
    }

    const newUser = await userModel.create({
      name,
      family_id: family._id,
      permissions_id: [permission._id],
      created_at: new Date(),
    });

    const childCode = await generateUniqueChildCode();
    if (!childCode) {
      return res.status(500).json({
        message: 'Could not generate unique child code, try again',
      });
    }

    const child = await childModel.create({
      user_id: newUser._id,
      gender,
      code: childCode,
      birth_date: birthDate,
    });

    return res.status(201).json({
      message: 'Child added successfully',
      child: {
        user_id: newUser._id,
        name: newUser.name,
        family_id: newUser.family_id,
        child_code: childCode,
        gender: child.gender,
        birthDate: birthDate,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || 'Internal server error',
    });
  }
};

async function generateUniqueChildCode(maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const exists = await childModel.findOne({ code });
    if (!exists) return code;
  }
  return null;
}
