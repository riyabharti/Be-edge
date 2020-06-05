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
        "name": {
            type: String,
            required: true,
            unique: true
        },
        "description": {
            type: String,
            required: true
        },
        "fees": {
            type: Number,
            required: true
        }
    }]
    
},{timestamps: true})

module.exports = mongoose.model('Category',categorySchema);