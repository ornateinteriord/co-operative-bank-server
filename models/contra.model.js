const mongoose = require("mongoose");

const contraSchema = mongoose.Schema(
  {
    contra_id: {
      type: String,
      required: true,
      unique: true,
    },
    contra_no: {
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
    mode_of_contra: {
      type: String,
      default: "Cash",
    },
    ref_no: {
      type: String,
      default: null,
    },
    particulars: {
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
  { timestamps: true, collection: "contra_tbl" }
);

const ContraModel = mongoose.model("contra_tbl", contraSchema);
module.exports = ContraModel;
