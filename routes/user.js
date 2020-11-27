const express = require("express");
const router = express.Router();
const {body} = require("express-validator");
const isAuth = require("../middleware/is-auth");
const bodyParser = require("body-parser");
const multer = require("multer")

const fileStorage = multer.diskStorage({
    destination:(req,file,cb) => {
        cb(null,'images/avatar');
    },
    filename:(req,file,cb) => {
        cb(null,new Date().getTime().toString()+'_'+file.originalname);
    }
});
const fileFilter = (req,file,cb) => {
    if(file.mimetype=== 'image/png' ||
        file.mimetype=== 'image/jpg' || 
        file.mimetype=== 'image/jpeg' || 
        file.mimetype=== 'image/gif'){
            cb(null,true);
        }
        else{
            cb(null,false);
        }
}
const UserController = require("../controllers/UserController");

router.get("/home",[isAuth],UserController.getHomeData);
router.post("/add",[isAuth,UserController.addContact]);
router.get("/contacts",[isAuth,UserController.getContacts]);
router.post("/update",[isAuth],multer({storage:fileStorage,fileFilter:fileFilter}).single('avatar'),[
    body("name").trim().isLength({min:3}).withMessage("The Name must be at least 3 characters long."),
    body("phone").trim().isLength({min:10}).withMessage("The Phone Number must be of 10 degits."),
],UserController.updateUser)
router.post("/about",[isAuth],UserController.updateAbout)
router.post("/get",[isAuth],UserController.getUser);
router.post("/socials",[isAuth],UserController.updateSocials);
module.exports = router;