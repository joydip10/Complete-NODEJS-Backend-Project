/* eslint-disable */
const Tour = require('../Models/tourModel');
const User = require('../Models/userModel');
const Booking = require('../Models/bookingModel');
const catchAsync = require('../Utilities/catchAsync');
const { promisify } = require('util');
const AppError = require('../Utilities/appError');


exports.overview = catchAsync(async (req, res) => {
    //(1)Get all tour data from our collection
    const tours = await Tour.find();

    //(2)Build Template
    //(3)Render the template with tour data from (1)

    res.status(200).render('overview', {
        title: 'all tours',
        tours
    });
})

exports.tour = catchAsync(async (req, res, next) => {
    //(1)Get the data, for the requested tour (including reviews and guides)
    const slug = req.params.slug;
    const tour = await Tour.findOne({ slug: slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    })

    if (!tour) {
        return next(new AppError('This tour doesn\'t exist', 404));
    }

    //(2)Build template
    //(3)Render templates from (1)
    res.status(200).render('tour', {
        title: tour.name,
        tour
    });
})



exports.login = (req, res) => {
    res.status(200).render('login', {
        title: 'Log in here'
    })
}

exports.signup = (req, res) => {
    res.status(200).render('signup', {
        title: 'Create New Account'
    })
}

exports.getAccount = (req, res, next) => {
    res.status(200).render('account', {
        title: 'My Account'
    })
}

exports.getMyToursPage = catchAsync(async (req, res, next) => {
    /// 1) Find all bookings
    const bookings = await Booking.find({ user: req.user.id });

    // 2) Find tours with the returned IDs
    const tourIDs = bookings.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIDs } });

    console.log(tours.length);

    res.status(200).render('overview', {
        title: 'My Tours',
        tours
    });
});
//exports.getMyToursPage=getMyToursPage;