const mongoose = require("mongoose");

const accountsSchema = mongoose.Schema(
  {
    account_id: {
      type: String,
      required: true,
    },
    branch_id: {
      type: String,
      default: null,
    },
    date_of_opening: {
      type: Date,
      default: Date.now,
    },
    member_id: {
      type: String,
      default: null,
    },
    account_type: {
      type: String,
      default: null,
    },
    account_no: {
      type: String,
      default: null,
    },
    account_operation: {
      type: String,
      default: null,
    },
    introducer: {
      type: String,
      default: null,
    },
    entered_by: {
      type: String,
      default: null,
    },
    ref_id: {
      type: String,
      default: null,
    },
    interest_rate: {
      type: Number,
      default: null,
    },
    duration: {
      type: Number,
      default: null,
    },
    date_of_maturity: {
      type: Date,
      default: null,
    },
    date_of_close: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      default: "pending",
    },
    assigned_to: {
      type: String,
      default: null,
    },
    account_amount: {
      type: Number,
      default: 0,
    },
    joint_member: {
      type: String,
      default: null,
    },
    interest_amount: {
      type: Number,
      default: null,
    },
    net_amount: {
      type: Number,
      default: null,
    },
    maturity_processed: {
      type: Boolean,
      default: false,
    },
    last_printed_line: {
      type: Number,
      default: 0,
    },
    last_printed_date: {
      type: Date,
      default: null,
    },
    passbook_notes: {
      type: String,
      default: "",
    },
    is_primary: {
      type: Boolean,
      default: false,
    },
    loan_disbursed_to: {
      type: String,
      default: null, // Account number where sanctioned loan amount was transferred
    },
    disbursed_at: {
      type: Date,
      default: null,
    },
    // ── Dormant Account Tracking ──────────────────────────────────────
    last_transaction_date: {
      type: Date,
      default: null, // Tracks the date of last credit/debit on this account
    },
    is_dormant: {
      type: Boolean,
      default: false, // Set to true if account has had no transactions for 12+ months
    },
    dormant_since: {
      type: Date,
      default: null,
    },
    // ── Overdue Loan Tracking ─────────────────────────────────────────
    is_overdue: {
      type: Boolean,
      default: false, // Set to true when loan passes its maturity/due date unpaid
    },
    overdue_since: {
      type: Date,
      default: null,
    },
    penal_interest_accrued: {
      type: Number,
      default: 0, // Total penal interest accumulated on overdue loans
    },
    penal_interest_rate: {
      type: Number,
      default: 2, // % per annum additional penal interest on overdue loans (above normal rate)
    },
    // ── RD (Recurring Deposit) Installment Tracking ───────────────────
    rd_installment_amount: {
      type: Number,
      default: null, // Fixed monthly installment for RD accounts
    },
    rd_total_installments: {
      type: Number,
      default: null, // Total number of installments (duration in months)
    },
    rd_paid_installments: {
      type: Number,
      default: 0, // Number of installments paid so far
    },
    rd_missed_installments: {
      type: Number,
      default: 0, // Number of installments missed
    },
    rd_last_installment_date: {
      type: Date,
      default: null,
    },
    rd_penalty_accrued: {
      type: Number,
      default: 0, // Total penalty for missed RD installments (₹5 per missed installment per month typically)
    },
    // ── Premature Closure ─────────────────────────────────────────────
    premature_closure_penalty: {
      type: Number,
      default: null, // Penalty amount deducted on early closure of FD/RD
    },
    premature_closure_applied: {
      type: Boolean,
      default: false,
    },
    // ── Savings Interest Tracking ─────────────────────────────────────
    sb_interest_last_credited: {
      type: Date,
      default: null, // Last date quarterly SB interest was credited
    },
    sb_interest_accrued: {
      type: Number,
      default: 0, // Interest accrued but not yet credited (running total)
    },
  },
  { timestamps: true, collection: "accounts_tbl" }
);

const AccountsModel = mongoose.model("accounts_tbl", accountsSchema);
module.exports = AccountsModel;
