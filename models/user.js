const mongoose  = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique: true
    },
    phone:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
        select: false
    },
    displayPicture:{
        type:String,
        required:false,
    },
    socialMediaHandles: {
        type: Object,
        of: String
    },
    verification:{
        type:Object,
        required:false,
    },
    meta:{
        type:Schema.Types.Mixed,
    }
},{timestamps:true});
userSchema.index({name:'text',email:'text'});
userSchema.statics.toApi = (users) => {
    const formated= users.map(user => {
        user.verification = undefined;
        user.phone = undefined;
        user.createdAt = undefined;
        user.updatedAt = undefined;
        user.email = undefined;
        return user;
    })  
    return formated;
}
module.exports = mongoose.model('User',userSchema);