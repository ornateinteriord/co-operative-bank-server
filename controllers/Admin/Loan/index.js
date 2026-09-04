const mongoose = require("mongoose");
const LoanModel = require("../../../models/loan.model");

// Create Loan
const createLoan = async (req, res) => {
  try {
    const {
      loan_id,
      account_no,
      loan_type,
      application_date,
      disbursed_date,
      branch_location,
      member_id,
      member_name,
      guarantor_name,
      guarantor_contact,
      sanctioned_amount,
      interest_rate,
      tenure_months,
      emi_amount,
      repayment_frequency,
      processing_fee,
      outstanding_balance,
      disbursement_mode,
      credit_account_no,
      status,
      remarks,
      gold_weight,
      gold_purity,
      gold_valuation,
      gold_packet_no,
      property_survey_no,
      property_valuation,
      property_address,
      business_name,
      business_gstin,
      annual_turnover,
      vehicle_reg_no,
      vehicle_model,
      education_institute,
      education_course,
      agri_land_details,
      agri_crop_type,
      purpose_of_loan,
    } = req.body;

    if (!loan_type) {
      return res.status(400).json({
        success: false,
        message: "Loan type is required",
      });
    }

    if (!member_id || !member_name) {
      return res.status(400).json({
        success: false,
        message: "Member ID and Borrower Name are required",
      });
    }

    if (!sanctioned_amount || sanctioned_amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid sanctioned amount is required",
      });
    }

    // Generate account_no and loan_id if not supplied
    let finalAccNo = account_no;
    let finalLoanId = loan_id;
    if (!finalAccNo || !finalLoanId) {
      const prefix =
        loan_type === "Gold" ? "GL" :
        loan_type === "Personal" ? "PL" :
        loan_type === "Mortgage" ? "ML" :
        loan_type === "Business" ? "BL" :
        loan_type === "Vehicle" ? "VL" :
        loan_type === "Education" ? "EL" :
        loan_type === "Agriculture" ? "AL" :
        loan_type === "Pigmi" ? "PGL" :
        loan_type === "Pigmi Gold" ? "PGLD" :
        loan_type === "House" ? "HL" : "OL";

      const lastLoan = await LoanModel.findOne({ loan_type }).sort({ createdAt: -1 });
      let nextId = 1;
      if (lastLoan && lastLoan.account_no) {
        const parsed = parseInt(lastLoan.account_no.replace(/\D/g, ""));
        if (!isNaN(parsed)) nextId = parsed + 1;
      }
      if (!finalAccNo) finalAccNo = `${prefix}-${nextId.toString().padStart(6, "0")}`;
      if (!finalLoanId) finalLoanId = `${prefix}-${Date.now().toString().slice(-6)}`;
    }

    // Check for duplicate account_no
    const existing = await LoanModel.findOne({ account_no: finalAccNo });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Loan Account No ${finalAccNo} already exists`,
      });
    }

    const sAmount = Number(sanctioned_amount);
    const outBalance = outstanding_balance !== undefined ? Number(outstanding_balance) : sAmount;

    const newLoan = await LoanModel.create({
      loan_id: finalLoanId,
      account_no: finalAccNo,
      loan_type,
      application_date: application_date || new Date(),
      disbursed_date: disbursed_date || new Date(),
      branch_location: branch_location || "001-HO MAIN BRANCH",
      member_id,
      member_name,
      guarantor_name,
      guarantor_contact,
      sanctioned_amount: sAmount,
      interest_rate: Number(interest_rate) || 12.0,
      tenure_months: Number(tenure_months) || 12,
      emi_amount: Number(emi_amount) || 0,
      repayment_frequency: repayment_frequency || "Monthly",
      processing_fee: Number(processing_fee) || 0,
      outstanding_balance: outBalance,
      disbursement_mode: disbursement_mode || "Direct SB Credit",
      credit_account_no,
      status: status || "active",
      remarks,
      gold_weight: gold_weight ? Number(gold_weight) : null,
      gold_purity,
      gold_valuation: gold_valuation ? Number(gold_valuation) : null,
      gold_packet_no,
      property_survey_no,
      property_valuation: property_valuation ? Number(property_valuation) : null,
      property_address,
      business_name,
      business_gstin,
      annual_turnover: annual_turnover ? Number(annual_turnover) : null,
      vehicle_reg_no,
      vehicle_model,
      education_institute,
      education_course,
      agri_land_details,
      agri_crop_type,
      purpose_of_loan,
    });

    res.status(201).json({
      success: true,
      message: `${loan_type} loan account created successfully`,
      data: newLoan,
    });
  } catch (error) {
    console.error("Error in createLoan:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create loan account",
    });
  }
};

// Get all Loans (with filtering by loan_type, pagination and search)
const getLoans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const loan_type = req.query.loan_type;
    const status = req.query.status;

    const query = {};
    if (loan_type && loan_type !== "all") query.loan_type = loan_type;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { account_no: { $regex: search, $options: "i" } },
        { loan_id: { $regex: search, $options: "i" } },
        { member_id: { $regex: search, $options: "i" } },
        { member_name: { $regex: search, $options: "i" } },
        { branch_location: { $regex: search, $options: "i" } },
        { guarantor_name: { $regex: search, $options: "i" } },
      ];
    }

    const total = await LoanModel.countDocuments(query);
    const loans = await LoanModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: loans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getLoans:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch loan records",
    });
  }
};

// Get single Loan by ID / Account No
const getLoanById = async (req, res) => {
  try {
    const { loanId } = req.params;
    const loan = await LoanModel.findOne({
      $or: [
        { loan_id: loanId },
        { account_no: loanId },
        { _id: mongoose.Types.ObjectId.isValid(loanId) ? loanId : null },
      ].filter(Boolean),
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: loan,
    });
  } catch (error) {
    console.error("Error in getLoanById:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch loan details",
    });
  }
};

// Update Loan
const updateLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const updated = await LoanModel.findOneAndUpdate(
      {
        $or: [
          { loan_id: loanId },
          { account_no: loanId },
          { _id: mongoose.Types.ObjectId.isValid(loanId) ? loanId : null },
        ].filter(Boolean),
      },
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Loan record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Loan record updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error in updateLoan:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update loan record",
    });
  }
};

// Delete Loan
const deleteLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const deleted = await LoanModel.findOneAndDelete({
      $or: [
        { loan_id: loanId },
        { account_no: loanId },
        { _id: mongoose.Types.ObjectId.isValid(loanId) ? loanId : null },
      ].filter(Boolean),
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Loan record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Loan record deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error in deleteLoan:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete loan record",
    });
  }
};

module.exports = {
  createLoan,
  getLoans,
  getLoanById,
  updateLoan,
  deleteLoan,
};
