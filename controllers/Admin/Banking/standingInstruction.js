const mongoose = require("mongoose");
const StandingInstructionModel = require("../../../models/standingInstruction.model");

// Create Standing Instruction
const createStandingInstruction = async (req, res) => {
  try {
    const {
      si_id,
      processing_date,
      time,
      section_id,
      tran_date,
      dr_account,
      cr_account,
      user,
      amount,
      frequency,
      start_date,
      end_date,
      narration,
      status,
    } = req.body;

    if (!dr_account || !cr_account) {
      return res.status(400).json({
        success: false,
        message: "Debit account and Credit account are required",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid transfer amount is required",
      });
    }

    // Auto-generate si_id with SI prefix
    let finalSiId = si_id;
    if (!finalSiId) {
      const lastSi = await StandingInstructionModel.findOne().sort({ createdAt: -1 });
      let nextId = 1;
      if (lastSi && lastSi.si_id) {
        const parsed = parseInt(lastSi.si_id.replace(/^SI/, ""));
        if (!isNaN(parsed)) nextId = parsed + 1;
      }
      finalSiId = `SI${nextId.toString().padStart(4, "0")}`;
    }

    const newSI = await StandingInstructionModel.create({
      si_id: finalSiId,
      processing_date: processing_date || new Date(),
      time,
      section_id: section_id || "01-BANKING SECTION",
      tran_date: tran_date || new Date(),
      dr_account,
      cr_account,
      user: user || req.user?.username || "ADMIN_USER",
      amount: Number(amount),
      frequency: frequency || "Monthly",
      start_date: start_date || new Date(),
      end_date: end_date || null,
      narration,
      status: status || "active",
    });

    res.status(201).json({
      success: true,
      message: "Standing instruction created successfully",
      data: newSI,
    });
  } catch (error) {
    console.error("Error in createStandingInstruction:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create standing instruction",
    });
  }
};

// Get all Standing Instructions (with pagination and search)
const getStandingInstructions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status;

    const query = {};
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { si_id: { $regex: search, $options: "i" } },
        { dr_account: { $regex: search, $options: "i" } },
        { cr_account: { $regex: search, $options: "i" } },
        { user: { $regex: search, $options: "i" } },
        { section_id: { $regex: search, $options: "i" } },
        { narration: { $regex: search, $options: "i" } },
      ];
    }

    const total = await StandingInstructionModel.countDocuments(query);
    const instructions = await StandingInstructionModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: instructions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getStandingInstructions:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch standing instructions",
    });
  }
};

// Get single Standing Instruction by ID
const getStandingInstructionById = async (req, res) => {
  try {
    const { siId } = req.params;
    const instruction = await StandingInstructionModel.findOne({
      $or: [
        { si_id: siId },
        { _id: mongoose.Types.ObjectId.isValid(siId) ? siId : null },
      ].filter(Boolean),
    });

    if (!instruction) {
      return res.status(404).json({
        success: false,
        message: "Standing instruction not found",
      });
    }

    res.status(200).json({
      success: true,
      data: instruction,
    });
  } catch (error) {
    console.error("Error in getStandingInstructionById:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch standing instruction details",
    });
  }
};

// Update Standing Instruction
const updateStandingInstruction = async (req, res) => {
  try {
    const { siId } = req.params;
    const updated = await StandingInstructionModel.findOneAndUpdate(
      {
        $or: [
          { si_id: siId },
          { _id: mongoose.Types.ObjectId.isValid(siId) ? siId : null },
        ].filter(Boolean),
      },
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Standing instruction not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Standing instruction updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error in updateStandingInstruction:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update standing instruction",
    });
  }
};

// Delete Standing Instruction
const deleteStandingInstruction = async (req, res) => {
  try {
    const { siId } = req.params;
    const deleted = await StandingInstructionModel.findOneAndDelete({
      $or: [
        { si_id: siId },
        { _id: mongoose.Types.ObjectId.isValid(siId) ? siId : null },
      ].filter(Boolean),
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Standing instruction not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Standing instruction deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error in deleteStandingInstruction:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete standing instruction",
    });
  }
};

module.exports = {
  createStandingInstruction,
  getStandingInstructions,
  getStandingInstructionById,
  updateStandingInstruction,
  deleteStandingInstruction,
};
