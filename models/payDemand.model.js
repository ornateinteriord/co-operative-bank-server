const mongoose = require("mongoose");

const payDemandSchema = mongoose.Schema(
  {
    demand_no: {
      type: String,
      required: true,
      unique: true,
    },
    tran_type: {
      type: String,
      default: "Payment",
    },
    sub_type: {
      type: String,
      default: "Cash",
    },
    date_from: {
      type: Date,
      default: Date.now,
    },
    date_to: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: String,
      default: "001-HO MAIN BRANCH",
    },
    section_id: {
      type: String,
      default: "01-BANKING SECTION",
    },
    user: {
      type: String,
      default: "ADMIN_USER",
    },
    show_last_10: {
      type: Boolean,
      default: false,
    },
    member_id: {
      type: String,
      default: null,
    },
    member_name: {
      type: String,
      default: null,
    },
    account_no: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      default: 0,
    },
    due_date: {
      type: Date,
      default: null,
    },
    narration: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "active", "cleared", "completed", "overdue", "cancelled"],
    },
  },
  { timestamps: true, collection: "pay_demands_tbl" }
);

const PayDemandModel = mongoose.model("pay_demands_tbl", payDemandSchema);
module.exports = PayDemandModel;
