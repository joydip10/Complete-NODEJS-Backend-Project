/* eslint-disable */
const express=require('express');
const handler=require('../Controllers/userController');
const authHandler=require('../Controllers/authUser');
const rateLimit= require('express-rate-limit');
const path=require('path')

const limiter=rateLimit({
    max:10,
    windowMs:15*60*1000, //15minutes
    message:"Too many requests from this IP, try again after 15 minutes!"
});

const router=express.Router();

router.post('/signup',authHandler.signup);
router.post('/login',limiter,authHandler.login);
router.get('/logout', authHandler.logout);;

router.post('/forgotPassword',authHandler.forgotPassword);
router.patch('/resetPassword/:token',authHandler.resetPassword);

//protect all routes after this middleware
router.use(authHandler.protect);

router.patch('/updatePassword', authHandler.updatePassword);
router.route('/updateMe').patch(handler.uploadUserPhoto,handler.resizeUserPhoto,handler.updateMe);
router.route('/deleteUser').delete(handler.deleteUser);

router.route('/getMe').get(handler.getMe,handler.getUser);

//only admins can access the routes after this middleware
//router.use(authHandler.restrictTo('admin'));

router.route('/')
.get(handler.getAllUsers)
.post(handler.createOne);

router.route('/:id')
.get(handler.getUser)
.patch(handler.updateUser)
.delete(handler.deleteUser)
module.exports=router;
