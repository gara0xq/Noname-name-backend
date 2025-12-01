const bcrypt = require('bcryptjs');
const userModel = require('../../models/user_model');
const jwt = require('jsonwebtoken');
const childModel = require('../../models/child_model')
const permissionsModel = require('../../models/permissions_model');


exports.login= async (req,res) =>{
    try {

        let {childCode} = req.body;
        if ( !childCode) {
          return res.status(400).json({ message: " childCode  are required" });
        }

        const existingchild = await childModel.findOne({ code:childCode });

                if (!existingchild) {

                    return res.status(404).json({ message: 'childCode not found'  });
                }

        

        const existinguser = await userModel.findOne({
            _id: existingchild.user_id,
            
        })
                if (!existinguser) {

                    return res.status(404).json({ message: 'child user not found' });

                }

        const existpermission = await permissionsModel.findById(existinguser.permissions_id)


        const token = jwt.sign(
            {
                userId: existinguser._id,
                familyId:existinguser.family_id,
                childId:existingchild._id ,
                role: existpermission.title
            }, process.env.ACCESS_TOKEN_SECRET
        );
    return res.status(200).json({
        message: "Child login successful",
        token: token
});
        


    

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'something went wrong' });
    }
};
    
