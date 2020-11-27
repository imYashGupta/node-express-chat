const express = require("express");
const router = express.Router();
const {body} = require("express-validator");
const isAuth = require("../middleware/is-auth");
const multer = require("multer")
const fileStorage = multer.diskStorage({
    destination:(req,file,cb) => {
        cb(null,'images/files');
    },
    filename:(req,file,cb) => {
        cb(null,new Date().getTime().toString()+'_'+file.originalname);
    }
});
const fileFilter = (req,file,cb) => {
    if(file.mimetype=== 'image/png' ||
        file.mimetype=== 'image/jpg' || 
        file.mimetype=== 'image/jpeg' || 
        file.mimetype=== 'video/mp4' || 
        file.mimetype=== 'image/gif'){
            cb(null,true);
        }
        else{
            cb(null,false);
        }
}
const ChatController = require("../controllers/ChatController");
router.get("/home",[isAuth],ChatController.getHome);
router.post("/send",[isAuth],multer({storage:fileStorage,fileFilter:fileFilter}).single('attachment'),ChatController.saveMessage);
router.get("/users",[isAuth],ChatController.findUsers);
router.post("/more",[isAuth],ChatController.fetchMoreConversation);
module.exports = router;
