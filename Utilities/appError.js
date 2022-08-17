class AppError extends Error{
    constructor(message,statusCode){
        super(message);

        this.message=message;
        this.statusCode=statusCode;
        this.status=`$(this.statusCode)`.startsWith('4')?'Error':'Failled';
        this.isOperational=true;

        Error.captureStackTrace(this,this.constructor);
    }
}

module.exports= AppError;