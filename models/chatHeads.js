const mongoose = require("mongoose");
const user = require("./user");
const Schema = mongoose.Schema;
const chatHeads = new Schema({
    user1:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    user2:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    chats:{
        type:Array
    }
},{timestamps:true});

module.exports = mongoose.model('chatHeads',chatHeads);
