const fs = require('fs');
const Tour = require('../Models/tourModel');
const APIFeatures = require('../Utilities/apiFeatures');
const catchAsync = require('../Utilities/catchAsync');
const appError = require('../Utilities/appError');
const objectId = require('mongoose').ObjectId;
const multer = require('multer');
const jimp= require('jimp');
const factory = require('./factory');

// const tours = JSON.parse(fs.readFileSync(`E:/[Tutorialsplanet.NET] Udemy - Node.js, Express, MongoDB & More The Complete Bootcamp 2020/codes/starter//dev-data/data/tours-simple.json`));

//function for param middleware in the tourroute
// exports.checkId = (req, res, next, val) => {
//     // tour = tours.find(el => el.id === parseInt(val));

//     if (!tour) {
//         res.status(400).json({
//             status: 'failed',
//             message: 'Invalid Id'
//         })
//     }

//     next();
// }

// exports.checkBody = (req, res, next) => {
//     const body = req.body;
//     if (!body.name || !body.price) {
//         res.status(400).json({
//             status: 'failed',
//             message: 'Missing Name or Price'
//         })
//     }
//     next();
// }
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new appError('Not an image! Please upload only images.', 400), false);
    }
};
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);

// upload.single('image') req.file
// upload.array('images', 5) req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next();
    console.log(req.files);
    
    // 1) Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    
    const imageCover=await jimp.read(req.files.imageCover[0].buffer);
    imageCover
      .resize(2000, 1333)
      .quality(60)
      .write(`./public/img/tours/${req.body.imageCover}`);
  
    // 2) Images
    req.body.images = [];
  
    await Promise.all(
      req.files.images.map(async (file, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
        const image= await jimp.read(file.buffer);
        
        image
          .resize(2000, 1333)
          .quality(90)
          .write(`./public/img/tours/${filename}`);
  
        req.body.images.push(filename);
      })
    );
  
    next();
  });
  

exports.getAliasTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
}
exports.createTour = factory.createOne(Tour);

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: "reviews" });

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour)


//get geospatial data
exports.getGeospatialTours = catchAsync(async (req, res) => {
    const { distance, latlang, unit } = req.params;
    const [lat, lang] = latlang.split(',');
    const radius = unit === 'mi' ? parseFloat(distance) / 3963.2 : parseFloat(distance) / 6378.1;

    if (!lat || !lang) {
        return next(new appError('Invalid latitudes or longitudes', 400));
    }

    const tours = await Tour.find({
        startLocation: {
            $geoWithin: { $centerSphere: [[lang, lat], radius] }
        }
    })

    res.status(200).json({
        status: 'successful',
        results: tours.length,
        data: {
            tours
        }
    })
})


//Aggregation on geospatial data
//get geospatial data
exports.getdistance = catchAsync(async (req, res) => {
    const { latlang, unit } = req.params;
    const [lat, lang] = latlang.split(',');

    if (!lat || !lang) {
        return next(new appError('Invalid latitudes or longitudes', 400));
    }

    const multiplier = unit === 'mi' ? 0.000621371 : 0.01;

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lang * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                name: 1,
                distance: 1
            }
        }
    ])

    res.status(200).json({
        status: 'successful',
        data: distances
    })
})


//Aggregaton funcitons
exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gt: 0 } }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        },
        // {
        //     $match:{_id:{$ne:'EASY'}}
        // }
    ])

    res.status(200).json({
        status: "successful",
        data: {
            stats: stats
        }
    })
})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {

    const year = req.params.year;

    const plan = await Tour.aggregate([
        {
            $unwind: "$startDates"
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTours: { $sum: 1 },
                tours: { $push: '$name' },

            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $sort: { numTours: -1 }
        },
        {
            $project: { _id: 0 }
        },
        {
            $limit: 6
        }
    ])

    res.status(200).json({
        status: "successful",
        results: plan.length,
        data: {
            plan
        }
    })
})