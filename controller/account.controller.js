const accountModel = require("../models/account.model")
async function createAccountController(req, res) {
        const user = req.user;
    // is controller ka kaam is to create account corrseponding to user id
        const account = await accountModel.create({
            user: user._id,
    })
        res.status(201).json({
            account
    })
}

const getUserAccountController = async (req, res) => {
        const user = req.user;
        const account = await accountModel.findOne({
            user: user._id,
    })
        res.status(200).json({
            account
    })
    }

async function getAccountBalanceController(req, res) {
    try {
        const accountId = req.params.id;

        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id
        });

        if (!account) {
            return res.status(404).json({
                message: "Account not found or access denied"
            });
        }

        const balance = await account.getBalance();

        return res.status(200).json({
            account,
            balance
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createAccountController,
    getUserAccountController,
    getAccountBalanceController
};