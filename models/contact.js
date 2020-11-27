const mongoose  = require("mongoose");
const Schema = mongoose.Schema;
const contactSchema = new Schema({
    user_id:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    contact_id:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    status:{
        type:String,
        required:false,
    },
    meta:{
        type:Schema.Types.Mixed,
        required:false,
    }
},{timestamps:true,toJSON:{getters:true}});
contactSchema.statics.toApi = (contacts) => {
    const formated= contacts.map(contact => {
        let data = {
            _id:contact._id,
            user:{
                _id:contact.user_id._id,
                name:contact.user_id.name,
                displayPicture:contact.user_id.displayPicture,
            },
            contact:{
                _id:contact.contact_id._id,
                name:contact.contact_id.name,
                displayPicture:contact.contact_id.displayPicture,
            },
            meta:contact.meta,
            createdAt:contact.createdAt,
        };
        return data;
    })  
    return formated;
}
module.exports = mongoose.model('Contact',contactSchema);