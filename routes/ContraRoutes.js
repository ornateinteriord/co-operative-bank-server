const express = require("express");
const router = express.Router();
const {
  createContra,
  getContras,
  getContraById,
  updateContra,
  deleteContra,
} = require("../controllers/Admin/Banking/contra");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");

// Contra endpoints
router.post("/contra", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), createContra);
router.get("/contra", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getContras);
router.get("/contra/:contraId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getContraById);
router.put("/contra/:contraId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), updateContra);
router.delete("/contra/:contraId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), deleteContra);

module.exports = router;
