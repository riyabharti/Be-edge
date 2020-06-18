var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var querySchema = new Schema({
    "categoryName": {
        type: String,
        required: true,
        unique: true
    },
    "categoryId": {
        type: String,
        required: true
    },
    "contacts": [{
        "name":{
            type: String
        },
        "phone":{
            type: String
        }
    }],
    "messages":[{
        "name":{
            type: String
        },
        "email":{
            type: String
        },
        "msg":{
            type: String
        }
    }]
},{timestamps: true});

module.exports = mongoose.model('Query',querySchema);