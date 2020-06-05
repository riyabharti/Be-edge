const sha1 = require("sha1");
const path = require('path');
const jwt = require('jsonwebtoken');

var User=require('../model/userDetails');

var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource Link incomplete!');
});

//Fetch All Emails
router.get("/fetchEmails", (req, res) => {
  User.find({}, {email: 1}, (err, users) => {
    if (err)
      return res.status(500).json({
        status: false,
        message: "Fetching Emails Failed! Server Error..",
        error: err
      });
    return res.status(200).json({
      status: true,
      message: "Fetched successfully",
      user: users
    });
  });
});

//Register User
router.post('/register',function(req,res){
  var newUser=req.body;
  newUser.events = {'noregister': true};
  newUser.password=sha1(req.body.password);
  var user=new User(newUser);
  user.save().then(item=>{
    res.status(200).json({
      'status':true,
      'message':"Registration successful",
      'data':item
    })
  }).catch(err=>{
    res.status(200).json({
      'status':false,
      'message':"Registration error",
      'error':err
    })
  })
})

//Login
router.post('/login',function(req,res){
  User.findOne({email: req.body.username},(err,item)=>{
    if (err)
    {
      console.log(err);
      return res.status(500).json({
        status: false,
        message: "Login Failed! Server Error..",
        error: err
      });
    }
    if(item==null){
      res.status(401).json({
        'status':false,
        'message':"User does not exist"
      })
    }
    else{
      if(item.password == sha1(req.body.password))
      {
        jwt.sign(
          item.toJSON(),
          process.env.secretKey,
          { expiresIn : '1h'},
          (err,token)=>{
            if(err) {
              res.status(500).json({
                status: false,
                message: "Problem signing in"
              })
            }
            res.status(200).json({
              status:true,
              token,
              user: item,
              message: "Logged in successfully"
            })
          }
        );
      }
      else {
        res.status(401).json({
          status: false,
          message: "Incorrect password"
        })
      }
    }
  })
})

//Event Registration
router.post('/eventRegister',function(req,res){
  User.findOne({email : req.body.email}, (err,item) => {
    if (err)
    {
      console.log(err);
      return res.status(500).json({
        status: false,
        message: "Event Register Failed! Server Error..",
        error: err
      });
    }
    if(item.total == 0)
    {
      item.events=req.body.registerEvents;
      item.total=req.body.total;
      item.save().then(data=> {
        res.status(200).json({
          'status':true,
          'message':"Event Registration successful",
          'data':data
        })
      }).catch(err=> {
        res.status(200).json({
          'status':false,
          'message':"Event Registration failed",
          'data':err
        })
      })
    }
    else
    {
      item.events=req.body.registerEvents;
      item.total=req.body.total;
      item.save().then(data=> {
        res.status(200).json({
          'status':true,
          'message':"Event Registration successful",
          'data':data
        })
      }).catch(err=> {
        res.status(200).json({
          'status':false,
          'message':"Event Registration failed",
          'data':err
        })
      })
    }
  })
})

module.exports = router;
