var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var categorySchema = new Schema({
    "category": {
        type: String,
        required: true,
        unique: true
    },
    "description": {
        type: String,
        required: true
    },
    "events": [
    {
        "_id": {
            type: String
        },
        "name": {
            type: String
        },
        "description": {
            type: String
        },
        "fees": {
            type: Number
        },
        "couponApplicable": {
            type: Boolean
        },
        "extra": {
            type: Boolean
        },
        "extraMoney": {
            type: Number
        }
    }]
    
},{timestamps: true})

module.exports = mongoose.model('Category',categorySchema);