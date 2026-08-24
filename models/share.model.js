const mongoose = require("mongoose");

const shareSchema = mongoose.Schema(
  {
    share_id: {
      type: String,
      required: true,
      unique: true,
    },
    certificate_no: {
      type: String,
      required: true,
    },
    folio_no: {
      type: String,
      default: null,
    },
    allotment_date: {
      type: Date,
      default: Date.now,
    },
    member_id: {
      type: String,
      required: true,
    },
    member_name: {
      type: String,
      required: true,
    },
    share_type: {
      type: String,
      default: "Ordinary Equity Share",
    },
    number_of_shares: {
      type: Number,
      required: true,
      default: 10,
    },
    face_value: {
      type: Number,
      required: true,
      default: 100,
    },
    total_amount: {
      type: Number,
      required: true,
      default: 1000,
    },
    mode_of_payment: {
      type: String,
      default: "Cash",
    },
    dividend_rate: {
      type: Number,
      default: 12.0,
    },
    nominee_name: {
      type: String,
      default: null,
    },
    nominee_relation: {
      type: String,
      default: null,
    },
    branch_code: {
      type: String,
      default: "001",
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "transferred", "surrendered"],
    },
    remarks: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, collection: "shares_tbl" }
);

const ShareModel = mongoose.model("shares_tbl", shareSchema);
module.exports = ShareModel;
