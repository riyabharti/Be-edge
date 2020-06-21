const mongoose = require('mongoose');
var Schema = mongoose.Schema;
module.exports= mongoose.model('Config',new Schema({
    "RCID": {
        type: Number,
        default: 0
    }
}));