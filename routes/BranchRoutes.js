const express = require("express");
const router = express.Router();
const {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} = require("../controllers/Admin/Branch/index");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");

// Branch endpoints
router.post("/branches", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), createBranch);
router.get("/branches", Authenticated, authorizeRoles("ADMIN", "ADMIN_01", "AGENT"), getBranches);
router.get("/branches/:branchId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01", "AGENT"), getBranchById);
router.put("/branches/:branchId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), updateBranch);
router.delete("/branches/:branchId", Authenticated, authorizeRoles("ADMIN", "ADMIN_01"), deleteBranch);

module.exports = router;
