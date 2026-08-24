const mongoose = require("mongoose");

const journalSchema = mongoose.Schema(
  {
    journal_id: {
      type: String,
      required: true,
      unique: true,
    },
    journal_no: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    debit_from: {
      type: String,
      default: null,
    },
    credit_to: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    mode_of_entry: {
      type: String,
      default: "Transfer",
    },
    ref_no: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    narration: {
      type: String,
      default: null,
    },
    branch_code: {
      type: String,
      default: "001",
    },
    entered_by: {
      type: String,
      default: "ADMIN",
    },
    member_id: {
      type: String,
      default: null,
    },
    account_no: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "cancelled", "completed", "pending"],
    },
  },
  { timestamps: true, collection: "journal_tbl" }
);

const JournalModel = mongoose.model("journal_tbl", journalSchema);
module.exports = JournalModel;
