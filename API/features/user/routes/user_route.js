const express = require('express');
const router = express.Router();

const loginController = require('../Controllers/parent/parent_login');
const signUpController = require('../Controllers/parent/parent_register');
const getUser = require('../Controllers/parent/get_current');
const addChild = require('../Controllers/parent/add_child')
const getChildren = require('../Controllers/child/get_children')
const getChild = require('../Controllers/child/get_child')
const loginChildController = require('../Controllers/child/child_Login')
const addTaskcontroller = require('../Controllers/parent/add_tasks')
const getTasksController = require('../Controllers/parent/get_tasks')
const updateParentPassController = require('../Controllers/parent/update_password')
const getTaskController = require('../Controllers/parent/get_current_task')
const getChildTasksController = require('../Controllers/parent/get_child_tasks')



router.post('/parent/login', loginController.login);
router.post('/parent/register', signUpController.register);
router.post('/parent/addChild',addChild.addChild)
router.post('/child/login',loginChildController.login)
router.post('/parent/add_task',addTaskcontroller.addTask)
router.get('/parent/get_current', getUser.getCurrent);
router.get('/child/getChildren',getChildren.get_children)
router.get('/child/getChild',getChild.get_children)
router.get('/parent/getTasks',getTasksController.get_tasks)
router.get('/parent/getCurrentTask',getTaskController.get_current_task)
router.get('/parent/getChildTasks',getChildTasksController.get_child_task)
router.put('/parent/updateUserPass',updateParentPassController.updatePass)


module.exports = router;
