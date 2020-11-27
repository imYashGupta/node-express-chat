const jwt = require("jsonwebtoken");
const user = require("../models/user");

module.exports = async (request,response,next) => {
    let decodedToken;
    try{
        if(!request.get("Authorization")){
            const error = new Error("Not Authenticated.");
            error.statusCode = 401;
            return next(error);
        }
        const token = request.get("Authorization").split(" ")[1];
        decodedToken = jwt.verify(token,'my-long-secret-key');
    }
    catch(err){
        err.statusCode = 500;
        return next(err);
        throw err;
    }
    if(!decodedToken){
        const error = new Error("Not Authenticated.");
        error.statusCode = 401;
        throw error;
    }
    const u =await user.findById(decodedToken._id);
    request.user =u ;
    next();
}