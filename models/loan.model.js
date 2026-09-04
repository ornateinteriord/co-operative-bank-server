const mongoose = require("mongoose");

const loanSchema = mongoose.Schema(
  {
    loan_id: {
      type: String,
      required: true,
      unique: true,
    },
    account_no: {
      type: String,
      required: true,
      unique: true,
    },
    loan_type: {
      type: String,
      required: true,
      enum: [
        "Personal",
        "Mortgage",
        "Gold",
        "Business",
        "Vehicle",
        "Education",
        "Agriculture",
        "Pigmi",
        "Pigmi Gold",
        "House",
        "Other",
      ],
    },
    application_date: {
      type: Date,
      default: Date.now,
    },
    disbursed_date: {
      type: Date,
      default: Date.now,
    },
    branch_location: {
      type: String,
      default: "001-HO MAIN BRANCH",
    },
    member_id: {
      type: String,
      required: true,
    },
    member_name: {
      type: String,
      required: true,
    },
    guarantor_name: {
      type: String,
      default: null,
    },
    guarantor_contact: {
      type: String,
      default: null,
    },
    sanctioned_amount: {
      type: Number,
      required: true,
      default: 0,
    },
    interest_rate: {
      type: Number,
      required: true,
      default: 12.0,
    },
    tenure_months: {
      type: Number,
      required: true,
      default: 12,
    },
    emi_amount: {
      type: Number,
      default: 0,
    },
    repayment_frequency: {
      type: String,
      default: "Monthly",
      enum: ["Monthly", "Quarterly", "Yearly"],
    },
    processing_fee: {
      type: Number,
      default: 0,
    },
    outstanding_balance: {
      type: Number,
      default: 0,
    },
    disbursement_mode: {
      type: String,
      default: "Direct SB Credit",
    },
    credit_account_no: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "closed", "pending", "overdue"],
    },
    remarks: {
      type: String,
      default: null,
    },

    // Collateral fields
    gold_weight: {
      type: Number,
      default: null,
    },
    gold_purity: {
      type: String,
      default: null,
    },
    gold_valuation: {
      type: Number,
      default: null,
    },
    gold_packet_no: {
      type: String,
      default: null,
    },
    property_survey_no: {
      type: String,
      default: null,
    },
    property_valuation: {
      type: Number,
      default: null,
    },
    property_address: {
      type: String,
      default: null,
    },
    business_name: {
      type: String,
      default: null,
    },
    business_gstin: {
      type: String,
      default: null,
    },
    annual_turnover: {
      type: Number,
      default: null,
    },
    vehicle_reg_no: {
      type: String,
      default: null,
    },
    vehicle_model: {
      type: String,
      default: null,
    },
    education_institute: {
      type: String,
      default: null,
    },
    education_course: {
      type: String,
      default: null,
    },
    agri_land_details: {
      type: String,
      default: null,
    },
    agri_crop_type: {
      type: String,
      default: null,
    },
    purpose_of_loan: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, collection: "loans_tbl" }
);

const LoanModel = mongoose.model("loans_tbl", loanSchema);
module.exports = LoanModel;
