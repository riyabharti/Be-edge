const router = require("express").Router();
const GCS = require('../helpers/gcs');

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

module.exports = router;