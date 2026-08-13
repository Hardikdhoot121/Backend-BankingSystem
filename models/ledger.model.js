const mongoose=require("mongoose")

// Where type stores credit or debit
const ledgerSchema=new mongoose.Schema({
    account:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Account',
        required:true,
        index:true,
        immutable:true // This thing is imp. for ledger creatin
    },
    amount:{
        type:Number,
        required:true,
        immutable:true
    },
    // kis transactoin ki ledger id hai wo dena hoga 
    transaction:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"transaction",
        required:[true,"Ledger must be associated with a transaction"],
        index:true,
        immutable:true
    },
    type:{
        type:String,
        enum:["CREDIT","DEBIT"],
        message:"Type can be either CREDIT or DEBIT",
        immutable:true
    },
})

// OUT OF CRUD -> I WANT THIS SYSTEM ONLY FOLLOWS C -> THEN I NEED TO DIABLE OTHER OPERATIONS 
function preventLedgerModification(){
    throw new Error("Ledger enteries are Immutable");
}
// there are the basic CRUD operaotion that can't be applied to the LEDGER 
ledgerSchema.pre('findOneAndUpdate',preventLedgerModification)
ledgerSchema.pre('updateOne',preventLedgerModification)
ledgerSchema.pre('updateMany',preventLedgerModification)
ledgerSchema.pre('remvoe',preventLedgerModification)
ledgerSchema.pre('deleteMany',preventLedgerModification)
ledgerSchema.pre('deleteOne',preventLedgerModification)
ledgerSchema.pre('findOneAndDelete',preventLedgerModification)
ledgerSchema.pre('findOneAndReplace',preventLedgerModification)

const ledgerModel= mongoose.model("ledger",ledgerSchema)
module.exports=ledgerModel