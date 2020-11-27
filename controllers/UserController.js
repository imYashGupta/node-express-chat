const User = require("./../models/user");
const Contact = require("../models/contact");
const {validationResult} = require("express-validator");
const { request } = require("express");
require('dotenv').config();


exports.getContacts = (request,response,next) => {
    Contact.find({user_id:request.user._id}).populate('user_id').populate("contact_id").then(contacts => {
        
        return response.json({contacts:Contact.toApi(contacts)});
    }).then(err => {
        const error = new Error(err);
        next(error);
    })
};
exports.getHomeData = (request,response,next) => {
    User.find({}).then(users => {
        response.json({users:users});
    }).catch(err => {
        let error = new Error("Something went wrong!");
        error.statusCode = 500;
        return next(error);
    })
}

exports.addContact = (request,response,next) => {
    const {contactId} = request.body; 
    const user = request.user;
    Contact.findOne({user_id:user._id,contact_id:contactId}).then(result => {
        if(result===null){
            const contact=new Contact()
            contact.user_id = user._id;
            contact.contact_id = contactId;
            return contact.save();
        }else{
            return response.json({status:false,message:"Contact Already Added."});
        }
    }).then(cont => {    
        return response.json({status:true,message:"Contact Added.",data:cont});
    }).catch(err => {
        const error = new Error(err);
        next(error);
    })
}



exports.updateUser = (request,response,next) => {
    const errors = validationResult(request);
    if(!errors.isEmpty()){
        const error = new Error("One or more validation failed!");
        error.statusCode = 422;
        error.errors = errors.array();
        next(error);
    }
     User.findById(request.user._id).then(user => {
         user.name = request.body.name;
         user.phone = request.body.phone;
         user.meta = {
            ...user.meta,
            city:request.body.city,
            website:request.body.website,
         };
         if(request?.file?.path){
            user.displayPicture = process.env['APP_URL']+request.file.path;
         }
        return user.save();
     }).then(result => response.json(result)).catch(error => {
         console.log(error);
         next(error);
     })
     
}

exports.updateAbout = (request,response,next) => {
    console.log("[about]",request.body)
    User.findById(request.user._id).then(user => {
        const meta = {...user?.meta,about:request.body.about};
        user.meta = meta;
        return user.save();
    }).then(result => response.json(result)).catch(error => {
        console.log(error);
        next(error);
    })
}

exports.getUser = (request,response,next) => {
    User.findById(request.body.id).then(user => {
        user.verification = undefined;
        response.json(user);
    }).catch(err => {
        next(err);
    });
}


exports.updateSocials = (request,response,next) => {
    let socials = {};
    for(let handle in request.body){
        if(handle=='facebook' || handle=='twitter' || handle == 'linkedin' || handle == 'instagram' || handle=='youtube'){
            if(request.body[handle]!=''){
                socials[handle] = request.body[handle];
            }
        }
    }
    request.user.socialMediaHandles = socials;
    request.user.save().then(result => {
        response.json(result);
    }).catch(err => {
        console.log(err);
    })
}