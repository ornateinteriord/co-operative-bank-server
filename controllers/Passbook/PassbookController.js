const mongoose = require("mongoose");
const AccountsModel = require("../../models/accounts.model");
const MemberModel = require("../../models/member.model");
const BranchModel = require("../../models/branch.model");
const TransactionModel = require("../../models/transaction.model");
const AccountGroupModel = require("../../models/accountGroup.model");

// Format date helper
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Check if account is a loan
const isLoanAccount = (account) => {
  if (!account) return false;
  const accId = (account.account_id || "").toUpperCase();
  const accType = (account.account_type || "").toUpperCase();
  return (
    accId.startsWith("LOAN") ||
    accType.includes("LOAN") ||
    accType.includes("OVERDRAFT") ||
    accType.includes("ADVANCE")
  );
};

/**
 * Get comprehensive passbook details for an account
 */
const getPassbookDetails = async (req, res) => {
  try {
    const { accountId } = req.params;
    const user = req.user;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Account ID or Account Number is required",
      });
    }

    // Find account by _id, account_id, or account_no
    const query = {
      $or: [
        mongoose.Types.ObjectId.isValid(accountId) ? { _id: accountId } : null,
        { account_id: accountId },
        { account_no: accountId },
      ].filter(Boolean),
    };

    const account = await AccountsModel.findOne(query);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: `Account not found for identifier: ${accountId}`,
      });
    }

    // Security check: if USER role, ensure they only view their own account
    if (user && user.role === "USER" && account.member_id !== user.memberId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only view your own passbook",
      });
    }

    // Fetch Member Details
    const member = await MemberModel.findOne({ member_id: account.member_id });

    // Fetch Account Group friendly name
    let accountTypeName = account.account_type || "Savings Account";
    if (account.account_type) {
      const group = await AccountGroupModel.findOne({
        account_group_id: account.account_type,
      });
      if (group && group.account_group_name) {
        accountTypeName = group.account_group_name;
      }
    }

    // Fetch Branch Details
    let branch = null;
    if (account.branch_id) {
      branch = await BranchModel.findOne({ branch_id: account.branch_id });
    }
    if (!branch) {
      branch = await BranchModel.findOne({ status: "active" });
    }

    const branchInfo = {
      branch_id: branch ? branch.branch_id : "BR001",
      branch_name: branch ? branch.branch_name : "UDUPI MAIN BRANCH",
      address: branch
        ? [branch.door_no, branch.address1, branch.address2, branch.city, branch.state, branch.pincode]
            .filter(Boolean)
            .join(", ")
        : "Asha Chandra Trade Center, Opposite Court Road, Udupi, Karnataka - 576101",
      city: branch ? branch.city || "Udupi" : "Udupi",
      state: branch ? branch.state || "Karnataka" : "Karnataka",
      pincode: branch ? branch.pincode || 576101 : 576101,
      phone: branch ? branch.phone_number || branch.mobile_no || "+91 8394232300" : "+91 8394232300",
      email: branch ? branch.email || "bmskspost@gmail.com" : "bmskspost@gmail.com",
      ifsc_code: "BMSB0001001",
      micr_code: "576800002",
      branch_prefix: branch ? branch.branch_prefix || "UDU" : "UDU",
    };

    const bankInfo = {
      bank_name: "UDUPI CO-OPERATIVE BANK",
      legal_entity: "BMS FINANCE AND FOUNDATION (CO-OPERATIVE BANKING)",
      cin: "U64990KA2025PTC212899",
      reg_no: "U85300DL2022NPL407403/ROC",
      head_office: "Asha Chandra Trade Center, Opposite Court Road, Udupi, Karnataka - 576101",
      phone: "+91 8394232300",
      email: "bmskspost@gmail.com",
      website: "https://bmsfoundation.biz",
    };

    const isLoan = isLoanAccount(account);

    // Fetch transactions related to this account or member
    const txQuery = {
      $or: [
        { account_number: account.account_no },
        { account_number: account.account_id },
        {
          member_id: account.member_id,
          account_type: account.account_type,
        },
      ].filter(Boolean),
      status: { $ne: "Failed" },
    };

    // If it's a loan, also include loan repayments for this member
    if (isLoan) {
      txQuery.$or.push(
        {
          member_id: account.member_id,
          is_loan_repayment: true,
        },
        {
          member_id: account.member_id,
          transaction_type: { $regex: /loan|repay/i },
        }
      );
    }

    const rawTransactions = await TransactionModel.find(txQuery).sort({
      transaction_date: 1,
      createdAt: 1,
    });

    // Assemble passbook transaction lines with proper running balance
    const lines = [];
    let runningBalance = 0;
    const openingAmount = Number(account.account_amount) || 0;
    const openingDate = account.date_of_opening || account.createdAt || new Date();

    // Check if raw transactions already include an opening transaction
    const hasInitialTx = rawTransactions.some((tx) => {
      const desc = (tx.description || "").toUpperCase();
      const type = (tx.transaction_type || "").toUpperCase();
      return (
        desc.includes("OPENING") ||
        desc.includes("SANCTION") ||
        type.includes("SANCTION")
      );
    });

    // If no initial entry is in DB, add an official opening line
    if (!hasInitialTx) {
      if (isLoan) {
        // Loan Sanction & Disbursement
        runningBalance = openingAmount;
        lines.push({
          line_number: 1,
          date: formatDate(openingDate),
          raw_date: openingDate,
          particulars: `TO LOAN SANCTION & DISBURSEMENT - ${accountTypeName.toUpperCase()}`,
          reference_no: account.account_no || account.account_id,
          debit: openingAmount,
          credit: 0,
          balance: runningBalance,
          initials: `${branchInfo.branch_prefix}/ADM`,
          type: "SANCTION",
          is_printed: (account.last_printed_line || 0) >= 1,
        });
      } else {
        // Savings / Deposit Opening Balance
        runningBalance = openingAmount;
        lines.push({
          line_number: 1,
          date: formatDate(openingDate),
          raw_date: openingDate,
          particulars: "BY OPENING BALANCE - CASH DEPOSIT",
          reference_no: account.account_no || account.account_id,
          debit: 0,
          credit: openingAmount,
          balance: runningBalance,
          initials: `${branchInfo.branch_prefix}/SYS`,
          type: "OPENING",
          is_printed: (account.last_printed_line || 0) >= 1,
        });
      }
    }

    // Process all subsequent transactions
    rawTransactions.forEach((tx) => {
      const credit = Number(tx.credit) || Number(tx.ew_credit) || 0;
      const debit = Number(tx.debit) || Number(tx.ew_debit) || 0;
      const txDate = tx.transaction_date || tx.createdAt || new Date();

      if (credit === 0 && debit === 0) return;

      // Update running balance
      if (isLoan) {
        // For a loan: debit increases loan debt, credit (repayment) reduces loan debt
        runningBalance = runningBalance + debit - credit;
      } else {
        // For savings/deposit: credit increases balance, debit reduces balance
        runningBalance = runningBalance + credit - debit;
      }

      // Format description in classic bank passbook uppercase notation
      let desc = tx.description || tx.transaction_type || "BANK TRANSACTION";
      desc = desc.toUpperCase();
      if (!desc.startsWith("BY ") && !desc.startsWith("TO ")) {
        desc = credit > 0 ? `BY ${desc}` : `TO ${desc}`;
      }

      const nextLineNum = lines.length + 1;

      lines.push({
        line_number: nextLineNum,
        transaction_id: tx.transaction_id,
        date: formatDate(txDate),
        raw_date: txDate,
        particulars: desc,
        reference_no: tx.reference_no || tx.transaction_id || "-",
        debit: debit,
        credit: credit,
        balance: Math.max(0, runningBalance),
        initials: `${branchInfo.branch_prefix}/${(tx.collected_by || tx.paid_by || "OFF").substring(0, 3).toUpperCase()}`,
        type: tx.transaction_type,
        is_printed: (account.last_printed_line || 0) >= nextLineNum,
      });
    });

    // Partition into passbook pages (16 transactions per ledger page)
    const LINES_PER_PAGE = 16;
    const pages = [];
    const totalTxPages = Math.max(1, Math.ceil(lines.length / LINES_PER_PAGE));

    for (let p = 0; p < totalTxPages; p++) {
      const pageLines = lines.slice(p * LINES_PER_PAGE, (p + 1) * LINES_PER_PAGE);
      
      // Calculate Brought Forward (B/F) if not first page
      const prevLines = lines.slice(0, p * LINES_PER_PAGE);
      const bfBalance = prevLines.length > 0 ? prevLines[prevLines.length - 1].balance : 0;
      
      // Calculate Carried Forward (C/F)
      const cfBalance = pageLines.length > 0 ? pageLines[pageLines.length - 1].balance : bfBalance;

      pages.push({
        page_number: p + 1,
        total_pages: totalTxPages,
        brought_forward: p > 0 ? bfBalance : null,
        carried_forward: cfBalance,
        lines: pageLines,
      });
    }

    const currentBalance = lines.length > 0 ? lines[lines.length - 1].balance : openingAmount;

    // Total statistics
    const totalCredit = lines.reduce((acc, curr) => acc + curr.credit, 0);
    const totalDebit = lines.reduce((acc, curr) => acc + curr.debit, 0);

    const passbookData = {
      account: {
        account_id: account.account_id,
        account_no: account.account_no || account.account_id,
        account_type: account.account_type,
        account_type_name: accountTypeName,
        is_loan: isLoan,
        date_of_opening: formatDate(account.date_of_opening),
        raw_opening_date: account.date_of_opening,
        date_of_maturity: formatDate(account.date_of_maturity),
        interest_rate: account.interest_rate || 0,
        duration: account.duration || 0,
        status: account.status || "active",
        mode_of_operation: account.account_operation || "Self",
        introducer: account.introducer || "N/A",
        joint_member: account.joint_member || "N/A",
        current_balance: currentBalance,
        last_printed_line: account.last_printed_line || 0,
        last_printed_date: account.last_printed_date ? formatDate(account.last_printed_date) : null,
        passbook_notes: account.passbook_notes || "",
      },
      member: {
        member_id: member ? member.member_id || member.Member_id : account.member_id,
        name: member ? member.name || member.Name : "N/A",
        contact_no: member ? member.contactno || member.mobileno : "N/A",
        email: member ? member.emailid || member.email : "N/A",
        address: member ? member.address : "Udupi, Karnataka",
        dob: member && member.dob ? formatDate(member.dob) : "N/A",
        gender: member ? member.gender : "N/A",
        pan_no: member ? member.Pan_no || member.pan_no || "N/A" : "N/A",
        aadhaar_no: member ? member.aadhaar_no || member.aadhaarno || "N/A" : "N/A",
        father_or_husband: member ? member.father_or_husband_name || member.fatherName || "N/A" : "N/A",
        nominee_name: member ? member.nominee_name || "N/A" : "N/A",
        nominee_relation: member ? member.nominee_relation || "N/A" : "N/A",
        profile_image: member ? member.profile_image || member.passbookImage : null,
      },
      branch: branchInfo,
      bank: bankInfo,
      summary: {
        total_credit: totalCredit,
        total_debit: totalDebit,
        current_balance: currentBalance,
        total_transactions: lines.length,
        total_pages: totalTxPages,
        unprinted_lines_count: Math.max(0, lines.length - (account.last_printed_line || 0)),
      },
      pages: pages,
      all_lines: lines,
    };

    return res.status(200).json({
      success: true,
      message: "Passbook details generated successfully",
      data: passbookData,
    });
  } catch (error) {
    console.error("Error generating passbook details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate passbook details",
      error: error.message,
    });
  }
};

