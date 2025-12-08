const express = require('express');
const router = express.Router();






const parentLoginController = require('../Controllers/parent/parent_login');
const parentRegisterController = require('../Controllers/parent/parent_register');
const parentGetCurrentController = require('../Controllers/parent/parentinfo/get_current');
const parentUpdatePasswordController = require('../Controllers/parent/parentinfo/update_password');
const deleteFamilyController = require('../Controllers/parent/parentinfo/delete_family');
const forget_password = require('../Controllers/parent/forgetPassword/forget_password');
const verify_code = require('../Controllers/parent/forgetPassword/verify_code');
const change_password = require('../Controllers/parent/forgetPassword/change_password');


const addChildController = require('../../user/Controllers/parent/childMethods/add_child');
const getChildrenController = require('../Controllers/parent/childMethods/get_children');
const getChildController = require('../../user/Controllers/parent/childMethods/get_child');
const updateChildController = require('../Controllers/parent/childMethods/update_child');
const deleteChildController = require('../Controllers/parent/childMethods/delete_child');


const addTaskController = require('../../user/Controllers/parent/Tasks/add_tasks');
const getTasksController = require('../../user/Controllers/parent/Tasks/get_tasks');
const getCurrentTaskController = require('../../user/Controllers/parent/Tasks/get_current_task');
const getChildTasksController = require('../../user/Controllers/parent/Tasks/get_child_tasks');
const updateFamilyTaskController = require('../../user/Controllers/parent/Tasks/update_family_task');
const deleteTaskController = require('../Controllers/parent/Tasks/delete_task');


const addRewardController = require('../Controllers/parent/rewards/add_reward');
const getRewardController = require('../Controllers/parent/rewards/get_reward');
const deleteRewardController = require('../Controllers/parent/rewards/delete_reward');
const updateRewardController = require('../Controllers/parent/rewards/update_reward');


const approveTaskController = require('../Controllers/parent/approve/approve');
const disapproveTaskController = require('../Controllers/parent/approve/disapprove');





const childLoginController = require('../Controllers/child/child_Login');
const childGetUserInfoController = require('../Controllers/child/user_info/get_user_info');
const childGetMyTasksController = require('../Controllers/child/user_tasks/get_user_task');
const childGetCurrentTaskController = require('../Controllers/child/user_tasks/get_current_task');
const childGetRewardsController = require('../Controllers/child/reward/get_all_reward');
const childRedeemRewardController = require('../Controllers/child/reward/redeem_reward');
const submitTaskProofController = require('../Controllers/child/submit_task/submit');







router.post('/parent/login', parentLoginController.login);
router.post('/parent/register', parentRegisterController.register);
router.post('/parent/forget-password', forget_password.forgetPassword);
router.post('/parent/verify-otp', verify_code.verifyOtp);
router.put('/parent/change-password', change_password.updatePass);




router.get('/parent/get_current', parentGetCurrentController.getCurrent);
router.put('/parent/updateUserPass', parentUpdatePasswordController.updatePass);
router.delete('/parent/deleteFamily', deleteFamilyController.deleteFamily);


router.post('/parent/addChild', addChildController.addChild);
router.get('/parent/getChildren', getChildrenController.get_children);
router.get('/parent/getChild', getChildController.get_child);
router.put('/parent/updateChild', updateChildController.updatedChild);
router.delete('/parent/deleteChild', deleteChildController.deleteChild);


router.post('/parent/add_task', addTaskController.addTask);
router.get('/parent/getTasks', getTasksController.get_tasks);
router.get('/parent/getCurrentTask/:id', getCurrentTaskController.get_current_task);
router.get('/parent/getChildTasks', getChildTasksController.get_child_task);
router.put('/parent/updateFamilyTask', updateFamilyTaskController.updateFamilyTask);
router.delete('/parent/deleteTask/:id', deleteTaskController.deleteTask);


router.post('/parent/addReward', addRewardController.addReward);
router.get('/parent/getReward', getRewardController.getReward);
router.put('/parent/updatedReward', updateRewardController.updatedReward);
router.delete('/parent/deleteReward/:id', deleteRewardController.deletereward);


router.post('/parent/approve', approveTaskController.approve_task);
router.post('/parent/reject_task', disapproveTaskController.disapprove_task);






router.post('/child/login', childLoginController.login);


router.get('/child/getUserData', childGetUserInfoController.getChildData);


router.get('/child/get_my_tasks', childGetMyTasksController.get_my_tasks);
router.get('/child/getCurrentTask/:id', childGetCurrentTaskController.get_current_task);
router.post('/child/submit', submitTaskProofController.submit_task_proof);


router.get('/child/getRewards', childGetRewardsController.get_my_rewards);
router.put('/child/redeemedReward/:id', childRedeemRewardController.redeem_my_rewards);

module.exports = router;
