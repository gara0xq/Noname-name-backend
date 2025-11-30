const express = require('express');
const router = express.Router();

const loginController = require('../Controllers/parent/parent_login');
const signUpController = require('../Controllers/parent/parent_register');
const getUser = require('../Controllers/parent/get_current');
const addChild = require('../Controllers/child/add_child')
const getChildren = require('../Controllers/child/get_children')

router.post('/parent/login', loginController.login);
router.post('/parent/register', signUpController.register);
router.post('/child/addChild',addChild.addChild)
router.get('/parent/get_current', getUser.getCurrent);
router.get('/child/getChildren',getChildren.get_children)

module.exports = router;
