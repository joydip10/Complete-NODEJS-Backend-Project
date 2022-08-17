const Review= require('../Models/reviewModel');
const factory=require('./factory');


exports.createReviewMiddleware=(req,res,next)=>{
    req.body.tour=req.params.tourid;
    req.body.user=req.user._id;
    next();
}

exports.createReview=factory.createOne(Review);
exports.getAllReviews=factory.getAll(Review);
exports.getReview=factory.getOne(Review);
exports.updateReview=factory.updateOne(Review);
exports.deleteReview=factory.deleteOne(Review);