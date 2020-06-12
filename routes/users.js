const sha1 = require("sha1");
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');

var User=require('../model/userDetails');
const Auth = require('../middlewares/auth');
const GCS = require('../helpers/gcs');

var express = require('express');
var router = express.Router();

const uploadFile = multer({ storage: multer.memoryStorage() });

//check deadline function
const checkDeadline = (req, res, next) => {
  let loadData = GCS.file('settings.txt').createReadStream();
  let text = '';
  loadData.on('data', (data) => {
    text += data;
  }).on('end', () => {
    let jsonData = JSON.parse(text);
    let startTime = new Date(jsonData.startTime).getTime();
    let endTime = new Date(jsonData.endTime).getTime();
    let currentTime = new Date().getTime();
    if(startTime > currentTime && !req.user.admin)
      return res.status(500).json({
        status: false,
        message: 'Sorry :/ Competition has not started yet',
        err: {}
      });
    else if(endTime < currentTime && !req.user.admin)
      return res.status(500).json({
        status: false,
        message: 'Sorry :/ Competition has already ended',
        err: {}
      });
    else
      next();
  }).on('error',(err) => {
    return res.status(500).json({
      status: false,
      message: 'Image Verify Error',
      error: err
    });
  }); 
}

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

//Fetch All Emails and Contacts
router.get("/fetchEmailsContacts", (req,res) => {
  User.find({}, {contact: 1, email: 1}, (err, users) => {
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
})

//Register User
router.post('/register',function(req,res){
  var userData = req.body;
  // userData.photo = req.file.originalname.split(".")[1];
  // userData.idcard = req.files[1].originalname.split(".")[1];
  userData.password = sha1(req.body.password);
  new User(userData).save().then(
    newUser => {
      if (newUser)
        return res.status(200).json({
          status: true,
          message: "Registration Successful :)",
          user: newUser
        });
      else
        return res.status(500).json({
          status: false,
          message: "Registration Failed! Try again..",
          error: "Unknown"
        });
    })
    .catch(err => {
      return res.status(500).json({
        status: false,
        message: "Registration Failed! Server Error..",
        error: err
      });
    });
})

//Login
router.post('/login',function(req,res){
  User.findOne({email: req.body.email},(err,item)=>{
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
          { expiresIn : '1d'},
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
router.post('/eventRegister',Auth.authenticateAll, uploadFile.single('file'), function(req,res){
  User.findOne({email : req.user.email}, (err,item) => {
    if (err)
    {
      console.log(err);
      return res.status(500).json({
        status: false,
        message: "Event Register Failed! Server Error..",
        error: err
      });
    }
    if(item)
    {
      item.events=JSON.parse(req.body.registerEvents);
      item.total=req.body.total;
      item.upiId=req.body.upiId;
      item.couponApplied = req.body.couponApplied;
      item.receipt = req.file.originalname.split(".")[1];
      item.save().then(data=> {
        //Upload Payment Receipt
        const bs = GCS.file(item._id + '/receipt.'+req.file.originalname.split(".")[1]).createWriteStream({resumable: false});
        bs.on('finish', () => {
          console.log(`https://storage.googleapis.com/${GCS.name}`);
          res.status(200).json({
            'status':true,
            'message':"Event Registration successful",
            'user':data
          })
        }).on('error', (err) => {
          return res.status(500).json({
            status: false,
            message: 'Payment Receipt Upload Error',
            error: err
          })
        }).end(req.file.buffer);
      }).catch(err=> {
        res.status(500).json({
          'status':false,
          'message':"Event Registration failed",
          'error':err
        })
      })
    }
    else
    {
      res.status(200).json({
        'status': true,
        'message': "You are already registered for events",
        'data': item
      })
      // item.events=req.body.registerEvents;
      // item.total=req.body.total;
      // item.save().then(data=> {
      //   res.status(200).json({
      //     'status':true,
      //     'message':"Event Registration successful",
      //     'data':data
      //   })
      // }).catch(err=> {
      //   res.status(200).json({
      //     'status':false,
      //     'message':"Event Registration failed",
      //     'data':err
      //   })
      // })
    }
  })
})

module.exports = router;
