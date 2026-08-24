const express = require("express");
const router = express.Router();
const {
  createPayDemand,
  getPayDemands,
  getPayDemandById,
  updatePayDemand,
  deletePayDemand,
} = require("../controllers/Admin/Banking/payDemand");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");

// Pay Demand endpoints
router.post("/pay-demands", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), createPayDemand);
router.get("/pay-demands", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getPayDemands);
router.get("/pay-demands/:demandId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getPayDemandById);
router.put("/pay-demands/:demandId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), updatePayDemand);
router.delete("/pay-demands/:demandId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), deletePayDemand);

module.exports = router;
