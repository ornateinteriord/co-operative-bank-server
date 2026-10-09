const express = require("express");
const router = express.Router();
const {
    getAllCashTransactions,
    getCashTransactionById,
    createCashTransaction,
    deleteCashTransaction,
    createMaturityPayment,
    prematureClosureAccount,
    previewPrematureClosure,
} = require("../controllers/Admin/Banking/cashTransaction");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");


router.get("/", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getAllCashTransactions);
router.get("/:id", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getCashTransactionById);
router.post("/", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), createCashTransaction);
router.delete("/:id", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), deleteCashTransaction);

// Maturity payout (online/cash/cheque)
router.post("/maturity-payment", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), createMaturityPayment);

// Premature closure of FD/RD with penalty calculation
router.get("/premature-closure/preview", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), previewPrematureClosure);
router.post("/premature-closure/preview", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), previewPrematureClosure);
router.post("/premature-closure", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), prematureClosureAccount);



module.exports = router;

