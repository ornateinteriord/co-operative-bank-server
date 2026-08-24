const express = require("express");
const router = express.Router();
const {
  createShare,
  getShares,
  getShareById,
  updateShare,
  deleteShare,
} = require("../controllers/Admin/Share/index");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");

// Share endpoints
router.post("/shares", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), createShare);
router.get("/shares", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getShares);
router.get("/shares/:shareId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getShareById);
router.put("/shares/:shareId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), updateShare);
router.delete("/shares/:shareId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), deleteShare);

module.exports = router;
