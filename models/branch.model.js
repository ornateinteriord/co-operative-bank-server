const mongoose = require("mongoose");

const branchSchema = mongoose.Schema(
  {
    branch_id: {
      type: String,
      required: true,
      unique: true,
    },
    branch_name: {
      type: String,
      required: true,
    },
    branch_ledger_acc: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    section_id: {
      type: String,
      default: "01-BANKING SECTION",
    },
    branch_id_no: {
      type: String,
      default: null,
    },
    full_id_no: {
      type: String,
      default: null,
    },
    branch_cust_id_no: {
      type: String,
      default: null,
    },
    door_no: {
      type: String,
      default: null,
    },
    address1: {
      type: String,
      default: null,
    },
    address2: {
      type: String,
      default: null,
    },
    address3: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    state: {
      type: String,
      default: null,
    },
    pincode: {
      type: Number,
      default: null,
    },
    phone_code: {
      type: String,
      default: "+91",
    },
    phone_number: {
      type: String,
      default: null,
    },
    mobile_no: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
    website: {
      type: String,
      default: null,
    },
    date_of_operation: {
      type: Date,
      default: Date.now,
    },
    branch_prefix: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },
  },
  { timestamps: true, collection: "branch_tbl" }
);

const BranchModel = mongoose.model("branch_tbl", branchSchema);
module.exports = BranchModel;
