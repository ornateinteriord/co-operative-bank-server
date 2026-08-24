const mongoose = require("mongoose");
const PayDemandModel = require("../../../models/payDemand.model");

// Create Pay Demand
const createPayDemand = async (req, res) => {
  try {
    const {
      demand_no,
      tran_type,
      sub_type,
      date_from,
      date_to,
      location,
      section_id,
      user,
      show_last_10,
      member_id,
      member_name,
      account_no,
      amount,
      due_date,
      narration,
      status,
    } = req.body;

    // Auto-generate demand_no with DEM prefix
    let finalDemandNo = demand_no;
    if (!finalDemandNo) {
      const lastDemand = await PayDemandModel.findOne().sort({ createdAt: -1 });
      let nextId = 1;
      if (lastDemand && lastDemand.demand_no) {
        const parsed = parseInt(lastDemand.demand_no.replace(/^DEM-?/, ""));
        if (!isNaN(parsed)) nextId = parsed + 1;
      }
      finalDemandNo = `DEM-${nextId.toString().padStart(5, "0")}`;
    }

    const newDemand = await PayDemandModel.create({
      demand_no: finalDemandNo,
      tran_type: tran_type || "Payment",
      sub_type: sub_type || "Cash",
      date_from: date_from || new Date(),
      date_to: date_to || new Date(),
      location: location || "001-HO MAIN BRANCH",
      section_id: section_id || "01-BANKING SECTION",
      user: user || req.user?.username || "ADMIN_USER",
      show_last_10: Boolean(show_last_10),
      member_id,
      member_name,
      account_no,
      amount: Number(amount) || 0,
      due_date: due_date || null,
      narration,
      status: status || "pending",
    });

    res.status(201).json({
      success: true,
      message: "Pay demand notice created successfully",
      data: newDemand,
    });
  } catch (error) {
    console.error("Error in createPayDemand:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create pay demand",
    });
  }
};

// Get all Pay Demands (with filters, pagination and search)
const getPayDemands = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const tran_type = req.query.tran_type;
    const sub_type = req.query.sub_type;
    const location = req.query.location;
    const section_id = req.query.section_id;
    const user = req.query.user;
    const status = req.query.status;
    const show_last_10 = req.query.show_last_10 === "true";

    const query = {};
    if (status) query.status = status;
    if (tran_type && tran_type !== "-ALL-") query.tran_type = tran_type;
    if (sub_type && sub_type !== "-ALL-") query.sub_type = sub_type;
    if (location && location !== "-ALL-") query.location = location;
    if (section_id && section_id !== "-ALL-") query.section_id = section_id;
    if (user && user !== "-ALL-") query.user = user;

    if (search) {
      query.$or = [
        { demand_no: { $regex: search, $options: "i" } },
        { member_id: { $regex: search, $options: "i" } },
        { member_name: { $regex: search, $options: "i" } },
        { account_no: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { tran_type: { $regex: search, $options: "i" } },
        { sub_type: { $regex: search, $options: "i" } },
      ];
    }

    const total = await PayDemandModel.countDocuments(query);
    const effectiveLimit = show_last_10 ? 10 : limit;

    const demands = await PayDemandModel.find(query)
      .sort({ createdAt: -1 })
      .skip(show_last_10 ? 0 : (page - 1) * limit)
      .limit(effectiveLimit);

    res.status(200).json({
      success: true,
      data: demands,
      pagination: {
        total: show_last_10 ? Math.min(total, 10) : total,
        page,
        limit: effectiveLimit,
        totalPages: show_last_10 ? 1 : Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getPayDemands:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch pay demands",
    });
  }
};

// Get single Pay Demand by ID
const getPayDemandById = async (req, res) => {
  try {
    const { demandId } = req.params;
    const demand = await PayDemandModel.findOne({
      $or: [
        { demand_no: demandId },
        { _id: mongoose.Types.ObjectId.isValid(demandId) ? demandId : null },
      ].filter(Boolean),
    });

    if (!demand) {
      return res.status(404).json({
        success: false,
        message: "Pay demand notice not found",
      });
    }

    res.status(200).json({
      success: true,
      data: demand,
    });
  } catch (error) {
    console.error("Error in getPayDemandById:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch pay demand",
    });
  }
};

// Update Pay Demand
const updatePayDemand = async (req, res) => {
  try {
    const { demandId } = req.params;
    const updated = await PayDemandModel.findOneAndUpdate(
      {
        $or: [
          { demand_no: demandId },
          { _id: mongoose.Types.ObjectId.isValid(demandId) ? demandId : null },
        ].filter(Boolean),
      },
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Pay demand notice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pay demand notice updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error in updatePayDemand:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update pay demand",
    });
  }
};

// Delete Pay Demand
const deletePayDemand = async (req, res) => {
  try {
    const { demandId } = req.params;
    const deleted = await PayDemandModel.findOneAndDelete({
      $or: [
        { demand_no: demandId },
        { _id: mongoose.Types.ObjectId.isValid(demandId) ? demandId : null },
      ].filter(Boolean),
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Pay demand notice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pay demand notice deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error in deletePayDemand:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete pay demand",
    });
  }
};

module.exports = {
  createPayDemand,
  getPayDemands,
  getPayDemandById,
  updatePayDemand,
  deletePayDemand,
};
