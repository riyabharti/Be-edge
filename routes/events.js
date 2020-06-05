var Category = require('../model/categoryEventDetails');
var express = require('express');
var router = express.Router();

/* GET events listing. */
router.get('/', function(req, res, next) {
    Category.find({},(err,item)=>{
        if(err)
        {
            return res.status(500).json({
                status: false,
                message: "Login Failed! Server Error..",
                error: err
            });
        }
        // console.log(item);
        res.status(200).json({
            status: true,
            data: item,
            message: "Events fetched successfully"
        })
    })
});

//Add Events
router.post('/addEvent', function(req,res){
    Category.findOne({category: req.body.category},(err,data)=>{
        if (err)
        {
            console.log(err);
            return res.status(500).json({
                status: false,
                message: "Login Failed! Server Error..",
                error: err
            });
        }
        if(data == null)
        {
            var newCategoryEvent = new Category(req.body);
            newCategoryEvent.save().then(item => {
                console.log(item);
                res.status(200).json({
                    'status':true,
                    'message':"Category Event added",
                    'data':item
                })
            }).catch(err=>{
                res.status(200).json({
                'status':false,
                'message':"Event addition error",
                'error':err
                })
            })
        }
        else
        {
            // data.events=[...data.events,req.body.events];
            res.status(200).json({
                'status': false,
                'message': "Category already exists"
            })
        }
    })   
});


module.exports=router;

