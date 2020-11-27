const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const chat = new Schema({
    to:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    from:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    seenbySender:Boolean,
    seenByReceiver:Boolean,
    isFile:{
        type:Boolean,
        default:false
    },
    file:{
        type:Object,
        required:false,
    },
    text:{
        type:String,
    },
},{timestamps:true,toJSON:{virtuals:true}});

chat.statics.toApi = (message,UserID) => {
    const from_user = {
        _id:message.from._id,
        name:message.from.name,
        displayPicture:message.from.displayPicture,
        meta:message.from.meta
    };
    const to_user = {
        _id:message.to._id,
        name:message.to.name,
        displayPicture:message.to.displayPicture,
        meta:message.to.meta
    }
    return {
        ...message.toJSON(),
        from_user:from_user,
        to_user:to_user,
        user:UserID==message.to._id ? from_user : to_user,
        to:message.to._id,
        from:message.from._id,
    };    
}
module.exports = mongoose.model('Chat',chat);
