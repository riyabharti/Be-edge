var Category = require('../model/categoryEventDetails');
var Coupon = require('../model/couponDetails');
var User = require('../model/userDetails');
var Query = require('../model/queryDetails');
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
router.get('/fetchUsers/:num',Auth.authenticateAdmin, function(req,res){
    User.find({},(err,users)=> {
        if (err)
        {
            return res.status(500).json({
                status: false,
                message: "Fetching Users Failed! Server Error..",
                error: err
            });
        }
        if (req.params.num == 1)
        {
            users.sort((user1,user2)=> {
                if (user1.verified === false && user1.eventRegDetails.receipt.length > 0)
                {
                    return -1;
                }
                else
                {
                    return 1;
                }
            })
            return res.status(200).json({
                status: true,
                message: "Sorted successfully",
                users: users
            })
        }
        else
        {
            return res.status(200).json({
                status: true,
                message: "Fetched successfully",
                users: users
            });
        }
    })
})


//Add Category
router.post('/addCategory',Auth.authenticateAdmin,function(req,res){
    var categoryData = new Category(req.body);
    new Category(categoryData).save().then(
        item=> {
            if(item)
            {
                var queryData = {
                    categoryId: item._id,
                    categoryName: item.category
                }
                new Query(queryData).save().then(
                    data=> {
                        if(data)
                        {
                            return res.status(200).json({
                                status: true,
                                message: "Category and Query Addition successful",
                                data: data
                            })
                        }
                        else
                        {
                            console.log("Query Addition Failed! Try again..");
                            return res.status(500).json({
                                status: false,
                                message: "Query Addition Failed! Try again..",
                                error: "Unknown"
                            });
                        }
                    }
                )
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
            Query.findOneAndRemove({categoryName: req.body.category},(err, deletedQuery) => {
                if(err)
                {
                    console.log("Delete Query Failed",err);
                    return res.status(500).json({
                        status: false,
                        message: "Deleting Query Failed! Server Error..",
                        error: err
                    });
                }
                if(deletedQuery)
                {
                    return res.status(200).json({
                        status: true,
                        message: "Deleted Category & Query successfully",
                        user: deletedQuery
                      });
                }
                else
                {
                    console.log("Delete Query Failed");
                    return res.status(500).json({
                        status: false,
                        message: "Delete Query Failed",
                        error: 'Unknown'
                    });
                }
            })
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

//Verify And Unverify User
router.get("/verifyUser/:id",Auth.authenticateAdmin, (req,res) => {
    User.findById(req.params.id, (err,item) => {
        if (err)
        return res.status(500).json({
          status: false,
          message: "Verify/Unverify User Failed! Server Error..",
          error: err
        });
        if(item)
        {
            var msg = "";
            // item.verified = true;
            if (item.verified == true)
            {
                msg = "User unv";
            }
            else
            {
                msg = "User v"
            }
            item.verified = !item.verified;
            item.save().then(data => {
                return res.status(200).json({
                    status: true,
                    message: msg+"erified successfully",
                    data: data
                })
            })
            .catch(err=> {
                return res.status(500).json({
                    status: false,
                    message: msg+"erification Failed! Server Error..",
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

//Show or Hide Event
router.post('/showHideEvent',Auth.authenticateAdmin,function(req,res){
    Category.findOne({category: req.body.category}, (err,item)=> {
        if(err)
        {
            console.log("Show/Hide Event Failed",err);
            return res.status(500).json({
                status: false,
                message: "Show/Hide Event Failed! Server Error..",
                error: err
            });
        }
        if(item)
        {
            if(item.events[req.body.index].name == req.body.eventName)
            {
                var msg="Visible";
                if (item.events[req.body.index].show)
                {
                    msg = "Hidden";
                }
                item.events[req.body.index].show = !item.events[req.body.index].show;
                item.save().then(item => {
                    return res.status(200).json({
                        status: true,
                        message: "Event is "+msg+" now",
                        data: item
                    });
                })
                .catch(err2 => {
                    console.log("Show/Hide Event Failed",err2);
                    return res.status(500).json({
                        status: false,
                        message: "Show/Hide Event Failed",
                        error: err2
                    });
                })
            }
            else
            {
                console.log("Show/Hide Event Failed::INVALID");
                return res.status(500).json({
                    status: false,
                    message: "Show/Hide Event Failed",
                    error: 'Wrong event details'
                });
            }
        }
        else
        {
            console.log("Show/Hide Event Failed::FIND");
            return res.status(500).json({
                status: false,
                message: "Category does not exist!",
                error: 'Category find error'
            });
        }
    })
})

//Add Contact in Query
router.post('/addContact',function(req,res){
    Query.findOne({categoryName: req.body.categoryName},(err,item)=> {
        if(err)
        {
            console.log("Add Contacts Failed",err);
            return res.status(500).json({
                status: false,
                message: "Add Contacts Failed! Server Error..",
                error: err
            });
        }
        if(item)
        {
            item.contacts=[...item.contacts,req.body.contact];
            item.save().then(data=> {
                res.status(200).json({
                    'status':true,
                    'message':"Conatct added in the query",
                    'data':data
                })
            })
            .catch(err2 => {
                console.log("Contact Addition Failed! II Try again..",err3);
                res.status(500).json({
                    'status':false,
                    'message':"Contact addition error",
                    'error':err2
                })
            })
        }
        else
        {
            console.log("Add Contacts Failed::FIND");
            return res.status(500).json({
                status: false,
                message: "Query does not exist!",
                error: 'Query find error'
            });
        }
    })
})

module.exports=router;

