const {Router}=require('express');
const {authMiddleware,authSystemUserMiddlware}=require('../middleware/auth.middleware');
const transactionController=require('../controller/transaction.controller')
 

const transactionRoutes = Router();
// initialize transaction
// POST /api/transaction/system/add-funds THIS ROUTE
transactionRoutes.post('/system/add-funds',authMiddleware,authSystemUserMiddlware,transactionController.createInitialFundsTransaction)

// User-to-User Fund Transfer (Normal Authenticated User)
// POST /api/transaction/
transactionRoutes.post('/', authMiddleware, transactionController.createTransacitoncontroller);

module.exports=transactionRoutes;