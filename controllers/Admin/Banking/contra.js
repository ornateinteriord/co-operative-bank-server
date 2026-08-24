const mongoose = require("mongoose");
const ContraModel = require("../../../models/contra.model");

// Create Contra
const createContra = async (req, res) => {
  try {
    const {
      date,
      debit_from,
      credit_to,
      amount,
      mode_of_contra,
      ref_no,
      particulars,
      narration,
      branch_code,
      entered_by,
      member_id,
      account_no,
      status,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid contra amount is required",
      });
    }

    // Auto-generate contra_id with CNT prefix
    const lastContra = await ContraModel.findOne().sort({ createdAt: -1 });
    let newContraId = "CNT0001";
    if (lastContra && lastContra.contra_id) {
      const numericPart = lastContra.contra_id.replace(/^CNT/, "");
      const lastId = parseInt(numericPart);
      if (!isNaN(lastId)) {
        newContraId = `CNT${(lastId + 1).toString().padStart(4, "0")}`;
      }
    }

    const newContra = await ContraModel.create({
      contra_id: newContraId,
      contra_no: req.body.contra_no || newContraId,
      date: date || new Date(),
      debit_from,
      credit_to,
      amount,
      mode_of_contra: mode_of_contra || "Cash",
      ref_no,
      particulars,
      narration,
      branch_code: branch_code || "001",
      entered_by: entered_by || req.user?.username || "ADMIN",
      member_id,
      account_no,
      status: status || "active",
    });

    res.status(201).json({
      success: true,
      message: "Contra voucher created successfully",
      data: newContra,
    });
  } catch (error) {
    console.error("Error in createContra:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create contra voucher",
    });
  }
};

// Get all Contras (with pagination and search)
const getContras = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status;

    const query = {};
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { contra_id: { $regex: search, $options: "i" } },
        { contra_no: { $regex: search, $options: "i" } },
        { debit_from: { $regex: search, $options: "i" } },
        { credit_to: { $regex: search, $options: "i" } },
        { member_id: { $regex: search, $options: "i" } },
        { particulars: { $regex: search, $options: "i" } },
        { ref_no: { $regex: search, $options: "i" } },
      ];
    }

    const total = await ContraModel.countDocuments(query);
    const contras = await ContraModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: contras,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getContras:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch contra records",
    });
  }
};

// Get single Contra by ID
const getContraById = async (req, res) => {
  try {
    const { contraId } = req.params;
    const contra = await ContraModel.findOne({
      $or: [
        { contra_id: contraId },
        { _id: mongoose.Types.ObjectId.isValid(contraId) ? contraId : null },
      ].filter(Boolean),
    });

    if (!contra) {
      return res.status(404).json({
        success: false,
        message: "Contra voucher not found",
      });
    }

    res.status(200).json({
      success: true,
      data: contra,
    });
  } catch (error) {
    console.error("Error in getContraById:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch contra voucher",
    });
  }
};

// Update Contra
const updateContra = async (req, res) => {
  try {
    const { contraId } = req.params;
    const updatedContra = await ContraModel.findOneAndUpdate(
      {
        $or: [
          { contra_id: contraId },
          { _id: mongoose.Types.ObjectId.isValid(contraId) ? contraId : null },
        ].filter(Boolean),
      },
      { $set: req.body },
      { new: true }
    );

    if (!updatedContra) {
      return res.status(404).json({
        success: false,
        message: "Contra voucher not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contra voucher updated successfully",
      data: updatedContra,
    });
  } catch (error) {
    console.error("Error in updateContra:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update contra voucher",
    });
  }
};

// Delete Contra
const deleteContra = async (req, res) => {
  try {
    const { contraId } = req.params;
    const deleted = await ContraModel.findOneAndDelete({
      $or: [
        { contra_id: contraId },
        { _id: mongoose.Types.ObjectId.isValid(contraId) ? contraId : null },
      ].filter(Boolean),
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Contra voucher not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contra voucher deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error in deleteContra:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete contra voucher",
    });
  }
};

module.exports = {
  createContra,
  getContras,
  getContraById,
  updateContra,
  deleteContra,
};
