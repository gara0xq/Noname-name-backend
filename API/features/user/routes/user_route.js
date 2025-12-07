const express = require('express');
const router = express.Router();

const loginController = require('../Controllers/parent/parent_login');
const signUpController = require('../Controllers/parent/parent_register');
const getUser = require('../Controllers/parent/parentinfo/get_current');
const addChild = require('../../user/Controllers/parent/childMethods/add_child');
const getChildren = require('../Controllers/parent/childMethods/get_children');
const getChild = require('../../user/Controllers/parent/childMethods/get_child');
const loginChildController = require('../Controllers/child/child_Login');
const addTaskcontroller = require('../../user/Controllers/parent/Tasks/add_tasks');
const getTasksController = require('../../user/Controllers/parent/Tasks/get_tasks');
const updateParentPassController = require('../../user/Controllers/parent/parentinfo/update_password');
const getTaskController = require('../../user/Controllers/parent/Tasks/get_current_task');
const getChildTasksController = require('../../user/Controllers/parent/Tasks/get_child_tasks');
const updateFamilyTask = require('../../user/Controllers/parent/Tasks/update_family_task');
const updateChildController = require('../Controllers/parent/childMethods/update_child');
const deleteChild = require('../Controllers/parent/childMethods/delete_child');
const deleteTask = require('../Controllers/parent/Tasks/delete_task');
const deleteFamily = require('../Controllers/parent/parentinfo/delete_family');
const addReward = require('../Controllers/parent/rewards/add_reward');
const getReward = require('../Controllers/parent/rewards/get_reward');
const deleteReward = require('../Controllers/parent/rewards/delete_reward');
const updatedReward = require('../Controllers/parent/rewards/update_reward');
const getUserData = require('../Controllers/child/user_info/get_user_info');
const get_my_tasks = require('../Controllers/child/user_tasks/get_user_task');
const get_current_task = require('../Controllers/child/user_tasks/get_current_task');
const get_my_rewards = require('../Controllers/child/reward/get_all_reward');
const redeem_my_rewards = require('../Controllers/child/reward/redeem_reward');
const submit_task_proof = require('../Controllers/child/submit_task/submit');
const approve_task = require('../Controllers/parent/approve/approve');
const disapprove_task = require('../Controllers/parent/approve/disapprove');

// POST methode
router.post('/parent/login', loginController.login);
router.post('/parent/register', signUpController.register);
router.post('/parent/addChild', addChild.addChild);
router.post('/child/login', loginChildController.login);
router.post('/parent/add_task', addTaskcontroller.addTask);
router.post('/parent/addReward', addReward.addReward);
router.post('/child/submit', submit_task_proof.submit_task_proof);
router.post('/parent/approve/:id', approve_task.approve_task);
router.post('/parent/reject_task/:id', disapprove_task.disapprove_task);

// GET methode
router.get('/parent/get_current', getUser.getCurrent);
router.get('/parent/getChildren', getChildren.get_children);
router.get('/child/getChild', getChild.get_child);
router.get('/parent/getTasks', getTasksController.get_tasks);
router.get('/parent/getCurrentTask/:id', getTaskController.get_current_task);
router.get('/parent/getChildTasks', getChildTasksController.get_child_task);
router.get('/parent/getReward', getReward.getReward);
router.get('/child/getUserData', getUserData.getChildData);
router.get('/child/get_my_tasks', get_my_tasks.get_my_tasks);
router.get('/child/getCurrentTask/:id', get_current_task.get_current_task);
router.get('/child/getRewards', get_my_rewards.get_my_rewards);

// PUT methode
router.put('/parent/updateUserPass', updateParentPassController.updatePass);
router.put('/parent/updateFamilyTask', updateFamilyTask.updateFamilyTask);
router.put('/parent/updateChild', updateChildController.updatedChild);
router.put('/parent/updatedReward', updatedReward.updatedReward);
router.put('/child/redeemedReward/:id', redeem_my_rewards.redeem_my_rewards);

// DELETE methode
router.delete('/parent/deleteChild', deleteChild.deleteChild);
router.delete('/parent/deleteTask/:id', deleteTask.deleteTask);
router.delete('/parent/deleteFamily', deleteFamily.deleteFamily);
router.delete('/parent/deleteReward/:id', deleteReward.deletereward);

module.exports = router;
