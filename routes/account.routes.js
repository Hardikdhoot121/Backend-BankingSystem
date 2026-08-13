const express = require("express")
const { authMiddleware } = require("../middleware/auth.middleware")
const accountController = require("../controller/account.controller")

const router = express.Router()
// create a new account
// POST /api/account/
router.post("/", authMiddleware, accountController.createAccountController);

// getting all user active account 
// GET /api/account/
router.get("/", authMiddleware, accountController.getUserAccountController);

// getting account balance
// GET /api/account/balance/:id
router.get("/balance/:id",authMiddleware, accountController.getAccountBalanceController);



module.exports = router