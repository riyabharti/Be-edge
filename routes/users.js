const sha1 = require("sha1");
const secret='ANY_SECRET_KEY';
const path = require('path');
var decodedToken;

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

module.exports = router;
