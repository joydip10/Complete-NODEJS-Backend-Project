const express=require('express');
const { route } = require('../app');
const handler=require('../Controllers/tourController');
const authHandler=require('../Controllers/authUser');
const reviewRouter=require('../Routes/reviewRouter');
 
const router=express.Router();

//router.param('id',handler.checkId);

//nested routing---> add reviews to specific tours
router.use('/:tourid/reviews',reviewRouter);

router.route('/top-5-cheap')
.get(handler.getAliasTours,handler.getAllTours)

router.route('/tour-stats')
.get(handler.getTourStats)

router.route('/monthly-plan/:year')
.get(authHandler.protect,authHandler.restrictTo('admin','lead-guide','guide'),handler.getMonthlyPlan)

router.route('/tours-within/:distance/center/:latlang/unit/:unit')
.get(handler.getGeospatialTours)

router.route('/distance/:latlang/unit/:unit')
.get(handler.getdistance)

router.route('/')
.get(handler.getAllTours)
// .post(handler.checkBody,handler.createTour)
.post(authHandler.protect,authHandler.restrictTo('admin','lead-guide'),handler.createTour)

router.route('/:id')
.get(handler.getTour)
.patch(authHandler.protect,authHandler.restrictTo('admin','lead-guide'),handler.uploadTourImages,handler.resizeTourImages,handler.updateTour)
.delete(authHandler.protect,authHandler.restrictTo('admin','lead-guide'),handler.deleteTour)

//nested route--> messy code
// router.route('/:tourid/reviews')
// .post(authHandler.protect,authHandler.restrictTo('user'),reviewHandler.createReviews)

module.exports=router;
