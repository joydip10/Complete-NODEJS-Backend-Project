const mongoose= require('mongoose');
const validator= require('validator');
const bycript= require('bcryptjs');
const crypto= require('crypto');

const userSchema= new mongoose.Schema({
    name:{
        type: String,
        required:[true,'A user must have a name']        
    },
    email:{
        type:String,
        required:[true,'A user must have an email'],
        unique:true,
        lowercase:true,
        validate: [validator.isEmail,'Please provide a valid email']
    },
    photo:{
        type:String,
        default:'default.jpg'
    },
    
    role:{
        type:String,
        enum:{
            values:['admin','user','guide','lead-guide'],
            message:'Roles must be- admin, user, guide,lead-guide'
        },
        default:'user'
    },
    password:{
        type:String,
        required:[true,'A user must enter a password'],
        minlength:8,
        select:false
    },
    passwordConfirm:{
        type:String,
        required:[true,'A user must enter a password'],
        validate:{
            validator:function(val){return val===this.password},
            message: 'Passwords didn\'t match'
        },
        select: false
    },
    passwordChangedAt:Date,
    passwordResetToken:String,
    passwordResetExpires:Date,
    active:{
        type:Boolean,
        default:true,
        select:false
    }
})

//PASSWORD ENCRYPTION- Document Middleware- pre hook
userSchema.pre('save', async function (next){
    //console.log(this.isModified('password'));
    
    //If the password is modified in update or something
    if(!this.isModified('password')) return next();

    //encryption
    this.password= await bycript.hash(this.password,12);

    //delete confirm password
    this.passwordConfirm='undefined',
    next();
})

userSchema.pre('save',async function(next){
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt=Date.now()-1000;
    next();
})

//QUERY MIDDLEWARE
userSchema.pre(/^find/,function(next){
    this.find({active:{$ne:false}});
    next();
})

//instance methods- runs on the instances

//Match Password
userSchema.methods.matchPassword= async function(userEnteredPassword,originalPassword){
    return await bycript.compare(userEnteredPassword,originalPassword);
}

userSchema.methods.passwordChangedAfter=function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimeStamp=parseInt(this.passwordChangedAt.getTime()/1000,10);
        return JWTTimestamp < changedTimeStamp;
    }
    //That means password has never been changed
    return false
};

userSchema.methods.randomToken=function(){
    const resetToken= crypto.randomBytes(32).toString('hex');
    this.passwordResetToken=crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires=Date.now()+10*60*1000;

    return resetToken;
}

//MODEL
const User= mongoose.model('User',userSchema);

module.exports=User;