/* eslint-disable */
const User = require('../Models/userModel');
const catchAsync = require('../Utilities/catchAsync');
const jwt = require('jsonwebtoken');
const appError = require('../Utilities/appError');
const { promisify } = require('util');
const Email = require('../Utilities/email');
const crypto = require('crypto');
const AppError = require('../Utilities/appError');


const tokenSign = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRY });
}

const createSendToken = (user, statuscode, res) => {
    const token = tokenSign(user._id);

    //cookie
    cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie("jwt", token, cookieOptions);
    user.password = undefined;

    res.status(statuscode).json({
        status: 'success',
        token: token,
        user: { user }
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });

    //console.log(url);
    try{
        const url = `${req.protocol}://${req.get('host')}/account`;
        await new Email(newUser, url).sendWelcome();
    }catch(err){
        return next(new appError('Can\'t send you email! Sorry',400));
    }
    
    createSendToken(newUser, 201, res);
})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    //(1) check if the user inputed data is correctly entered or not
    if (!email || !password) {
        return next(new appError('User input is missing', 400));
    }
    //(2) check if the user data is correct or not
    const user = await User.findOne({ email }).select('+password'); //since in the user schema we have used select of password property to false for hiding it from the users, and here we are using the password property to match it, so we need to use '+password' to use it.

    if (!user || !(await user.matchPassword(password, user.password))) {
        return next(new appError('Passwords don\'t match or User doesn\'t exist', 401));
    }
    //(3) successful login
    createSendToken(user, 200, res);
})

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() - 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};

//mainly to check token and protect the routes
exports.protect = catchAsync(async (req, res, next) => {
    let token;
    //(1) Check if the user has the token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(new appError('You are not logged in. Please log in to access', 401));
    }
    //(2) Token Verification
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
    //(3) Check if USER still exists
    const freshUser = await User.findById(decoded.id);
    //console.log(decoded.id,freshUser);
    if (!freshUser) {
        return next(new appError('This user no longer exists', 401));
    }
    //(4) Check if user has changed password after token generation
    if (freshUser.passwordChangedAfter(decoded.iat)) {
        return next(new appError('Password was changed recently!Please Log in Again!', 401));
    }

    //Grant Access
    req.user = freshUser;
    res.locals.user = freshUser;
    console.log(freshUser.photo);
    next();
})

//isloggedin
exports.isLoggedIn = async (req, res, next) => {
    console.log('Token', req.cookies.jwt);
    if (req.cookies.jwt) {
        try {
            // 1) verify token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET_KEY
            );

            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id);

            if (!currentUser) {
                return next();
            }

            // 3) Check if user changed password after the token was issued
            if (currentUser.passwordChangedAfter(decoded.iat)) {
                return next();
            }

            // THERE IS A LOGGED IN USER
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};


exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new appError('You do not have the permission to access', 403));
        }

        next()
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    //(1)Get User information from Email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new appError('No such user found', 401));
    }
    //(2)Generate random token
    const resetToken = user.randomToken();
    await user.save({ validateBeforeSave: false });

    console.log(resetToken);

    //(3)Send it to the user's email
    // 3) Send it to user's email

    // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
        const resetURL = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/users/resetPassword/${resetToken}`;


        await new Email(user, resetURL).sendPasswordReset();
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });

    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new appError('There was an error sending the email. Try again later!'),
            500
        );
    }
}
)
exports.resetPassword = catchAsync(async (req, res, next) => {
    //(1) Get the User based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } })
    //(2) If the token hasn't expired and there is a user, reset the password
    if (!user) {
        return next(new appError('Token is invalied or expired', 400));
    }


    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validationBeforeSave: false });


    //(3) Update the passwordChangedAt property
    //(4) Login the user, send JWT token
    createSendToken(user, 200, res);
})

//this is for logged in users
exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.matchPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
});