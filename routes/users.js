const sha1 = require("sha1");
const path = require('path');
const jwt = require('jsonwebtoken');

var User=require('../model/userDetails');

var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

//Register User
router.post('/register',function(req,res){
  var newUser=req.body;
  console.log(newUser);
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

module.exports = router;
