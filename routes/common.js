const router = require("express").Router();
const GCS = require('../helpers/gcs');
const Auth = require('../middlewares/auth');
var Category = require('../model/categoryEventDetails');
var Coupon = require('../model/couponDetails');

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