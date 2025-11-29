const jwt = require('jsonwebtoken');
const parentModel = require('../../models/parent_model');
const userModel = require('../../models/user_model');
const familyModel = require('../../models/family_model');

exports.getCurrent = async(req,res)=>{
    try {
        
        const authheader = req.headers['authorization']
        let user_id
        const token = authheader && authheader.split(' ')[1]
        if (token == null) {
            return res.sendStatus(401)
        }
        const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
                if (err) return reject(err);
                resolve(user);
            });
        });
            user_id = decoded.userId

        existingParent = await parentModel.findOne({user_id:user_id})
        existinguser = await userModel.findOne({_id:user_id})
        existingfamily = await familyModel.findOne({_id:existinguser.family_id})
        

        return res.status(200).json({
            email : existingParent.email,
            phone_number: existingParent.phone_number,
            name:existinguser.name,
            family_code:existingfamily.code

        });
    
        
    
        } catch (error) {
            console.log(error);
            return res.status(500).json({ massege: 'something went wrong' });
        }
    
}
   