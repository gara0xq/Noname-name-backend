const express = require('express');
const router = express.Router();

const loginController = require('../Controllers/parent/parent_login');
const signUpController = require('../Controllers/parent/parent_register');
const getUser = require('../Controllers/parent/parentinfo/get_current');
const addChild = require('../../user/Controllers/parent/childMethods/add_child')
const getChildren = require('../Controllers/parent/childMethods/get_children')
const getChild = require('../../user/Controllers/parent/childMethods/get_child')
const loginChildController = require('../Controllers/child/child_Login')
const addTaskcontroller = require('../../user/Controllers/parent/Tasks/add_tasks')
const getTasksController = require('../../user/Controllers/parent/Tasks/get_tasks')
const updateParentPassController = require('../../user/Controllers/parent/parentinfo/update_password')
const getTaskController = require('../../user/Controllers/parent/Tasks/get_current_task')
const getChildTasksController = require('../../user/Controllers/parent/Tasks/get_child_tasks')
const updateFamilyTask = require('../../user/Controllers/parent/Tasks/update_family_task')
const updateChildController = require('../Controllers/parent/childMethods/update_child')
const deleteChild =require('../Controllers/parent/childMethods/delete_child')
const deleteTask=require('../Controllers/parent/Tasks/delete_task')



router.post('/parent/login', loginController.login);
router.post('/parent/register', signUpController.register);
router.post('/parent/addChild',addChild.addChild)
router.post('/child/login',loginChildController.login)
router.post('/parent/add_task',addTaskcontroller.addTask)
router.get('/parent/get_current', getUser.getCurrent);
router.get('/parent/getChildren',getChildren.get_children)
router.get('/child/getChild',getChild.get_children)
router.get('/parent/getTasks',getTasksController.get_tasks)
router.get('/parent/getCurrentTask',getTaskController.get_current_task)
router.get('/parent/getChildTasks',getChildTasksController.get_child_task)
router.put('/parent/updateUserPass',updateParentPassController.updatePass)
router.put('/parent/updateFamilyTask',updateFamilyTask.updateFamilyTask)
router.put('/parent/updateChild',updateChildController.updatedChild)

router.delete('/parent/deleteChild',deleteChild.deleteChild)
router.delete('/parent/deleteTask',deleteTask.deleteTask)


module.exports = router;
