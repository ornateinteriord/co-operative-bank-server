const express = require("express");
const router = express.Router();
const {
  createStandingInstruction,
  getStandingInstructions,
  getStandingInstructionById,
  updateStandingInstruction,
  deleteStandingInstruction,
} = require("../controllers/Admin/Banking/standingInstruction");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");

// Standing Instruction endpoints
router.post("/standing-instructions", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), createStandingInstruction);
router.get("/standing-instructions", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getStandingInstructions);
router.get("/standing-instructions/:siId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getStandingInstructionById);
router.put("/standing-instructions/:siId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), updateStandingInstruction);
router.delete("/standing-instructions/:siId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), deleteStandingInstruction);

module.exports = router;
