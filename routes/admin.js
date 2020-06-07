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
        //Never gets satisfied as we create category before adding events
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
            data.events=[...data.events,...req.body.events];
            data.save().then(item=> {
                res.status(200).json({
                    'status':true,
                    'message':"Events added in the category",
                    'data':item
                })
            }).catch(err=>{
                res.status(500).json({
                'status':false,
                'message':"Event addition error",
                'error':err
                })
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

//Add Category
router.post('/addCategory',Auth.authenticateAdmin,function(req,res){
    var categoryData = new Category(req.body);
    new Category(categoryData).save().then(
        item=> {
            if(item)
            {
                return res.status(200).json({
                    status: true,
                    message: "Category Addition successful",
                    data: item
                })
            }
            else
            {
                return res.status(500).json({
                    status: false,
                    message: "Category Addition Failed! Try again..",
                    error: "Unknown"
                  });
            }
        }
    )
    .catch(err => {
        return res.status(500).json({
          status: false,
          message: "Category Addition Failed! Server Error..",
          error: err
        });
      });
})

//Delete Category
router.post('/deleteCategory',Auth.authenticateAdmin,function(req,res){
    Category.findOneAndRemove({category: req.body.category},(err, deletedCategory) => {
        if (err)
        {
            return res.status(500).json({
                status: false,
                message: "Deleting Category Failed! Server Error..",
                error: err
            });
        }
        if(deletedCategory)
        {
            return res.status(200).json({
                status: true,
                message: "Deleted Category successfully",
                user: deletedCategory
              });
        }
        else
        {
            return res.status(500).json({
                status: false,
                message: "Delete Category Failed",
                error: 'Unknown'
            });
        }
    })
})

//Delete Event
router.post('/deleteEvent',Auth.authenticateAdmin,function(req,res){
    Category.findOne({category: req.body.category}, (err,item)=> {
        if(err)
        {
            return res.status(500).json({
                status: false,
                message: "Deleting Event Failed! Server Error..",
                error: err
            });
        }
        if(item)
        {
            if(item.events[req.body.index].name == req.body.eventName)
            {
                item.events.splice(req.body.index,1);
                item.save().then(item => {
                    return res.status(200).json({
                        status: true,
                        message: "Delete Event successful",
                        data: item
                    });
                })
                .catch(err => {
                    return res.status(500).json({
                        status: false,
                        message: "Delete Event Failed",
                        error: err
                    });
                })
            }
            else
            {
                return res.status(500).json({
                    status: false,
                    message: "Delete Event Failed",
                    error: 'Wrong event details'
                });
            }
        }
        else
        {
            return res.status(500).json({
                status: false,
                message: "Category does not exist!",
                error: 'Category find error'
            });
        }
    })
})

module.exports=router;
