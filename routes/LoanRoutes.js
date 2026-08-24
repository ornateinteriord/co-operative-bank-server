const express = require("express");
const router = express.Router();
const {
  createLoan,
  getLoans,
  getLoanById,
  updateLoan,
  deleteLoan,
} = require("../controllers/Admin/Loan/index");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");

// Loan Master endpoints
router.post("/loans", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), createLoan);
router.get("/loans", Authenticated, authorizeRoles("ADMIN", "ADMIN_01", "AGENT"), getLoans);
router.get("/loans/:loanId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01", "AGENT"), getLoanById);
router.put("/loans/:loanId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), updateLoan);
router.delete("/loans/:loanId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), deleteLoan);

module.exports = router;
