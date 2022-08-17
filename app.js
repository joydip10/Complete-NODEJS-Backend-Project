/* eslint-disable */
const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const appError = require('./Utilities/appError');
const errorController = require('./Controllers/errorController');
const path = require('path');
const cors= require('cors');


const helmet = require('helmet');
const NoSQLsanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

dotenv.config({ path: './config.env' });
const app = express();


//pug template
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//(1) ROUTERS
const tourRouter = require('./Routes/tourRoutes');
const userRouter = require('./Routes/userRoutes');
const reviewRouter = require('./Routes/reviewRouter');
const viewRouter = require('./Routes/viewRouter');
const bookingRouter=require('./Routes/bookingRouter');
//(2) MIDDLEWARES

//Using https headers- for preventing cross site scripting(XSS) attacks (helmet contains 14 other middlewares)
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: {
        allowOrigins: ['*']
    },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ['*'],
            scriptSrc: ["* data: 'unsafe-eval' 'unsafe-inline' blob:"]
        }
    }
}))

//cors
app.use(cors());

const reqTime = (req, res, next) => {
    req.time = new Date().toISOString();
    next();
}

//RATE LIMITING- security best practises (prevents brute force, DOS attack)
//we use limiter at the user routes to rate limit the login

//Body parser- limited to 10kb data payload- 
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//Sanitize for NoSQL injection
app.use(NoSQLsanitize());
//Sanitize for XSS scripts
app.use(xss());

//Parameter pollution prevention--> whitelisted params wont be considered
app.use(hpp({
    whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', 'maxGroupSize', 'difficulty', 'price']
}));

app.use(reqTime);

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

//middleware for rendering static files
app.use(express.static(path.join(__dirname, 'public')));

//app.use(express.static(__dirname +`public`))

//Middleware for routers
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
    const err = new appError(`Can't find the ${req.originalUrl} route`, 400);
    next(err);
})

app.use(errorController.errorHandler);


module.exports = app;