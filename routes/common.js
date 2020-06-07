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
    res.attachment('banner.jpg');
    GCS.file('banner.jpg').createReadStream().pipe(res);
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

module.exports = router;