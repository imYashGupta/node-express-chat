const {validationResult} = require("express-validator");
const User = require("../models/user");
const Verification = require("../models/verification");
const brcrypt =require("bcryptjs")
const jwt = require("jsonwebtoken");
const randomInt = require("random-int");
const nodemailer =require("nodemailer");
const sendgrid = require("nodemailer-sendgrid-transport");
const socket = require("./../socket");
const crypto = require("./../util/crypto");
require('dotenv').config();
const {getConversations} = require("./ChatController")
const colors = [
    ["bg-primary","#26a69a"],
    ["bg-primary-bright","#c0c5e4"],
    ["bg-primary-gradient","#26a69a"],
    ["bg-info","#00bcd4"],
    ["bg-info-bright","#e1efff"],
    ["bg-info-gradient","#00bcd4"],
    ["bg-secondary","#696969"],
    ["bg-secondary-bright","#ededed"],
    ["bg-secondary-gradient","#696969"],
    ["bg-success","#0abb87"],
    ["bg-success-bright","#cef5ea"],
    ["bg-success-gradient","#0abb87"],
    ["bg-danger","#fd397a"],
    ["bg-danger-bright","#fcd0df"],
    ["bg-danger-gradient","#fd397a"],
    ["bg-danger-light","#ffcfff"],
    ["bg-warning","#ffb822"],
    ["bg-warning-bright","#837363"],
    ["bg-warning-gradient","#ffb822"],
    ["bg-light","#e6e6e6"],
    ["bg-dark","#3a3f51"],
    ["bg-dark-bright","#d4d5d8"],
    ["bg-dark-gradient","#585d6f"]
];

const getRandomColor = () => {
    const randomLength = Math.floor(Math.random() * colors.length);
    return colors[randomLength];
};

const transporter = nodemailer.createTransport(sendgrid({
    auth:{
        api_key:"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"
    }
}));


exports.getUser =async (req,res) => {
    const activeChats = await getConversations(req.user.id);
    res.status(200).json({
        user:req.user,
        activeChats:activeChats
    });
}

exports.createUser = (request,response,next) => {
    const errors = validationResult(request);
    if(!errors.isEmpty()){
        const error = new Error("One or more validation failed!");
        error.statusCode = 422;
        error.errors = errors.array();
        throw error;
    }
    let user;
    const {name,email,phone,password} = request.body;
    brcrypt.hash(password,12).then(hash => {
        user = new User({
            name,
            email,
            phone,
            password:hash,
            verification:{
                email:false,
                phone:false,
                last_email:new Date(),
            },
            meta:{
                color:getRandomColor()
            }
        });
        return user.save();
    }).then(user => {
        return sendEmailVerificationMail(user);
    }).then(sentEmail => {
        response.status(201).json({message:"User Created.",user:user})
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
            next(err);
        }
    })
}

exports.login = (request,response,next) => {
    const {email,password} = request.body;
    let userObj;
    let u;
    User.findOne({email:email}).select('+password')
    .then(user => {
        u=user;
        if(user==null){
            const error = new Error("These credentials do not match our records.");
            error.statusCode=401;
            return next(error);
        }
        if(!u.verification.email){
            if(new Date() < new Date(new Date(user.verification.last_email).getTime() + 15*60000)){
                const error = new Error("You need to verify your email before login And please wait 15 min before retry.");
                error.retry = false;
                error.statusCode=422;
                return next(error);
            }            
            u.verification ={
                email:u.verification.email,
                email_verified:u.verification.email_verified,
                phone:u.verification.phone,
                last_email:new Date(),
            };
            // u.markModified();
            u.save()
            sendEmailVerificationMail(user);
            const error = new Error("You need to verify your email before login.");
            error.statusCode=422;
            error.retry=true;
            return next(error);
        }
        userObj = u.toObject();
        delete userObj.password;
        return brcrypt.compare(password,u.password);
    }).then(isPasswordMatched => {
        console.log(isPasswordMatched)
        if(!isPasswordMatched){
            const error = new Error("These credentials do not match our records.");
            error.statusCode=401;
            return next(error);
        }
        const token = jwt.sign(userObj,
            "my-long-secret-key",
           /*  {
                expiresIn:"365 days"
            } */
        );
       
        return response.status(200).json({token:token,user:userObj});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
            return next(err);
        }
    })
}

exports.verifyEmail = (request,response,next) => {
    const {code,email} = request.body;
    Verification.findOne({'email.address':email}).sort({"updated_at":-1}).then(record => {
        User.findById(record.user_id).then(user => {
            user.verification ={
                email:true,
                phone:user.verification.phone
            } ;
            user.save();
            response.json(user);
        })
    })
}

const sendEmailVerificationMail = (user) => {
       
        const encryptedEmailAddress=crypto.encrypt(JSON.stringify({email:user.email,genrated:new Date(new Date().getTime() + 15*60000)}));
        return transporter.sendMail({
            to:user.email,
            from:"thinkherbalmarket@gmail.com",
            subject:"Email Verification Code",
            html:`
            <p>
                Hello, ${user.name}
                <br>
                <a href="${process.env['APP_URL']}auth/verify-email?client=${encryptedEmailAddress}" >Click here</a> to verify your email address.    
            </p>
            <p>Thank You for joining us!</p>
            `
        })
}

exports.emitAEvent = (request,response,next) => {
    try{
        const data=crypto.decrypt(request.query.client)
        const {email,genrated} = JSON.parse(data)
        if(new Date(genrated) > new Date()){
            User.findOne({email:email}).then(user => {
                if(user.verification.email!=false){
                    return response.send("email already verify!");
                }
                user.verification = {
                    email:true,
                    email_verified:new Date(),
                    phone:user.verification.phone,
                    last_email:user.verification.last_email,
                }
                return user.save();
            }).then(result => {
                socket.io().emit(result.email,{type:"EMAIL_VERIFIED",data:true});
                response.send("Email Verified Successfully, you may now close this window.")
            }).catch(error => {
                const e= new Error("Email Can not be verify!");
                e.statusCode = 500;
                throw e;
            })
        }else{
            response.send("Link has Been expire.");
        }
    }
    catch(err){
        response.send("Something went wrong!");
    }
}