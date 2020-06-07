var Category = require('../model/categoryEventDetails');
var Coupon = require('../model/couponDetails');
var User = require('../model/userDetails');
var express = require('express');
var router = express.Router();
const Auth = require('../middlewares/auth');


//Add Events
router.post('/addEvent',Auth.authenticateAdmin, function(req,res){
    Category.findOne({category: req.body.category},(err,data)=>{
        if (err)
        {
            console.log(err);
            return res.status(500).json({
                status: false,
                message: "Add Event Failed! Server Error..",
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

//Add Coupon
router.post('/addCoupon',Auth.authenticateAdmin, function(req,res){
    var couponData = req.body;
    new Coupon(couponData).save().then(
        newCoupon => {
            if(newCoupon)
            {
                return res.status(200).json({
                    status: true,
                    message: "Coupon added successfully :)",
                    coupon: newCoupon
                });
            }
            else
            {
                return res.status(500).json({
                    status: false,
                    message: "Coupon addition",
                    error: "Unknown"
                });
            }
        },
    )
    .catch(err => {
        return res.status(500).json({
          status: false,
          message: "Coupon Addition Failed! Server Error..",
          error: err
        });
    });
})

//Get All Coupons
router.get('/getAllCoupons',Auth.authenticateAdmin, function(req,res){
    Coupon.find({},(err,item) => {
        if(err)
        {
            return res.status(500).json({
                status: false,
                message: "Coupon loading Failed! Server Error..",
                error: err
            });
        }
        return res.status(200).json({
            status: true,
            message: "Coupon loading successful",
            coupons: item
        })
    })
})

//Fetch All Users
router.get('/fetchUsers',Auth.authenticateAdmin, function(req,res){
    User.find({},(err,users)=> {
        if (err)
        {
            return res.status(500).json({
                status: false,
                message: "Fetching Users Failed! Server Error..",
                error: err
            });
        }
        return res.status(200).json({
        status: true,
        message: "Fetched successfully",
        users: users
        });
    })
})


module.exports=router;

