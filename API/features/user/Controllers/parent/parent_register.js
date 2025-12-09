const userModel = require('../../models/user_model');
const parentModel = require('../../models/parent_model');
const familyModel = require('../../models/family_model');
const bcrypt = require('bcryptjs');
const isValidPhoneNumber = require('../../../../utils/phone_validation')
const checkFamilyCode = require('../../../../utils/family_code')
const permissionsModel = require('../../models/permissions_model');

exports.register = async (req, res) => {
  try {
    let { name, email, password, phone_number, family_code, title } = req.body;
    if(!title || title.trim() === '') {
      title = 'parent';
    }
      if (family_code !== undefined && family_code !== null) {
    family_code = String(family_code).trim();
  } else {
    family_code = '';
  }

    if (!name || !email || !password ) {
      return res.status(400).json({ message: 'phone number,name, email, password are required' });
    }

    if (phone_number && !isValidPhoneNumber.isValidPhone(phone_number)) {
      return res
        .status(400)
        .json({ message: 'Invalid phone number format' });
    }

    
    if (String(family_code) === 'undefined' || !family_code || family_code.trim() === '' ) {
      family_code = await checkFamilyCode.generateUniqueFamilyCode();
    }
    let family = await checkFamilyCode.checkFamilyCode(family_code);
    

    
    const existingParent = await parentModel.findOne({ email: email.toLowerCase().trim() });
    if (existingParent) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    
    if (!family) {
     return res.status(401).json({ message: 'Invalid family code' });
    }

    
    let permission = await permissionsModel.findOne({ title: title });

    if (!permission) {
      permission = await permissionsModel.create({ title: title });
    }

    
    const newuser = await userModel.create({
      name: name,
      family_id: family._id,
      permissions_id: [permission._id],
      created_at: new Date(),
    });

    
    const hashed_pass = await bcrypt.hash(password, 10);

    
    await parentModel.create({
      user_id: newuser._id,
      email: email.toLowerCase(),
      password: hashed_pass,
      phone_number: phone_number,
    });

    
    return res.status(201).json({
      message: 'Parent registered successfully',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error });
  }
};