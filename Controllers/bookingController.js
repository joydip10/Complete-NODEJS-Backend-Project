const Tour = require('../Models/tourModel');
const Booking=require('../Models/bookingModel');
const catchAsync = require('../Utilities/catchAsync');
const AppError = require('../Utilities/appError');
const factory = require('./factory');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    //(1)Get the currently booked tour
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
        return next(new AppError('No such tour found', 400));
    }

    //(2)Create Checkout Session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.id}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.id,
        mode:'payment',
        line_items: [
            {
                price_data:{
                    currency:'usd',
                    unit_amount:tour.price,
                    product_data:{
                        name:`${tour.name} Tour`,
                        description:tour.summary,
                        images: [
                            `https://www.natours.dev/img/tours/${tour.imageCover}`
                        ],
                    }
                }, 
                quantity: 1
            }
        ]
    })

    //(3)Send the session as response
    res.status(200).json({
        status: 'success',
        session: session
    })
})

exports.createBookingCheckout = catchAsync(async(req,res,next) => {
    const {tour,user,price}=req.query;
    
    if(!tour || !user || !price) return next();

    await Booking.create({tour,user,price});
    res.redirect(req.originalUrl.split('?')[0]);

    next();
});

exports.getMyTours=catchAsync(async(req,res,next)=>{
    //const bookedTours= await Booking.find({email: req.params.email});
    const bookedTours= await Booking.find({});
    res.status(200).json({
        status:'success',
        bookings: bookedTours
    })
    next();
})