/* eslint-disable */
const express=require('express');
const handler=require('../Controllers/viewController');
const authHandler=require('../Controllers/authUser');
const bookingHandler=require('../Controllers/bookingController');
const cookieParser = require('cookie-parser');

const router=express.Router();

router.get('/',bookingHandler.createBookingCheckout,authHandler.isLoggedIn,handler.overview)

router.get('/tour/:slug',authHandler.isLoggedIn,handler.tour)

//login
router.get('/login',authHandler.isLoggedIn,handler.login)

//Sign up
router.get('/signup', authHandler.isLoggedIn, handler.signup);

//get our own accounts
router.get('/account', authHandler.protect, handler.getAccount);

//get my booked tours
router.get('/my-tours',authHandler.protect,handler.getMyToursPage)

module.exports=router