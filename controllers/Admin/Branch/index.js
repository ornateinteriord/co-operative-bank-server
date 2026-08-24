const mongoose = require("mongoose");
const BranchModel = require("../../../models/branch.model");

// Create Branch
const createBranch = async (req, res) => {
  try {
    const {
      branch_id,
      branch_name,
      branch_ledger_acc,
      date,
      section_id,
      branch_id_no,
      full_id_no,
      branch_cust_id_no,
      door_no,
      address1,
      address2,
      address3,
      city,
      state,
      pincode,
      phone_code,
      phone_number,
      mobile_no,
      email,
      website,
      date_of_operation,
      branch_prefix,
      status,
    } = req.body;

    if (!branch_name) {
      return res.status(400).json({
        success: false,
        message: "Branch name is required",
      });
    }

    let finalBranchId = branch_id;
    if (!finalBranchId) {
      const lastBranch = await BranchModel.findOne().sort({ createdAt: -1 });
      let nextNum = 1;
      if (lastBranch && lastBranch.branch_id) {
        const parsed = parseInt(lastBranch.branch_id.replace(/\D/g, ""));
        if (!isNaN(parsed)) nextNum = parsed + 1;
      }
      finalBranchId = nextNum.toString().padStart(3, "0");
    }

    // Check if branch_id already exists
    const existing = await BranchModel.findOne({ branch_id: finalBranchId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Branch ID ${finalBranchId} already exists`,
      });
    }

    const newBranch = await BranchModel.create({
      branch_id: finalBranchId,
      branch_name,
      branch_ledger_acc,
      date: date || new Date(),
      section_id: section_id || "01-BANKING SECTION",
      branch_id_no,
      full_id_no,
      branch_cust_id_no,
      door_no,
      address1,
      address2,
      address3,
      city,
      state,
      pincode,
      phone_code: phone_code || "+91",
      phone_number,
      mobile_no,
      email,
      website,
      date_of_operation: date_of_operation || new Date(),
      branch_prefix,
      status: status || "active",
    });

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: newBranch,
    });
  } catch (error) {
    console.error("Error in createBranch:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create branch",
    });
  }
};

// Get all Branches (with pagination and search)
const getBranches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status;

    const query = {};
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { branch_id: { $regex: search, $options: "i" } },
        { branch_name: { $regex: search, $options: "i" } },
        { branch_ledger_acc: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile_no: { $regex: search, $options: "i" } },
        { address1: { $regex: search, $options: "i" } },
      ];
    }

    const total = await BranchModel.countDocuments(query);
    const branches = await BranchModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: branches,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getBranches:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch branches",
    });
  }
};

// Get single Branch by ID
const getBranchById = async (req, res) => {
  try {
    const { branchId } = req.params;
    const branch = await BranchModel.findOne({
      $or: [
        { branch_id: branchId },
        { _id: mongoose.Types.ObjectId.isValid(branchId) ? branchId : null },
      ].filter(Boolean),
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    res.status(200).json({
      success: true,
      data: branch,
    });
  } catch (error) {
    console.error("Error in getBranchById:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch branch details",
    });
  }
};

// Update Branch
const updateBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const updatedBranch = await BranchModel.findOneAndUpdate(
      {
        $or: [
          { branch_id: branchId },
          { _id: mongoose.Types.ObjectId.isValid(branchId) ? branchId : null },
        ].filter(Boolean),
      },
      { $set: req.body },
      { new: true }
    );

    if (!updatedBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      data: updatedBranch,
    });
  } catch (error) {
    console.error("Error in updateBranch:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update branch",
    });
  }
};

// Delete Branch
const deleteBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const deleted = await BranchModel.findOneAndDelete({
      $or: [
        { branch_id: branchId },
        { _id: mongoose.Types.ObjectId.isValid(branchId) ? branchId : null },
      ].filter(Boolean),
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Branch deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error in deleteBranch:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete branch",
    });
  }
};

module.exports = {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};
