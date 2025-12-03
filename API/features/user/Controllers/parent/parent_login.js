const bcrypt = require('bcryptjs');
const parentModel = require('../../models/parent_model');
const userModel = require('../../models/user_model');

const permissionsModel = require('../../models/permissions_model');
const jwtSign = require('../../../../config/jwt_token_for_parent')


exports.login= async (req,res) =>{
    try {

        let {email,password} = req.body;
        if ( !email || !password) {
          return res.status(400).json({ message: " email, password are required" });
        }

        const existingParent = await parentModel.findOne({ email: email.toLowerCase().trim() });

                if (!existingParent) {

                    return res.status(409).json({ massege : 'Email Not found' });
                }

        const match = await bcrypt.compare(password,existingParent.password)
        if (!match) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const existinguser = await userModel.findOne(existingParent.user_id)

        const existpermission = await permissionsModel.findOne(existinguser.permissions_id)
        const token = await jwtSign.signJwt(existingParent,existinguser,existpermission)

        return res.status(201).json({
            token:token
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ massege: 'something went wrong' });
    }
};
    
