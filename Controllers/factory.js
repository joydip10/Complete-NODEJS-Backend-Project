const catchAsync= require('../Utilities/catchAsync');
const appError=require('../Utilities/appError');
const APIFeatures=require('../Utilities/apiFeatures');

exports.createOne = Model=> catchAsync(async (req, res, next) => {
    // const newTour=new Tour({});
    // newTour.save();
    const doc = await Model.create(req.body);
    
    res.status(201).json({
        status: 'success',
        user:req.user.email,
        time: req.time,
        data: { doc }
    })
})

exports.getAll =(Model)=> catchAsync(async (req, res,next) => {
    
    //To allow nested GET endpoint for Review 
    let filter={};
    if(req.params.tourid) filter={tour:req.params.tourid};
    
    const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limit().page();
    //Execute Query
    //if explain is needed --- const docs = await features.query.explain();  
    const docs = await features.query;
    
    if(!docs){
        return next(new appError('No document Found',400))
    }

    res.status(200).json({
        status: 'successful',
        time: req.time,
        results: docs.length,
        data: { docs }
    })
})

exports.getOne=(Model,popOptions)=>catchAsync(async (req, res,next) => {
    let query =  Model.findById(req.params.id)
    if(popOptions) query=query.populate(popOptions);

    const doc=await query;

    if(!doc){
        return next(new appError('No document Found',400))
    }

    res.status(200).json({
        status: 'successful',
        time: req.time,
        data: { doc }
    })
})

exports.updateOne=Model=>catchAsync(async (req, res,next) => {
    const updatedDoc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if(!updatedDoc){
        return next(new appError('No document Found',400))
    }

    res.status(200).json({
        status: "successful",
        time: req.time,
        data: { updatedDoc: updatedDoc }
    })
})


exports.deleteOne= Model=>catchAsync(async (req, res,next) => {
    const doc= await Model.findByIdAndDelete(req.params.id);
    
    if(!doc){
        return next(new appError('No document Found',400))
    }

    res.status(204).json({
        status: "successful",
        data: null
    })
})

