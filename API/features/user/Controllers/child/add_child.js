const jwt = require('jsonwebtoken');
const userModel = require('../../models/user_model');
const permissionsModel = require('../../models/permissions_model');
const familyModel = require('../../models/family_model');
const childModel = require('../../models/child_model');

exports.addChild = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return reject(err);
        resolve(user);
      });
    });
    const parentUserId = decoded.userId;

    let { name, family_code, title, gender } = req.body;
    if (!name || !gender || !family_code) {
      return res.status(400).json({
        message: 'name, gender and family_code are required',
      });
    }
    name = String(name).trim();
    gender = String(gender).trim().toLowerCase();
    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: 'gender must be male, female ' });
    }

    const family = await checkFamilyCode(family_code);
    if (!family) {
      return res.status(401).json({ message: 'Invalid family code' });
    }

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent not found' });
    if (String(parentUser.family_id) !== String(family._id)) {
      return res.status(403).json({ message: 'You are not allowed to add a child to this family' });
    }

    const childrenInFamily = await userModel.find({ family_id: family._id });

    const existingSameName = childrenInFamily.find(
      u => u.name.toLowerCase() === name.toLowerCase()
    );

    if (existingSameName) {
      return res.status(409).json({ message: 'A user with this name already exists in the family' });
    }

    const permissionTitle = title ? String(title).trim() : 'child';
    let permission = await permissionsModel.findOne({ title: permissionTitle });
    if (!permission) {
      permission = await permissionsModel.create({ title: permissionTitle });
    }

    let newUser = await userModel.findOne({ name: name });
    if (!newUser) {
      newUser = await userModel.create({
        name,
        family_id: family._id,
        permissions_id: [permission._id],
        created_at: new Date(),
      });
    } else return;

    const childCode = await generateUniqueChildCode();
    if (!childCode) {
      return res.status(500).json({ message: 'Could not generate unique child code, try again' });
    }

    const child = await childModel.create({
      user_id: newUser._id,
      gender,
      code: childCode,
    });

    return res.status(201).json({
      message: 'Child added successfully',
      child: {
        user_id: newUser._id,
        name: newUser.name,
        family_id: newUser.family_id,
        child_code: childCode,
        gender: child.gender,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
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

async function checkFamilyCode(code) {
  if (!code) return null;
  return familyModel.findOne({ code });
}
