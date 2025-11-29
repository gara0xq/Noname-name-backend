const userModel = require('../../models/user_model');
const parentModel = require('../../models/parent_model');
const familyModel = require('../../models/family_model');
const bcrypt = require('bcryptjs');
const permissionsModel = require('../../models/permissions_model');

exports.register = async(req,res)=>{
    try {

        let {name,email,password,phone_number,family_code,title} = req.body;

        if (!name || !email || !password) {
          return res.status(400).json({ message: "name, email, password are required" });
        }

        // check family code if not exist generateUniqueFamilyCode()
        if (family_code == null) {
            family_code = await generateUniqueFamilyCode();
        } 
            let family =  await checkFamilyCode(family_code);
        

        // check email
        const existingParent = await parentModel.findOne({ email: email.toLowerCase().trim() });
        if (existingParent) {
            return res.status(409).json({ massege : 'Email already in use' });
        }

        // find family OR create one  
        if (!family) {
            family = await familyModel.create({ code: family_code });
        }

        // permission 
        let permission = await permissionsModel.findOne({ title: title });

        if (!permission) {
          permission = await permissionsModel.create({ title: title });
        }

        // create user
        const newuser = await userModel.create({
            name:name,
            family_id: family._id,
            permissions_id: [permission._id],
            created_at: new Date()
        });

        // hash pass
        const hashed_pass = await bcrypt.hash(password,10);

        // create parent
          await parentModel.create({
            user_id: newuser._id,
            email: email.toLowerCase(),
            password: hashed_pass,
            phone_number: phone_number
          });

        // response 
        return res.status(201).json({
            message: "Parent registered successfully",});

    } catch (error) {
        console.log(error);
        return res.status(500).json({ massege:error });
    }
};



// custoum functions

async function generateUniqueFamilyCode(maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); 
    const exists = await familyModel.findOne({ code }); 
    if (!exists) return code;
  }
  return false
}

async function checkFamilyCode(code) {
    if (code) {
      const family = await familyModel.findOne({ code: code });

      if (!family) {
        return null
      }

      return family;
    }
}
