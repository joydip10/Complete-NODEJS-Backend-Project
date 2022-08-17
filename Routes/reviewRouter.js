const express=require('express');
const handler=require('../Controllers/reviewController');
const authHandler=require('../Controllers/authUser');

const router=express.Router({mergeParams:true});

//protect all routes after this middleware
router.use(authHandler.protect);

router.route('/')
.get(handler.getAllReviews)
.post(authHandler.restrictTo('user'),handler.createReviewMiddleware,handler.createReview)

router.route('/:id')
.get(handler.getReview)
.delete(authHandler.restrictTo('admin'),handler.deleteReview)
.patch(authHandler.restrictTo('admin','user'),handler.updateReview)

module.exports=router;