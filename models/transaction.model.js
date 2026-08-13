const mongoose  = require("mongoose")

const transacitonSchema=new mongoose.Schema({
    fromAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required:[true,"Trancastion must be associated from account"],
        index:true
    },
    toAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required:[true,"Trancastion must be associated to account"],
        index:true
    },
    status:{
        type:String,
        enum:["PENDING","COMPLETE","FAILED","REVERSED"],
        default:"PENDING",
    },
    amount:{
        type:Number,
        required:[true,"Transaction amount is required"]
    },
    idempotencyKey:{
        type:String,
        required:[true,"Idempotency key is required for creating an transaction"],
        index:true,
        unique:true
    }    
},{timestamps:true})
// idempotency key prevents multiple transacitons from same account at once at time of faliure.
const transactionModel=mongoose.model("transaction",transacitonSchema)
module.exports  = transactionModel