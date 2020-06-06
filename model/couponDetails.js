const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var couponSchema = new Schema({
    "couponCode": {
        type: String,
        required: true,
        unique: true
    },
    "discountValue": {
        type: Number,
        required: true
    },
    "email": {
        type: String,
        required: true,
        unique: true
    }
},{timestamps: true});

module.exports= mongoose.model('Coupon',couponSchema);