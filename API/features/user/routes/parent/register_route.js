const express = require('express');
const router = express.Router();

const parent_controller = require('../../Controllers/parent/parent_register');

router.post('/user/parent/register', parent_controller.register);

module.exports = router;
