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
        default: ""
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
    "rcid": {
        type: Number,
        required: true,
        unique: true
    },
    "events": {
        type: Object,
        default: {}
    },
    "eventRegDetails": {
        "total": {
            type: Array,
            default: []
        },
        "receipt": {
            type: Array,
            default: []
        },
        "upiId": {
            type: Array,
            default: []
        }
    },
    "couponApplied": {
        type: Number,
        default: 0
    },
    "couponPhoto": {
        type: String,
        default: ""
    },
    "otp": {
        type: String,
        default: ""
    }
},{timestamps: true});

module.exports=mongoose.model('User',userSchema);