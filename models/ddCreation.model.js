const mongoose = require("mongoose");

const ddCreationSchema = mongoose.Schema(
  {
    dd_id: {
      type: String,
      required: true,
      unique: true,
    },
    dd_no: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    purchaser_name: {
      type: String,
      required: true,
    },
    beneficiary_name: {
      type: String,
      required: true,
    },
    payable_at: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    commission: {
      type: Number,
      default: 0,
    },
    total_amount: {
      type: Number,
      required: true,
      default: 0,
    },
    branch_code: {
      type: String,
      default: "001",
    },
    status: {
      type: String,
      default: "issued",
      enum: ["issued", "cleared", "cancelled"],
    },
    remarks: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, collection: "dd_creations_tbl" }
);

const DDCreationModel = mongoose.model("dd_creations_tbl", ddCreationSchema);
module.exports = DDCreationModel;
