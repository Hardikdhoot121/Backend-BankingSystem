const express = require("express");
const authController = require("../controller/auth.controller.js");
const router = express.Router();

// POST /api/auth/register
router.post("/register", authController.userRegisterController);

// POST /api/auth/login
router.post("/login", authController.userLoginController);

// POST /api/auth/login
router.post("/logout", authController.userLogoutController);

module.exports = router;