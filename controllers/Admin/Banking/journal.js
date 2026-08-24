const mongoose = require("mongoose");
const JournalModel = require("../../../models/journal.model");

// Create Journal
const createJournal = async (req, res) => {
  try {
    const {
      date,
      debit_from,
      credit_to,
      amount,
      mode_of_entry,
      ref_no,
      description,
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
        message: "Valid journal amount is required",
      });
    }

    // Auto-generate journal_id with JRN prefix
    const lastJournal = await JournalModel.findOne().sort({ createdAt: -1 });
    let newJournalId = "JRN0001";
    if (lastJournal && lastJournal.journal_id) {
      const numericPart = lastJournal.journal_id.replace(/^JRN/, "");
      const lastId = parseInt(numericPart);
      if (!isNaN(lastId)) {
        newJournalId = `JRN${(lastId + 1).toString().padStart(4, "0")}`;
      }
    }

    const newJournal = await JournalModel.create({
      journal_id: newJournalId,
      journal_no: req.body.journal_no || newJournalId,
      date: date || new Date(),
      debit_from,
      credit_to,
      amount,
      mode_of_entry: mode_of_entry || "Transfer",
      ref_no,
      description,
      narration,
      branch_code: branch_code || "001",
      entered_by: entered_by || req.user?.username || "ADMIN",
      member_id,
      account_no,
      status: status || "active",
    });

    res.status(201).json({
      success: true,
      message: "Journal entry created successfully",
      data: newJournal,
    });
  } catch (error) {
    console.error("Error in createJournal:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create journal entry",
    });
  }
};

// Get all Journals (with pagination and search)
const getJournals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status;

    const query = {};
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { journal_id: { $regex: search, $options: "i" } },
        { journal_no: { $regex: search, $options: "i" } },
        { debit_from: { $regex: search, $options: "i" } },
        { credit_to: { $regex: search, $options: "i" } },
        { member_id: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { ref_no: { $regex: search, $options: "i" } },
      ];
    }

    const total = await JournalModel.countDocuments(query);
    const journals = await JournalModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: journals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getJournals:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch journal records",
    });
  }
};

// Get single Journal by ID
const getJournalById = async (req, res) => {
  try {
    const { journalId } = req.params;
    const journal = await JournalModel.findOne({
      $or: [
        { journal_id: journalId },
        { _id: mongoose.Types.ObjectId.isValid(journalId) ? journalId : null },
      ].filter(Boolean),
    });

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found",
      });
    }

    res.status(200).json({
      success: true,
      data: journal,
    });
  } catch (error) {
    console.error("Error in getJournalById:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch journal entry",
    });
  }
};

// Update Journal
const updateJournal = async (req, res) => {
  try {
    const { journalId } = req.params;
    const updatedJournal = await JournalModel.findOneAndUpdate(
      {
        $or: [
          { journal_id: journalId },
          { _id: mongoose.Types.ObjectId.isValid(journalId) ? journalId : null },
        ].filter(Boolean),
      },
      { $set: req.body },
      { new: true }
    );

    if (!updatedJournal) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Journal entry updated successfully",
      data: updatedJournal,
    });
  } catch (error) {
    console.error("Error in updateJournal:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update journal entry",
    });
  }
};

// Delete Journal
const deleteJournal = async (req, res) => {
  try {
    const { journalId } = req.params;
    const deleted = await JournalModel.findOneAndDelete({
      $or: [
        { journal_id: journalId },
        { _id: mongoose.Types.ObjectId.isValid(journalId) ? journalId : null },
      ].filter(Boolean),
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Journal entry deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error in deleteJournal:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete journal entry",
    });
  }
};

module.exports = {
  createJournal,
  getJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
};
