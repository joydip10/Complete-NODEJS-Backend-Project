class APIFeatures{
    constructor(query,querystr){
        this.query=query;
        this.querystr=querystr;
    }

    filter(){
        //Filtering
        const queryObj={...this.querystr};
        const excludeFields=['page','sort','limit','fields'];
        excludeFields.forEach(el=>delete queryObj[el]);
        
        //Advanced Filtering
        let queryStr=JSON.stringify(queryObj);
        queryStr=JSON.parse(queryStr.replace(/\b(gte|gt|lte|lt)\b/g,match=>`$${match}`));
        this.query=this.query.find(queryStr);

        return this;
    }

    sort(){
        if(this.querystr.sort){
            //to remove coma from the sort query string
            const sortBy=this.querystr.sort.split(',').join(' ');
            this.query=this.query.sort(sortBy);
        }
        else{
            this.query=this.query.sort('-createdAt');
        }
        return this;
    }

    limit(){
        if(this.querystr.fields){
            const fields=this.querystr.fields.split(',').join(' ');
            this.query=this.query.select(fields);
        }
        else{
            this.query=this.query.select('-__v') //this is done to remove this __v:0 that automatically comes in mongodb
        }
        return this;
    }

    page(){
        const page= this.querystr.page*1 || 1;
        const limit= this.querystr.limit*1 || 100;
        const skip=(page-1)*limit;
        
        this.query=this.query.skip(skip).limit(limit);

        return this;
    }

}

module.exports=APIFeatures;