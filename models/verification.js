const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const verification = new Schema({
    user_id:{
        type:String,
        required:true,
    },
    email:{
        type:Object,
        required:true,
    },
    phone:{
        type:Object,
        required:true,
    },
},{timestamps:true});

module.exports = mongoose.model('Verification',verification);
