const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User=require('../Models/userModel');


//SCHEMA
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        trim: true,
        required: [true, 'You have forgotten to put the name'],
        minlenghth: [5, 'A tour must have a name consisting atleast of 5 characters'],
        maxlenghth: [25, 'A tour must have a name consisting atmost of 25 characters'],
        //validate:[validator.isAlpha, 'Should be Alphanumeric']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: 'string',
        trim: true,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: Easy, Medium or Difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [0, 'A tour must have atleast 0 ratings'],
        max: [5, 'A tour must have atmost 5 ratings'],
        set: val=> Math.round(val*10)/10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'Tour must have price']
    },
    priceDiscount: {
        type: Number,
        //This validator would not work for the update() functions, it would only work when creating a new file
        validate: {
            validator: function (val) {
                return val < this.price;
            },
            message: 'Discount price {{VALUE}} should be less than the original price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'Tour must have a summary']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'Tour must have a cover picture']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secret: {
        type: Boolean,
        default: false,
        select: false
    },
    startLocation: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },

    //Embedding
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    // guides:Array--> this technique for embedding

    //Child Referencing
    guides:[
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

//Setting the price and ratingsAverage field as index(Compound fields index)
tourSchema.index({price:1,ratngsAverage:-1});
//Setting the startLocation as index with 2dsphere
tourSchema.index({startLocation:'2dsphere'});


//Virtual Properties
tourSchema.virtual('durationInWeeks').get(function () {
    return this.duration / 7;
})

//virtual populate
tourSchema.virtual('reviews',{
    ref:'Review',
    foreignField:'tour',
    localField:'_id'
})
tourSchema.set('toObject', { virtuals: true })
tourSchema.set('toJSON', { virtuals: true })




//Document Middleware---> these only work for create() and save() but for not inserMany() or insertOne() or any type of  update() 
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
})

//Code for embedding the guides-->embedding
// tourSchema.pre('save',async function(next){
//     const guidesPromise= this.guides.map(async id=> User.findById(id));
//     this.guides= await Promise.all(guidesPromise);
//     next();
// })

//populate middleware
tourSchema.pre(/^find/,function(next){
    this.populate({
        path:'guides',
        select:'-_v -passwordChangedAt'
    });
    console.log(this.guides)
    next();
})

tourSchema.post('save', function (doc, next) {
    console.log(doc);
    next();
})

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
    this.find({ secret: { $ne: true } });
    this.start = new Date();
    next();
})

tourSchema.post(/^find/, function (doc, next) {
    //console.log('called!')
    //console.log(`The time required: ${new Date()-this.start} milliseconds`);
    // console.log(doc);
    next();
})

//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secret: { $ne: true } } });
//     next();
// })

//MODEL
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;