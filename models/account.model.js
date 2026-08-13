const mongoose = require("mongoose")
const ledgerModel = require("./ledger.model.js")

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true
    },
    status: {
        type: String,
        enum: ["Active", "Frozen", "Closed"],
        default: "Active"
    },
    currency: {
        type: String,
        required: [true, "Currency is required for creating an account"],
        default: "INR"
    }
}, { timestamps: true })

// compound indexing 
accountSchema.index({ user: 1, status: 1 })

// creating aggrigate pipeline for the transaction.Controller 
// where ledger (single source of truth) => through it we will subtract credit-debit for particular user 

// like yt bcknd whr we crtd methods inside usrMdl similar wy we will create method inside it only 

accountSchema.methods.getBalance = async function () {
    const balanceData = await ledgerModel.aggregate([
        { $match: { account: this._id } },
        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [{
                            $eq: ["$type", "DEBIT"]
                        }, "$amount", 0]
                    }
                },
                totalCredit: {
                    $sum: {
                        $cond: [{
                            $eq: ["$type", "CREDIT"]
                        }, "$amount", 0]
                    }
                }
            }
        }
    ])
    if (balanceData.length === 0) { return 0; }
    return balanceData[0].totalCredit - balanceData[0].totalDebit;
}


const accountModel = mongoose.model("Account", accountSchema)
module.exports = accountModel