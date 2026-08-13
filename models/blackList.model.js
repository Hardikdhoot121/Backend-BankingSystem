// model for completely dead account of users who have logged out / password changed
// we cannot delete account from account.model so just blacklisting them 
// calling logout api corresponding to it 

const mongoose = require("mongoose");
const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [ true, "Token is required to blacklist" ],
        unique: [ true, "Token is already blacklisted" ]
    }
}, {
    timestamps: true
})

tokenBlacklistSchema.index({ createdAt: 1 }, {
    expireAfterSeconds: 60 * 60 * 24  // 1 days => paile ttl mai chala jayega and waha sai remove ho jayega after schedule time completes 
}) 

const tokenBlackListModel = mongoose.model("tokenBlackList", tokenBlacklistSchema);

module.exports = tokenBlackListModel;