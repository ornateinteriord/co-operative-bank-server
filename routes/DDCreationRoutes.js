const express = require("express");
const router = express.Router();
const {
  createDDCreation,
  getDDCreations,
  getDDCreationById,
  updateDDCreation,
  deleteDDCreation,
} = require("../controllers/Admin/Banking/ddCreation");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");

// DD Creation endpoints
router.post("/dd-creations", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), createDDCreation);
router.get("/dd-creations", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getDDCreations);
router.get("/dd-creations/:ddId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), getDDCreationById);
router.put("/dd-creations/:ddId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), updateDDCreation);
router.delete("/dd-creations/:ddId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), deleteDDCreation);

module.exports = router;
