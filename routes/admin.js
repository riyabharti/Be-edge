var Category = require('../model/categoryEventDetails');
var Coupon = require('../model/couponDetails');
var User = require('../model/userDetails');
var express = require('express');
var router = express.Router();
const Auth = require('../middlewares/auth');
const sha1 = require("sha1");
const GCS = require('../helpers/gcs');


//Add Events
router.post('/addEvent',Auth.authenticateAdmin, function(req,res){
    Category.findOne({category: req.body.category},(err,data)=>{
        if (err)
        {
            console.log("Event Addition Failed! Try again..",err);
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
                res.status(200).json({
                    'status':true,
                    'message':"Category Event added",
                    'data':item
                })
            }).catch(err2=>{
                console.log("Event Addition Failed! I Try again..",err2);
                res.status(200).json({
                    'status':false,
                    'message':"Event addition error",
                    'error':err2
                })
            })
        }
        else
        {
            let events = req.body.events;
            events.forEach(e => {
                e._id = Date.now()+""
            })
            data.events=[...data.events,...req.body.events];
            data.save().then(item=> {
                res.status(200).json({
                    'status':true,
                    'message':"Events added in the category",
                    'data':item
                })
            }).catch(err3=>{
                console.log("Event Addition Failed! II Try again..",err3);
                res.status(500).json({
                    'status':false,
                    'message':"Event addition error",
                    'error':err3
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
                console.log("Category Addition Failed! Try again..");
                return res.status(500).json({
                    status: false,
                    message: "Category Addition Failed! Try again..",
                    error: "Unknown"
                  });
            }
        }
    )
    .catch(err => {
        console.log("Category Addition Failed! Try again..",err);
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
            console.log("Delete Category Failed",err);
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
            console.log("Delete Category Failed");
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
            console.log("Delete Event Failed",err);
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
                .catch(err2 => {
                    console.log("Delete Event Failed",err2);
                    return res.status(500).json({
                        status: false,
                        message: "Delete Event Failed",
                        error: err2
                    });
                })
            }
            else
            {
                console.log("Delete Event Failed::INVALID");
                return res.status(500).json({
                    status: false,
                    message: "Delete Event Failed",
                    error: 'Wrong event details'
                });
            }
        }
        else
        {
            console.log("Delete Category Failed::FIND");
            return res.status(500).json({
                status: false,
                message: "Category does not exist!",
                error: 'Category find error'
            });
        }
    })
})

//Delete User
router.get("/deleteUser/:id", Auth.authenticateAdmin, (req, res) => {
    User.findByIdAndRemove(req.params.id, (err, deletedUser) => {
      if (err)
        return res.status(500).json({
          status: false,
          message: "Deleting User Failed! Server Error..",
          error: err
        });
      if(deletedUser) {
        let deletUser = async() => {
          const [files] = await GCS.getFiles({ prefix: req.params.id+'/' });
          let error = false;
          files.forEach(async (file) => {
            try {
              await file.delete();
            } catch(err) {
              error = true;
            }
          })
          return res.status(200).json({
            status: true,
            message: "Deleted successfully",
            user: deletedUser
          });
        }
        deletUser().catch(err => {
            console.log(err);
          return res.status(500).json({
            status: false,
            message: 'Cannot Delete User Files',
            error: err
          });
        });
      }
      else
        return res.status(500).json({
          status: false,
          message: "Deletion Failed",
          error: 'Unknown'
        });
    });
});

//Reset Password
router.post("/resetPassword",Auth.authenticateAdmin, (req,res)=> {
    User.findById(req.body.id, (err,item) => {
        if (err)
        return res.status(500).json({
          status: false,
          message: "Reset Password Failed! Server Error..",
          error: err
        });
        if(item)
        {
            item.password = sha1(req.body.password);
            item.save().then(data => {
                return res.status(200).json({
                    status: true,
                    message: "Password Reset successful",
                    data: data
                })
            })
            .catch(err=> {
                return res.status(500).json({
                    status: false,
                    message: "Save Password Failed! Server Error..",
                    error: err
                });
            })
        }
        else
        {
            return res.status(500).json({
                status: false,
                message: "User does not exist",
                error: "User find error"
            });
        }
    })
})

//Verify  User
router.get("/verifyUser/:id",Auth.authenticateAdmin, (req,res) => {
    User.findById(req.params.id, (err,item) => {
        if (err)
        return res.status(500).json({
          status: false,
          message: "Verify User Failed! Server Error..",
          error: err
        });
        if(item)
        {
            item.verified = true;
            item.save().then(data => {
                return res.status(200).json({
                    status: true,
                    message: "User verified successfully",
                    data: data
                })
            })
            .catch(err=> {
                return res.status(500).json({
                    status: false,
                    message: "User Verification Failed! Server Error..",
                    error: err
                });
            })
        }
        else
        {
            return res.status(500).json({
                status: false,
                message: "User does not exist",
                error: "User find error"
            });
        }
    })
})

module.exports=router;

