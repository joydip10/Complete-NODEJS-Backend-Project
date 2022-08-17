const User = require('../Models/userModel');
const catchAsync = require('../Utilities/catchAsync');
const AppError = require('../Utilities/appError');
const factory = require('./factory');
const multer = require('multer');
const jimp = require('jimp');
const path=require('path');

// const multerStorage=multer.diskStorage({
//     destination: (req,file,cb)=>{
//         cb(null,`../public/img/users`);
//     },
//     filename: (req,file,cb)=>{
//         const extension=file.mimetype.split('/')[1];
//         cb(null,`user-${req.user._id}-${Date.now()}.${extension}`);
//     }
// })

//saves the image in buffer

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Uploaded file is not an image', 400), false)
    }
}


//configuring multer
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

//helping functions
const filterObj = (obj, ...allowedFields) => {
    newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.uploadUserPhoto = upload.single('photo');

//resize middleware
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();
    
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    var image= await jimp.read(req.file.buffer);
    
    image.resize(500, 500)
    .quality(60)
    .write(`./public/img/users/${req.file.filename}`);

    next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
    console.log('Req.file', req.file, "\n");
    console.log('Req.body', req.body, "\n");

    //(1) Create an error if user tries to update password
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for updating password. Please use /updatePassword route', 400));
    }
    //(2) Update Document

    obj = filterObj(req.body, "name", "email");
    if (req.file) obj.photo = req.file.filename;

    //Filtering out unwanted fields-->e.g role 
    //now if we update role by using "role":"admin"--> it won't get updated
    const updatedUser = await User.findByIdAndUpdate(req.user._id, obj, { new: true, runValidators: true });
    console.log(updatedUser);

    res.status(200).json({
        status: 'success',
        data: {
            updatedUser
        }
    })
})

exports.getMe = (req, res, next) => {
    req.params.id = req.user._id;
    next();
}


exports.createOne = factory.createOne(User);

exports.getUser = factory.getOne(User);

exports.getAllUsers = factory.getAll(User);

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);