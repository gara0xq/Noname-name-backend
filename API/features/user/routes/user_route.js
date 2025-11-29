const express = require('express');
const router = express.Router();

const loginController = require('../Controllers/parent/parent_login');
const signUpController = require('../Controllers/parent/parent_register');

router.post('/parent/login', loginController.login);
router.post('/parent/register', signUpController.register);

module.exports = router;
