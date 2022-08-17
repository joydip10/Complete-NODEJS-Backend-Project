//review rating createdAt refToTours refToUser

const mongoose=require('mongoose');
const Tour= require('../Models/tourModel');

const reviewSchema= new mongoose.Schema({
    review:{
        type:String,
        required:[true,'A review must have desc']
    },
    rating:{
        type:Number,
        min:[0,'Minininum rating should be 0'],
        max:[5,'Maximum rating should be 5']
    },
    createdAt:{
        type:Date,
        default:Date.now
    },

    //parent referencing
    tour:{
        type:mongoose.Schema.ObjectId,
        ref:'Tour',
        required:[true,'A review must belong to a tour']
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:[true,'A review must belong to a tour']
    }
},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
})

//to prevent duplicacies in posting reviews
reviewSchema.index({tour:1,user:1},{unique:true});

reviewSchema.pre(/^find/,function(next){
    this.populate({
        path:'user',
        select:'name photo'
    }).populate({
        path:'tour',
        select:'name'
    })
    ;
    next();
})

//Middleware to update ratingsAverage and numberofRatings on each tour, given a new review
//Static function
reviewSchema.statics.updateRatings= async function(tourId){
    const stats=await this.aggregate([
        {
            $match:{tour:tourId}
        },
        {
            $group:{
                _id:"$tour",
                avgRating:{$avg:"$rating"},
                numRating:{$sum:1}
            }
        }
    ]);

    console.log(stats);

    if(stats.length>0){
        await Tour.findByIdAndUpdate(tourId,{ratingsAverage:stats[0].avgRating,ratingsQuantity:stats[0].numRating});
    }
    else{
        await Tour.findByIdAndUpdate(tourId,{ratingsAverage:4.5,ratingsQuantity:0});
    }

    
}

// here we use this as a model after being posted or saved --> ReviewModel
reviewSchema.post('save',function(){
    this.constructor.updateRatings(this.tour);
})

//update mean and total number of ratings when reviews are updated or deleted
//we use query middleware here

reviewSchema.pre(/^findByIdAnd/, async function(next){
    this.reviewDoc= await this.findOne();
    next();
})

//now post query middleware
reviewSchema.post(/^findByIdAnd/, async function(){
    await this.reviewDoc.constructor.updateRatings(this.reviewDoc.tour);
})

const Review= mongoose.model('Review', reviewSchema);

module.exports=Review;
