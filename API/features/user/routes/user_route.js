const express = require('express');
const router = express.Router();

// =====================
// Parent controllers
// =====================

// Auth & parent info
const parentLoginController = require('../Controllers/parent/parent_login');
const parentRegisterController = require('../Controllers/parent/parent_register');
const parentGetCurrentController = require('../Controllers/parent/parentinfo/get_current');
const parentUpdatePasswordController = require('../Controllers/parent/parentinfo/update_password');
const deleteFamilyController = require('../Controllers/parent/parentinfo/delete_family');

// Child management (by parent)
const addChildController = require('../../user/Controllers/parent/childMethods/add_child');
const getChildrenController = require('../Controllers/parent/childMethods/get_children');
const getChildController = require('../../user/Controllers/parent/childMethods/get_child');
const updateChildController = require('../Controllers/parent/childMethods/update_child');
const deleteChildController = require('../Controllers/parent/childMethods/delete_child');

// Tasks (by parent)
const addTaskController = require('../../user/Controllers/parent/Tasks/add_tasks');
const getTasksController = require('../../user/Controllers/parent/Tasks/get_tasks');
const getCurrentTaskController = require('../../user/Controllers/parent/Tasks/get_current_task');
const getChildTasksController = require('../../user/Controllers/parent/Tasks/get_child_tasks');
const updateFamilyTaskController = require('../../user/Controllers/parent/Tasks/update_family_task');
const deleteTaskController = require('../Controllers/parent/Tasks/delete_task');

// Rewards (by parent)
const addRewardController = require('../Controllers/parent/rewards/add_reward');
const getRewardController = require('../Controllers/parent/rewards/get_reward');
const deleteRewardController = require('../Controllers/parent/rewards/delete_reward');
const updateRewardController = require('../Controllers/parent/rewards/update_reward');

// Task approval (by parent)
const approveTaskController = require('../Controllers/parent/approve/approve');
const disapproveTaskController = require('../Controllers/parent/approve/disapprove');

// =====================
// Child controllers
// =====================

const childLoginController = require('../Controllers/child/child_Login');
const childGetUserInfoController = require('../Controllers/child/user_info/get_user_info');
const childGetMyTasksController = require('../Controllers/child/user_tasks/get_user_task');
const childGetCurrentTaskController = require('../Controllers/child/user_tasks/get_current_task');
const childGetRewardsController = require('../Controllers/child/reward/get_all_reward');
const childRedeemRewardController = require('../Controllers/child/reward/redeem_reward');
const submitTaskProofController = require('../Controllers/child/submit_task/submit');

// =====================
// Parent routes
// =====================

// Auth
router.post('/parent/login', parentLoginController.login);
router.post('/parent/register', parentRegisterController.register);

// Parent info
router.get('/parent/get_current', parentGetCurrentController.getCurrent);
router.put('/parent/updateUserPass', parentUpdatePasswordController.updatePass);
router.delete('/parent/deleteFamily', deleteFamilyController.deleteFamily);

// Children management
router.post('/parent/addChild', addChildController.addChild);
router.get('/parent/getChildren', getChildrenController.get_children);
router.get('/parent/getChild', getChildController.get_child);
router.put('/parent/updateChild', updateChildController.updatedChild);
router.delete('/parent/deleteChild', deleteChildController.deleteChild);

// Tasks
router.post('/parent/add_task', addTaskController.addTask);
router.get('/parent/getTasks', getTasksController.get_tasks);
router.get('/parent/getCurrentTask/:id', getCurrentTaskController.get_current_task);
router.get('/parent/getChildTasks', getChildTasksController.get_child_task);
router.put('/parent/updateFamilyTask', updateFamilyTaskController.updateFamilyTask);
router.delete('/parent/deleteTask/:id', deleteTaskController.deleteTask);

// Rewards (parent side)
router.post('/parent/addReward', addRewardController.addReward);
router.get('/parent/getReward', getRewardController.getReward);
router.put('/parent/updatedReward', updateRewardController.updatedReward);
router.delete('/parent/deleteReward/:id', deleteRewardController.deletereward);

// Task approval
router.post('/parent/approve', approveTaskController.approve_task);
router.post('/parent/reject_task', disapproveTaskController.disapprove_task);

// =====================
// Child routes
// =====================    

// Auth
router.post('/child/login', childLoginController.login);

// Profile / info
router.get('/child/getUserData', childGetUserInfoController.getChildData);

// Tasks
router.get('/child/get_my_tasks', childGetMyTasksController.get_my_tasks);
router.get('/child/getCurrentTask/:id', childGetCurrentTaskController.get_current_task);
router.post('/child/submit', submitTaskProofController.submit_task_proof);

// Rewards (child side)
router.get('/child/getRewards', childGetRewardsController.get_my_rewards);
router.put('/child/redeemedReward/:id', childRedeemRewardController.redeem_my_rewards);

module.exports = router;