/**
 * Get all accounts & loans for the authenticated user
 */
const getUserAccountsForPassbook = async (req, res) => {
  try {
    const memberId = req.user.memberId;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID not found in session",
      });
    }

    const accounts = await AccountsModel.find({
      member_id: memberId,
      status: { $ne: "deleted" },
    }).sort({ createdAt: -1 });

    const groups = await AccountGroupModel.find({});
    const groupMap = {};
    groups.forEach((g) => {
      groupMap[g.account_group_id] = g.account_group_name;
    });

    const enrichedAccounts = accounts.map((acc) => {
      const isLoan = isLoanAccount(acc);
      const groupName = groupMap[acc.account_type] || acc.account_type || (isLoan ? "Loan" : "Savings");
      return {
        _id: acc._id,
        account_id: acc.account_id,
        account_no: acc.account_no || acc.account_id,
        account_type: acc.account_type,
        account_type_name: groupName,
        is_loan: isLoan,
        date_of_opening: formatDate(acc.date_of_opening),
        balance: acc.account_amount || 0,
        status: acc.status,
        last_printed_line: acc.last_printed_line || 0,
      };
    });

    return res.status(200).json({
      success: true,
      message: "User accounts retrieved successfully",
      data: enrichedAccounts,
    });
  } catch (error) {
    console.error("Error fetching user passbook accounts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch accounts",
      error: error.message,
    });
  }
};

