const mongoose = require("mongoose");
const DDCreationModel = require("../../../models/ddCreation.model");

// Create DD
const createDDCreation = async (req, res) => {
  try {
    const {
      dd_id,
      dd_no,
      date,
      purchaser_name,
      beneficiary_name,
      payable_at,
      amount,
      commission,
      total_amount,
      branch_code,
      status,
      remarks,
    } = req.body;

    if (!purchaser_name || !beneficiary_name || !payable_at) {
      return res.status(400).json({
        success: false,
        message: "Purchaser name, beneficiary name and payable branch location are required",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid DD amount is required",
      });
    }

    // Auto-generate dd_id and dd_no
    let finalDdId = dd_id;
    let finalDdNo = dd_no;
    if (!finalDdId || !finalDdNo) {
      const lastDD = await DDCreationModel.findOne().sort({ createdAt: -1 });
      let nextId = 1;
      if (lastDD && lastDD.dd_id) {
        const parsed = parseInt(lastDD.dd_id.replace(/^DD/, ""));
        if (!isNaN(parsed)) nextId = parsed + 1;
      }
      if (!finalDdId) finalDdId = `DD${nextId.toString().padStart(4, "0")}`;
      if (!finalDdNo) finalDdNo = `DD-${Date.now().toString().slice(-6)}`;
    }

    const amt = Number(amount);
    const comm = Number(commission) || 0;
    const tot = total_amount ? Number(total_amount) : amt + comm;

    const newDD = await DDCreationModel.create({
      dd_id: finalDdId,
      dd_no: finalDdNo,
      date: date || new Date(),
      purchaser_name,
      beneficiary_name,
      payable_at,
      amount: amt,
      commission: comm,
      total_amount: tot,
      branch_code: branch_code || "001",
      status: status || "issued",
      remarks,
    });

    res.status(201).json({
      success: true,
      message: "Demand draft created successfully",
      data: newDD,
    });
  } catch (error) {
    console.error("Error in createDDCreation:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create demand draft",
    });
  }
};

// Get all DDs (with pagination and search)
const getDDCreations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status;

    const query = {};
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { dd_id: { $regex: search, $options: "i" } },
        { dd_no: { $regex: search, $options: "i" } },
        { purchaser_name: { $regex: search, $options: "i" } },
        { beneficiary_name: { $regex: search, $options: "i" } },
        { payable_at: { $regex: search, $options: "i" } },
      ];
    }

    const total = await DDCreationModel.countDocuments(query);
    const dds = await DDCreationModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: dds,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getDDCreations:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch demand drafts",
    });
  }
};

// Get single DD by ID
const getDDCreationById = async (req, res) => {
  try {
    const { ddId } = req.params;
    const dd = await DDCreationModel.findOne({
      $or: [
        { dd_id: ddId },
        { dd_no: ddId },
        { _id: mongoose.Types.ObjectId.isValid(ddId) ? ddId : null },
      ].filter(Boolean),
    });

    if (!dd) {
      return res.status(404).json({
        success: false,
        message: "Demand draft not found",
      });
    }

    res.status(200).json({
      success: true,
      data: dd,
    });
  } catch (error) {
    console.error("Error in getDDCreationById:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch demand draft",
    });
  }
};

// Update DD
const updateDDCreation = async (req, res) => {
  try {
    const { ddId } = req.params;
    const updated = await DDCreationModel.findOneAndUpdate(
      {
        $or: [
          { dd_id: ddId },
          { dd_no: ddId },
          { _id: mongoose.Types.ObjectId.isValid(ddId) ? ddId : null },
        ].filter(Boolean),
      },
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Demand draft not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Demand draft updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error in updateDDCreation:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update demand draft",
    });
  }
};

// Delete DD
const deleteDDCreation = async (req, res) => {
  try {
    const { ddId } = req.params;
    const deleted = await DDCreationModel.findOneAndDelete({
      $or: [
        { dd_id: ddId },
        { dd_no: ddId },
        { _id: mongoose.Types.ObjectId.isValid(ddId) ? ddId : null },
      ].filter(Boolean),
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Demand draft not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Demand draft deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error in deleteDDCreation:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete demand draft",
    });
  }
};

module.exports = {
  createDDCreation,
  getDDCreations,
  getDDCreationById,
  updateDDCreation,
  deleteDDCreation,
};
