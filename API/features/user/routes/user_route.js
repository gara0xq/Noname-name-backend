const express = require('express');
const router = express.Router();

const loginController = require('../Controllers/parent/parent_login');
const signUpController = require('../Controllers/parent/parent_register');
const getUser = require('../Controllers/parent/get_current');
const addChild = require('../Controllers/child/add_child')

router.post('/parent/login', loginController.login);
router.post('/parent/register', signUpController.register);
router.get('/parent/get_current', getUser.getCurrent);
router.post('/child/addChild',addChild.addChild)

module.exports = router;
