const appError = require('../Utilities/appError');
const handleErrorDb = (err) => {
    return new appError(`Invalid ${err.path}: ${err.value}`, 400);
}
const handleDuplicateErrorDb = (err) => {
    const message = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
    return new appError(`Duplicate field value: ${message},use another value for this field`, 400);
}
const handleValidationDb = (err) => {
    const messages = Object.values(err.errors).map(el => el.message);
    return new appError(`${messages.join('. ')}`, 400);
}

const handleJSONErrorDb = () => {
    return new appError('Invalid Token! Please Log in again!', 401);
}

const handleTokenExpiryErrorDb = () => {
    return new appError('Time Expired! Please login again', 401);
}


const sendErrorDev = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            stack: err.stack,
            ERROR: err
        })
    }
    else {
        res.status(err.statusCode).render('error', {
            title: 'Something Went Wrong',
            message: err.message
        })
    }

}

const sendErrorProd = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        //Operational Error to send it to the client
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            })
        }
        //Programming Error to send it to the client
        else {
            res.status(500).json({
                status: 500,
                message: 'Something went very wrong'
            })
        }
    }
    else {
        res.status(err.statusCode).render('error', {
            title: 'Something Went Wrong',
            message: "Try Again Later"
        })
    }
}


exports.errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    }

    else {
        if (err.name === 'CastError') err = handleErrorDb(err);
        if (err.code === 11000) err = handleDuplicateErrorDb(err);
        if (err.name === 'ValidationError') err = handleValidationDb(err);
        if (err.name === 'JsonWebTokenError') err = handleJSONErrorDb();
        if (err.name === 'TokenExpiredError') err = handleTokenExpiryErrorDb();
        sendErrorProd(err, req, res);
    }
}