const router = require("express").Router();
const GCS = require('../helpers/gcs');
const Auth = require('../middlewares/auth');
var Category = require('../model/categoryEventDetails');
var Coupon = require('../model/couponDetails');
var Query = require('../model/queryDetails');

router.get('/getSettings', (req, res) => {
    let loadData = GCS.file('settings.txt').createReadStream();
    let text = '';
    loadData.on('data', (data) => {
        text += data;
    }).on('end', () => {
        let jsonData = JSON.parse(text);
        return res.status(200).json({
        status: true,
        message: 'Settings Retrieved Successfully',
        data: jsonData,
        serverDate: new Date()
        });
    }).on('error',(err) => {
        return res.status(500).json({
        status: false,
        message: 'Settings Retrieve Error',
        error: err
        });
    }); 
});
  
router.get('/getBanner', (req, res) => {
    res.attachment('banner.png');
    GCS.file('banner.png').createReadStream().pipe(res);
});

router.get('/getFile/:uid/:file', (req, res) => {
    res.attachment(req.params.file);
    GCS.file(req.params.uid + '/' + req.params.file).createReadStream().pipe(res);
});

//  Get all events .
router.get('/getAllEvents',Auth.authenticateAll, function(req, res) {
    Category.find({},(err,item)=>{
        if(err)
        {
            return res.status(500).json({
                status: false,
                message: "Events loading Failed! Server Error..",
                error: err
            });
        }
        res.status(200).json({
            status: true,
            data: item,
            message: "Events fetched successfully"
        })
    })
});

router.get('/getCategory/:id',Auth.authenticateAll, function(req, res) {
    Category.findOne({_id: req.params.id},(err,item)=>{
        if(err)
        {
            return res.status(500).json({
                status: false,
                message: "Category loading Failed! Server Error..",
                error: err
            });
        }
        res.status(200).json({
            status: true,
            data: item,
            message: "Category fetched successfully"
        })
    })
});

//Get coupon individually
router.get('/getCoupon',Auth.authenticateAll, function(req,res){
    Coupon.findOne({email: req.user.email},(err,coupon) => {
        if(err)
        {
            return res.status({
                status: false,
                message: "Fetching Coupon Failed! Server Error..",
                error: err
            })
        }
        return res.status(200).json({
            status: true,
            message: "Fetched successfully",
            coupon: coupon
        });
    })
})

//Get All Queries
router.get('/getAllQueries',Auth.authenticateAll,function(req,res){
    Query.find({},(err,queries)=> {
        if(err)
        {
            return res.status(500).json({
                status: false,
                message: "Queries loading Failed! Server Error..",
                error: err
            });
        }
        res.status(200).json({
            status: true,
            data: queries,
            message: "Queries fetched successfully"
        })
    })
})

//Get Query By Category Name
router.get('/getQuery',Auth.authenticateAll,function(req,res){
    Query.findOne({categoryName: req.body.categoryName},(err,query)=> {
        if(err)
        {
            return res.status(500).json({
                status: false,
                message: "Query loading Failed! Server Error..",
                error: err
            });
        }
        res.status(200).json({
            status: true,
            data: query,
            message: "Query fetched successfully"
        })
    })
})

//Add messages in Query
router.post('/addMessage',Auth.authenticateAll,function(req,res){
    Query.findOne({categoryName: req.body.categoryName},(err,item)=> {
        if(err)
        {
            console.log("Add Message Failed",err);
            return res.status(500).json({
                status: false,
                message: "Add Message Failed! Server Error..",
                error: err
            });
        }
        if(item)
        {
            var temp = req.user.name;
            if(req.user.admin)
            {
                temp = 'ADMIN'
            }
            var message = {
                name: temp,
                email: req.user.email,
                msg: req.body.message,
                createdAt: Date.now()
            }
            item.messages=[...item.messages,message];
            item.save().then(data=> {
                res.status(200).json({
                    'status':true,
                    'message':"Message added in the query",
                    'data':data
                })
            })
            .catch(err2 => {
                console.log("Message Addition Failed! II Try again..",err3);
                res.status(500).json({
                    'status':false,
                    'message':"Message addition error",
                    'error':err2
                })
            })
        }
        else
        {
            console.log("Add Message Failed::FIND");
            return res.status(500).json({
                status: false,
                message: "Query does not exist!",
                error: 'Query find error'
            });
        }
    })
})

//Delete Message in Query
router.post('/deleteMessage',Auth.authenticateAll,function(req,res){
    Query.findOne({categoryName: req.body.categoryName}, (err,item)=> {
        if(err)
        {
            console.log("Delete Message Failed",err);
            return res.status(500).json({
                status: false,
                message: "Deleting Message Failed! Server Error..",
                error: err
            });
        }
        if(item)
        {
            if(item.messages[req.body.index].msg == req.body.msg)
            {
                item.messages.splice(req.body.index,1);
                item.save().then(item => {
                    return res.status(200).json({
                        status: true,
                        message: "Delete Message successful",
                        data: item
                    });
                })
                .catch(err2 => {
                    console.log("Delete Message Failed",err2);
                    return res.status(500).json({
                        status: false,
                        message: "Delete Message Failed",
                        error: err2
                    });
                })
            }
            else
            {
                console.log("Delete Message Failed::INVALID");
                return res.status(500).json({
                    status: false,
                    message: "Delete Message Failed",
                    error: 'Wrong Query details'
                });
            }
        }
        else
        {
            console.log("Delete Message Failed::FIND");
            return res.status(500).json({
                status: false,
                message: "Query does not exist!",
                error: 'Query find error'
            });
        }
    })
})

router.get("/list", (req, res) => {
    let listFiles = async() => {
        const [files] = await GCS.getFiles();
        let fileNames = [];
        files.forEach(f => fileNames = [...fileNames, f.name]);
        return res.status(200).json({
            status: true,
            message: "Deleted successfully",
            user: fileNames
        });
    }
    listFiles().catch(err => {
        return res.status(500).json({
            status: false,
            message: 'Cannot List Files',
            error: err
        });
    });
});

module.exports = router;