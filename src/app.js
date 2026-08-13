// create the server instance and then config the server instance 
const express = require("express")
const app = express();
const authRouter = require("../routes/auth.routes.js");
const accountRouter = require("../routes/account.routes.js");
const transactionRoutes = require("../routes/transaction.routes.js")

const cookieParser=require("cookie-parser");

// so then req kai andar kai body kai data ko padh sake express
app.use(express.json())
app.use(cookieParser())

// header to the router
// - USE ROUTES 
app.use("/api/auth",authRouter)
app.use("/api/account",accountRouter)
app.use("/api/transaction",transactionRoutes)

module.exports = app