/**
 * Search accounts for admin passbook printing/viewing
 */
const searchAccountsForPassbook = async (req, res) => {
  try {
    const { query = "", account_type = "", page = 1, limit = 20 } = req.query;

    const filter = {
      status: { $ne: "deleted" },
    };

    if (account_type && account_type !== "all") {
      filter.account_type = account_type;
    }

    if (query.trim()) {
      filter.$or = [
        { account_id: { $regex: query.trim(), $options: "i" } },
        { account_no: { $regex: query.trim(), $options: "i" } },
        { member_id: { $regex: query.trim(), $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [accounts, totalCount] = await Promise.all([
      AccountsModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      AccountsModel.countDocuments(filter),
    ]);

    const groups = await AccountGroupModel.find({});
    const groupMap = {};
    groups.forEach((g) => {
      groupMap[g.account_group_id] = g.account_group_name;
    });

    // Enrich with member names
    const enrichedAccounts = await Promise.all(
      accounts.map(async (acc) => {
        const member = await MemberModel.findOne(
          { member_id: acc.member_id },
          { name: 1, contactno: 1, emailid: 1, address: 1, _id: 0 }
        );
        const isLoan = isLoanAccount(acc);
        const groupName = groupMap[acc.account_type] || acc.account_type || (isLoan ? "Loan" : "Savings");

        return {
          _id: acc._id,
          account_id: acc.account_id,
          account_no: acc.account_no || acc.account_id,
          account_type: acc.account_type,
          account_type_name: groupName,
          is_loan: isLoan,
          member_id: acc.member_id,
          member_name: member ? member.name : "N/A",
          member_phone: member ? member.contactno : "N/A",
          member_email: member ? member.emailid : "N/A",
          balance: acc.account_amount || 0,
          date_of_opening: formatDate(acc.date_of_opening),
          status: acc.status,
          last_printed_line: acc.last_printed_line || 0,
          last_printed_date: acc.last_printed_date ? formatDate(acc.last_printed_date) : null,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Accounts fetched successfully",
      data: {
        accounts: enrichedAccounts,
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error searching accounts for passbook:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search accounts",
      error: error.message,
    });
  }
};

/**
 * Update passbook printing progress (Mark as printed)
 */
const updatePassbookPrintStatus = async (req, res) => {
  try {
    const { account_id, last_printed_line, passbook_notes } = req.body;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        message: "Account ID is required",
      });
    }

    const query = {
      $or: [
        mongoose.Types.ObjectId.isValid(account_id) ? { _id: account_id } : null,
        { account_id: account_id },
        { account_no: account_id },
      ].filter(Boolean),
    };

    const updateData = {
      last_printed_line: Number(last_printed_line) || 0,
      last_printed_date: new Date(),
    };

    if (passbook_notes !== undefined) {
      updateData.passbook_notes = passbook_notes;
    }

    const updatedAccount = await AccountsModel.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    );

    if (!updatedAccount) {
      return res.status(404).json({
        success: false,
        message: "Account not found to update passbook status",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Passbook marked as printed up to line ${updateData.last_printed_line}`,
      data: {
        account_id: updatedAccount.account_id,
        last_printed_line: updatedAccount.last_printed_line,
        last_printed_date: formatDate(updatedAccount.last_printed_date),
        passbook_notes: updatedAccount.passbook_notes,
      },
    });
  } catch (error) {
    console.error("Error updating passbook print status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update passbook print status",
      error: error.message,
    });
  }
};

module.exports = {
  getPassbookDetails,
  getUserAccountsForPassbook,
  searchAccountsForPassbook,
  updatePassbookPrintStatus,
};
