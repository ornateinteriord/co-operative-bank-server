const mongoose = require("mongoose");

const standingInstructionSchema = mongoose.Schema(
  {
    si_id: {
      type: String,
      required: true,
      unique: true,
    },
    processing_date: {
      type: Date,
      default: Date.now,
    },
    time: {
      type: String,
      default: null,
    },
    section_id: {
      type: String,
      default: "01-BANKING SECTION",
    },
    tran_date: {
      type: Date,
      default: Date.now,
    },
    dr_account: {
      type: String,
      required: true,
    },
    cr_account: {
      type: String,
      required: true,
    },
    user: {
      type: String,
      default: "ADMIN_USER",
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    frequency: {
      type: String,
      default: "Monthly",
      enum: ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"],
    },
    start_date: {
      type: Date,
      default: Date.now,
    },
    end_date: {
      type: Date,
      default: null,
    },
    narration: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "paused", "completed", "cancelled"],
    },
  },
  { timestamps: true, collection: "standing_instructions_tbl" }
);

const StandingInstructionModel = mongoose.model("standing_instructions_tbl", standingInstructionSchema);
module.exports = StandingInstructionModel;
