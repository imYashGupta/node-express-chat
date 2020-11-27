const express = require("express");
const router = express.Router();
const {body} = require("express-validator");
const isAuth = require("./../middleware/is-auth");

const AuthController = require("./../controllers/AuthController");
router.post("/authenticate",[isAuth],AuthController.getUser);
router.put("/register",[
    body("name").trim().isLength({min:3}).withMessage("The Name must be at least 3 characters long."),
    body("email").trim().isEmail().withMessage("The Email must be a valid email address."),
    body("password").trim().isLength({min:6}).withMessage("The Password must be at least 6 characters long."),
    body("phone").trim().isLength({min:10}).withMessage("The Phone Number must be of 10 degits."),
],AuthController.createUser);
router.post("/login",[
    body("name").trim().isEmail().withMessage("The Email must be a valid email address."),
    body("password").trim().notEmpty().withMessage("The Password field is required."),

],AuthController.login);
router.post("/verify-email",AuthController.verifyEmail);
router.get("/verify-email",AuthController.emitAEvent)
module.exports =router;