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
    "photo": {
        type: String,
        required: true
    },
    "receipt": {
        type: String,
        default: ""
    },
    "couponApplied": {
        type: Boolean,
        default: false
    }
},{timestamps: true});

module.exports=mongoose.model('User',userSchema);