const app=require('./app.js');
const dotenv=require('dotenv');
const mongoose=require('mongoose');

dotenv.config({path:'./config.env'});

process.on('uncaughtException',err=>{
    console.log(err.name,err.message);
    console.log('Application closing.....');
    process.exit(1);
})


const port=process.env.PORT||3000;

//MongoDB connection
const db=process.env.DATABASE.replace('<USER>',process.env.DATABASE_USER).replace('<PASSWORD>',process.env.DATABASE_PASSWORD);

mongoose.connect(db).then(con=>{console.log('DB connected successfully!');})


const server=app.listen(port,()=>{
    console.log(`App open at ${port}`);
})
process.on('unhandledRejection',err=>{
    console.log(err.name,err.message);
    console.log('Application closing.....');
    server.close(()=>{
        process.exit(1);
    })
})


//console.log(app.get('env'));
//console.log(process.env);
//console.log(process.env.NODE_ENV);
