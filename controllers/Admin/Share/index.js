const mongoose = require("mongoose");
const ShareModel = require("../../../models/share.model");

// Create Share Allotment
const createShare = async (req, res) => {
  try {
    const {
      share_id,
      certificate_no,
      folio_no,
      allotment_date,
      member_id,
      member_name,
      share_type,
      number_of_shares,
      face_value,
      total_amount,
      mode_of_payment,
      dividend_rate,
      nominee_name,
      nominee_relation,
      branch_code,
      status,
      remarks,
    } = req.body;

    if (!member_id || !member_name) {
      return res.status(400).json({
        success: false,
        message: "Member ID and Member Name are required",
      });
    }

    // Auto-generate share_id with SHR prefix
    let finalShareId = share_id;
    if (!finalShareId) {
      const lastShare = await ShareModel.findOne().sort({ createdAt: -1 });
      let nextId = 1;
      if (lastShare && lastShare.share_id) {
        const parsed = parseInt(lastShare.share_id.replace(/^SHR/, ""));
        if (!isNaN(parsed)) nextId = parsed + 1;
      }
      finalShareId = `SHR${nextId.toString().padStart(4, "0")}`;
    }

    const finalCertNo = certificate_no || `CERT-${Date.now().toString().slice(-6)}`;
    const finalFolioNo = folio_no || `FOL-${Date.now().toString().slice(-4)}`;
    const sharesCount = Number(number_of_shares) || 10;
    const fValue = Number(face_value) || 100;
    const tAmount = Number(total_amount) || sharesCount * fValue;

    const newShare = await ShareModel.create({
      share_id: finalShareId,
      certificate_no: finalCertNo,
      folio_no: finalFolioNo,
      allotment_date: allotment_date || new Date(),
      member_id,
      member_name,
      share_type: share_type || "Ordinary Equity Share",
      number_of_shares: sharesCount,
      face_value: fValue,
      total_amount: tAmount,
      mode_of_payment: mode_of_payment || "Cash",
      dividend_rate: Number(dividend_rate) || 12.0,
      nominee_name,
      nominee_relation,
      branch_code: branch_code || "001",
      status: status || "active",
      remarks,
    });

    res.status(201).json({
      success: true,
      message: "Share allotment created successfully",
      data: newShare,
    });
  } catch (error) {
    console.error("Error in createShare:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create share allotment",
    });
  }
};

// Get all Shares (with pagination and search)
const getShares = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status;

    const query = {};
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { share_id: { $regex: search, $options: "i" } },
        { certificate_no: { $regex: search, $options: "i" } },
        { folio_no: { $regex: search, $options: "i" } },
        { member_id: { $regex: search, $options: "i" } },
        { member_name: { $regex: search, $options: "i" } },
        { nominee_name: { $regex: search, $options: "i" } },
      ];
    }

    const total = await ShareModel.countDocuments(query);
    const shares = await ShareModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: shares,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getShares:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch share records",
    });
  }
};

// Get single Share by ID
const getShareById = async (req, res) => {
  try {
    const { shareId } = req.params;
    const share = await ShareModel.findOne({
      $or: [
        { share_id: shareId },
        { _id: mongoose.Types.ObjectId.isValid(shareId) ? shareId : null },
      ].filter(Boolean),
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: "Share record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: share,
    });
  } catch (error) {
    console.error("Error in getShareById:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch share details",
    });
  }
};

// Update Share
const updateShare = async (req, res) => {
  try {
    const { shareId } = req.params;
    const updatedShare = await ShareModel.findOneAndUpdate(
      {
        $or: [
          { share_id: shareId },
          { _id: mongoose.Types.ObjectId.isValid(shareId) ? shareId : null },
        ].filter(Boolean),
      },
      { $set: req.body },
      { new: true }
    );

    if (!updatedShare) {
      return res.status(404).json({
        success: false,
        message: "Share record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Share record updated successfully",
      data: updatedShare,
    });
  } catch (error) {
    console.error("Error in updateShare:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update share record",
    });
  }
};

// Delete Share
const deleteShare = async (req, res) => {
  try {
    const { shareId } = req.params;
    const deleted = await ShareModel.findOneAndDelete({
      $or: [
        { share_id: shareId },
        { _id: mongoose.Types.ObjectId.isValid(shareId) ? shareId : null },
      ].filter(Boolean),
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Share record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Share record deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error in deleteShare:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete share record",
    });
  }
};

module.exports = {
  createShare,
  getShares,
  getShareById,
  updateShare,
  deleteShare,
};
