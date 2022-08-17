const express=require('express');
const handler=require('../Controllers/bookingController');
const authHandler=require('../Controllers/authUser');

const router=express.Router({mergeParams:true});

//protect all routes after this middleware
router.use(authHandler.protect);

router.route('/checkout-session/:id')
.get(authHandler.protect,handler.getCheckoutSession)

router.route('/').get(authHandler.protect,handler.getMyTours);

module.exports=router;