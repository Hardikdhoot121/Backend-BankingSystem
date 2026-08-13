require("dotenv").config();

const app=require("./src/app.js")
const connectToDb=require("./config/db.js")

const port =process.env.PORT || 4000;
connectToDb();

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
})



