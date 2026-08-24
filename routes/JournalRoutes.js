const express = require("express");
const router = express.Router();
const {
  createJournal,
  getJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
} = require("../controllers/Admin/Banking/journal");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");

// Journal endpoints
router.post("/journal", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), createJournal);
router.get("/journal", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getJournals);
router.get("/journal/:journalId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getJournalById);
router.put("/journal/:journalId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), updateJournal);
router.delete("/journal/:journalId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), deleteJournal);

module.exports = router;
