const express = require("express");
const router = express.Router();
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");
const {
  getPassbookDetails,
  getUserAccountsForPassbook,
  searchAccountsForPassbook,
  updatePassbookPrintStatus,
} = require("../controllers/Passbook/PassbookController");

// Get passbook details for an account (Accessible to admin and the account holder)
router.get(
  "/details/:accountId",
  Authenticated,
  authorizeRoles(["ADMIN", "ADMIN_01", "USER"]),
  getPassbookDetails
);

// Get all accounts/loans for authenticated user's passbook selector
router.get(
  "/user/accounts",
  Authenticated,
  authorizeRoles(["USER"]),
  getUserAccountsForPassbook
);

// Search accounts for admin passbook printing
router.get(
  "/admin/search",
  Authenticated,
  authorizeRoles(["ADMIN", "ADMIN_01"]),
  searchAccountsForPassbook
);

// Update passbook print status (Admin only)
router.put(
  "/update-print-status",
  Authenticated,
  authorizeRoles(["ADMIN", "ADMIN_01"]),
  updatePassbookPrintStatus
);

module.exports = router;
