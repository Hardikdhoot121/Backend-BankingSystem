// transaction will be created using transaction model ... 
// and this transaction will be enforced using the ledger model ...
// for this controller I FIRST CREATED createInitialFundsTransaction AND THEN I CREATED THE 1ST PART WHICH IS createTransacitoncontroller

const mongoose = require("mongoose");
const transactionModel = require("../models/transaction.model.js");
const accountModel = require("../models/account.model.js");
const ledgerModel = require("../models/ledger.model.js");
const emailService = require("../services/email.service.js");

// create new transactions 
/* THIS STEPS WILL BE OCCURING IN 10 STEPS 
1. VALIDATING REQUEST 
2. VALIDATING IDEMPOTENCY KEY
3. CHECKING ACCOUNT STATUS
4. DERIVE SENDER BALANCE FROM LEDGER 
5. CREATE TRANSACTION {INITIALLY AT PENDING STATE}
6. CREATE DEBIT LEDGER ENTRY 
7. CREATE CREDIT LEDGER ENTRY 
8. MARK THE TRANSACTION COMPLETE FIRST 
9. UPDATE THE TRANSACTION TO DB 
10. THE USER WITH THE NOTIFICATION OF TRANSACTION COMPLETION 
*/

async function createTransacitoncontroller(req, res, next) {
    try {
        const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

        // 1. VALIDATING THE REQUEST 

        if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: "either of the 4 is missing fromAccount,toAccount,amount,idempotencyKey"
            })
        }
        // checking ki from and to account exist bhi karnai chaye 
        const fromUserAccount = await accountModel.findOne({
            _id: fromAccount,
        })
        const toUserAccount = await accountModel.findOne({
            _id: toAccount,
        })
        if (!fromUserAccount || !toUserAccount) {
            return res.status(401).json({
                message: "fromUser or toUser account not found "
            })
        }

        //2. VALIDATING IDEMPOTENCY KEY => TO PREVENT SAME PAYMENT MULTIPLE TIMES OR TO ENSURE THAT TRANSACTION SHOULD BE COMPLETE 
        // koi dusri transaction is kai saath exist nahi karni chaye 
        const isTransactionDuplicate = await transactionModel.findOne({
            idempotencyKey: idempotencyKey,
        })

        // checking for duplication 
        if (isTransactionDuplicate) {
            if (isTransactionDuplicate.status === "COMPLETE") {
                return res.status(400).json({
                    message: "Transaction is already processed , you can't create duplicate transaction"
                })
            }
            if (isTransactionDuplicate.status === "PENDING") {
                return res.status(400).json({
                    message: "Transaction is already under processing"
                })
            }
            if (isTransactionDuplicate.status === "FAILED") {
                return res.status(400).json({
                    message: "Transaction is failed please retry"
                })
            }
            if (isTransactionDuplicate.status === "REVERSED") {
                return res.status(400).json({
                    message: "Transaction is REVERSED please retry"
                })
            }
        }
        // 3. CHECK ACCOUNT STATUS => BOTH SHOULD BE ACTIVE 
        if (fromUserAccount.status != "Active" || toUserAccount.status != "Active") {
            return res.status(401).json({
                message: "either fromUser or toUser account is not in active status"
            })
        }

        // 4. ***  DERIVE SENDER BALANCE FROM LEDGER ***
        // use aggregate pipeline => because 
        const balance = await fromUserAccount.getBalance()
        if (balance < amount) {
            return res.status(400).json({
                message: "bhai bhejne ko balance he nhi hai terpai ..."
            })
        }

        //5. CREATE TRANSACTION {INITIALLY AT PENDING STATE}
        //6. CREATE DEBIT LEDGER ENTRY 
        //7. CREATE CREDIT LEDGER ENTRY 
        //8. MARK THE TRANSACTION COMPLETE FIRST 
        //9. UPDATE THE TRANSACTION TO DB 

        // and for creating transaction we creates session=> so that either all occures at once or none ... 
        const session = await mongoose.startSession();
        session.startTransaction();

        let transaction;
        try {
            // Awaiting transaction creation in session
            const [createdTransaction] = await transactionModel.create([
                {
                    fromAccount: fromUserAccount._id,
                    toAccount: toUserAccount._id,
                    amount,
                    idempotencyKey,
                    status: "PENDING"
                }
            ], { session });

            transaction = createdTransaction;

            const debitLedgerEntry = await ledgerModel.create([{
                account: fromUserAccount._id,
                amount: amount,
                transaction: transaction._id,
                type: "DEBIT"
            }], { session });

            const creditLedgerEntry = await ledgerModel.create([{
                account: toUserAccount._id,
                amount: amount,
                transaction: transaction._id,
                type: "CREDIT"
            }], { session });

            // Mark transaction completed
            transaction.status = "COMPLETE";
            await transaction.save({ session });
            await session.commitTransaction();
            session.endSession();
        } catch (txnError) {
            await session.abortTransaction();
            session.endSession();
            throw txnError;
        }
        //10. THE USER WITH THE NOTIFICATION OF TRANSACTION COMPLETION (BOTH SENDER & RECEIVER)
        Promise.all([
            emailService.sendTransactionSuccessEmail(req.user.email, req.user.name, amount, transaction._id, toUserAccount._id),
            toUserAccount.user?.email ? emailService.sendTransactionCreditEmail(toUserAccount.user.email, toUserAccount.user.name, amount, transaction._id, fromUserAccount._id) : Promise.resolve()
        ]).catch(err => console.error("Email Notification Error:", err.message));

        return res.status(201).json({
            message: "Transaction completed and Acknowledge Successfully",
            transaction: transaction
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

async function createInitialFundsTransaction(req, res, next) {
    try {
        const { toAccount, amount, idempotencyKey } = req.body;
        if (!toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: "toAccount , amount , idempotency key is missing to Initiate funds"
            });
        }

        const toUserAccount = await accountModel.findOne({
            _id: toAccount,
        });

        // 1. Validate target account
        if (!toUserAccount) {
            return res.status(404).json({
                message: "account not found .. "
            });
        }

        // 2. Find system user's bank account (authSystemUserMiddleware already verified req.user is a systemUser)
        const fromUserAccount = await accountModel.findOne({
            user: req.user._id
        });

        if (!fromUserAccount) {
            return res.status(404).json({
                message: "System account not found."
            });
        }

        // 3. NOW INITIATING TRANSACTION IN SESSION
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Awaiting transaction creation in session
            const [transaction] = await transactionModel.create([
                {
                    fromAccount: fromUserAccount._id,
                    toAccount: toUserAccount._id,
                    amount,
                    idempotencyKey,
                    status: "PENDING"
                }
            ], { session });

            const debitLedgerEntry = await ledgerModel.create([{
                account: fromUserAccount._id,
                amount: amount,
                transaction: transaction._id,
                type: "DEBIT"
            }], { session });

            const creditLedgerEntry = await ledgerModel.create([{
                account: toUserAccount._id,
                amount: amount,
                transaction: transaction._id,
                type: "CREDIT"
            }], { session });

            // Mark transaction completed
            transaction.status = "COMPLETE";
            await transaction.save({ session });
            await session.commitTransaction();
            session.endSession();

            // Acknowledge
            return res.status(201).json({
                message: "Funds added to the account successfully",
                transaction
            });
        } catch (txnError) {
            await session.abortTransaction();
            session.endSession();
            throw txnError;
        }
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

module.exports = {
    createTransacitoncontroller,
    createInitialFundsTransaction
};