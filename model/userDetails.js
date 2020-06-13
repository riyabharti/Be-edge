const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userSchema=new Schema({
    "name": {
        type: String,
        required: true
    },
    "email": {
        type: String,
        required: true,
        unique: true
    },
    "stream": {
        type: String,
        default: ""
    },
    "year": {
        type: String,
        default: ""
    },
    "instituteName": {
        type: String,
        required: true
    },
    "contact": {
        type: String,
        required: true,
        unique: true
    },
    "password": {
        type: String,
        required: true
    },
    "verified": {
        type: Boolean,
        default: false
    },
    "admin": {
        type: Boolean,
        default: false
    },
    "events": {
        type: Object,
        default: {}
    },
    "total": {
        type: Number,
        default: 0
    },
    "receipt": {
        type: String,
        default: ""
    },
    "couponApplied": {
        type: Boolean,
        default: false
    },
    "upiId": {
        type: Number
    },
    "couponPhoto": {
        type: String,
        default: ""
    }
},{timestamps: true});

module.exports=mongoose.model('User',userSchema);