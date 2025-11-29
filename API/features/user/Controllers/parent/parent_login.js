const bcrypt = require('bcryptjs');
const parentModel = require('../../models/parent_model');



exports.login= async (req,res) =>{
    try {

        let {email,password} = req.body;
        if ( !email || !password) {
          return res.status(400).json({ message: " email, password are required" });
        }

        const existingParent = await parentModel.findOne({ email: email.toLowerCase().trim() });
                if (existingParent) {
                    return res.status(409).json({ massege : 'Email already in use' });
                }
        const hashed_pass = await bcrypt.hash(password,10);
        const check_pass = await parentModel.find(email)
        


    

    } catch (error) {
        console.log(error);
        return res.status(500).json({ massege: 'something went wrong' });
    }
};
    
