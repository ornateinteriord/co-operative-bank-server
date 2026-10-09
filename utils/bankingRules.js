/**
 * bankingRules.js
 * 
 * Central banking business rules for Nidhi bank operations.
 * All validation helpers and rule constants are here.
 */

const AccountsModel = require("../models/accounts.model");
const AccountGroupModel = require("../models/accountGroup.model");
const TransactionModel = require("../models/transaction.model");

// ─────────────────────────────────────────────────────────────────────────────
// MINIMUM BALANCE RULES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Minimum balance requirements by account type (in ₹)
 * Nidhi company standard rules.
 */
const MIN_BALANCE = {
    SAVING: 500,    // SB accounts must maintain ₹500
    CURRENT: 1000,  // CA accounts must maintain ₹1000
    DEFAULT: 0,     // Other accounts (RD/FD) — not applicable for withdrawals
};

/**
 * Returns minimum balance required for the given account group name.
 */
const getMinimumBalance = (groupName = "") => {
    const name = groupName.toUpperCase();
    if (name.includes("SAVING") || name === "SB") return MIN_BALANCE.SAVING;
    if (name.includes("CURRENT") || name === "CA") return MIN_BALANCE.CURRENT;
    return MIN_BALANCE.DEFAULT;
};

// ─────────────────────────────────────────────────────────────────────────────
// PREMATURE CLOSURE PENALTY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate premature closure penalty for FD/RD accounts.
 * 
 * Standard Nidhi rule:
 *   - If closing before 50% of tenure: interest rate reduced by 2% p.a.
 *   - If closing after 50% of tenure: interest rate reduced by 1% p.a.
 * 
 * Returns: { penaltyAmount, revisedInterestRate, interestEarned, netAmount }
 */
const calculatePrematureClosurePenalty = (account) => {
    const { account_amount, interest_rate, date_of_opening, date_of_maturity, duration } = account;

    if (!date_of_opening || !date_of_maturity || !interest_rate || interest_rate <= 0) {
        return { penaltyAmount: 0, revisedInterestRate: 0, interestEarned: 0, netAmount: account_amount };
    }

    const openDate = new Date(date_of_opening);
    const maturityDate = new Date(date_of_maturity);
    const today = new Date();

    // Total tenure in months
    const totalTenureMonths = duration ||
        Math.round((maturityDate - openDate) / (1000 * 60 * 60 * 24 * 30.44));

    // Months already elapsed
    const elapsedMonths = Math.max(
        0,
        Math.floor((today - openDate) / (1000 * 60 * 60 * 24 * 30.44))
    );

    // Penalty rate based on how early the closure is
    const tenureCompleted = totalTenureMonths > 0 ? elapsedMonths / totalTenureMonths : 0;
    const penaltyRateReduction = tenureCompleted < 0.5 ? 2 : 1; // % p.a. reduction

    const revisedInterestRate = Math.max(0, interest_rate - penaltyRateReduction);

    // Simple interest on elapsed months at revised rate
    const interestEarned = Math.round(
        (account_amount * revisedInterestRate * elapsedMonths) / (100 * 12) * 100
    ) / 100;

    // Penalty = interest that would have been earned minus revised interest
    const fullInterest = Math.round(
        (account_amount * interest_rate * elapsedMonths) / (100 * 12) * 100
    ) / 100;

    const penaltyAmount = Math.round((fullInterest - interestEarned) * 100) / 100;

    const netAmount = account_amount + interestEarned;

    return {
        penaltyAmount,
        revisedInterestRate,
        interestEarned,
        netAmount,
        elapsedMonths,
        totalTenureMonths,
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATE WITHDRAWAL
//   Check: minimum balance, dormant status, loan account restriction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a cash withdrawal from a bank account.
 * Returns { valid: true } or { valid: false, message: "..." }
 */
const validateWithdrawal = async (account, withdrawAmount) => {
    if (!account) return { valid: false, message: "Account not found" };

    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) return { valid: false, message: "Withdrawal amount must be greater than zero" };

    // Account must be active
    if (account.status !== "active") {
        return {
            valid: false,
            message: `Account is ${account.status}. Withdrawals are only allowed from active accounts.`
        };
    }

    // Dormant account restriction
    if (account.is_dormant) {
        return {
            valid: false,
            message: "This account is marked dormant. Please visit the branch to reactivate it before making withdrawals."
        };
    }

    // Get account group
    const accountGroup = await AccountGroupModel.findOne({ account_group_id: account.account_type });
    const groupName = ((accountGroup && accountGroup.account_group_name) || "").toUpperCase();

    // Loan account restriction
    const { isLoanAccount } = require("./primaryAccountHelper");
    if (isLoanAccount(account, accountGroup)) {
        return {
            valid: false,
            message: "Withdrawals cannot be processed from a loan account. Only operating accounts (SB/CA) allow cash withdrawals."
        };
    }

    // FD/RD — no direct cash withdrawal (must go through premature closure process)
    if (isFdGroup(groupName) || isRdGroup(groupName)) {
        return {
            valid: false,
            message: "Fixed Deposit (FD) and Recurring Deposit (RD) accounts do not allow direct cash withdrawals. Please use the premature closure process."
        };
    }

    // Check minimum balance after withdrawal
    const minBalance = getMinimumBalance(groupName);
    const balanceAfter = account.account_amount - amount;

    if (balanceAfter < minBalance) {
        return {
            valid: false,
            message: `Insufficient balance. Minimum balance of ₹${minBalance} must be maintained in ${groupName} accounts. Available for withdrawal: ₹${Math.max(0, account.account_amount - minBalance).toFixed(2)}`
        };
    }

    return { valid: true, groupName, minBalance };
};

const isFdGroup = (name) => name.includes("FIXED") || name === "FD";
const isRdGroup = (name) => name.includes("RECURRING") || name === "RD";

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE LAST TRANSACTION DATE
//   Call after every successful transaction to keep dormant tracking current.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates last_transaction_date and un-dormants the account if it was dormant.
 */
const touchAccountActivity = async (accountNo) => {
    if (!accountNo) return;
    try {
        const account = await AccountsModel.findOne({ account_no: accountNo });
        if (!account) return;

        const updates = { last_transaction_date: new Date() };

        // If dormant, revive it automatically on new transaction
        if (account.is_dormant || account.status === "dormant") {
            updates.is_dormant = false;
            updates.status = "active";
            updates.dormant_since = null;
            console.log(`✅ [Banking] Account ${accountNo} revived from dormant status on new activity`);
        }

        await AccountsModel.findByIdAndUpdate(account._id, updates);
    } catch (err) {
        console.error(`❌ [Banking] Error touching activity for ${accountNo}:`, err.message);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// RD INSTALLMENT CREDIT
//   Call when a collection/deposit is made to an RD account.
//   Updates rd_paid_installments, rd_last_installment_date.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Records an RD installment payment. Called by agent collection and cash deposit.
 */
const recordRDInstallment = async (account, amount) => {
    if (!account) return;
    try {
        const accountGroup = await AccountGroupModel.findOne({ account_group_id: account.account_type });
        const groupName = ((accountGroup && accountGroup.account_group_name) || "").toUpperCase();

        if (!isRdGroup(groupName)) return; // Only for RD accounts

        const today = new Date();
        await AccountsModel.findByIdAndUpdate(account._id, {
            $inc: { rd_paid_installments: 1 },
            rd_last_installment_date: today,
            last_transaction_date: today,
        });

        console.log(`📅 [RD] Installment recorded for ${account.account_no}. Amount: ₹${amount}`);
    } catch (err) {
        console.error(`❌ [Banking] Error recording RD installment for ${account.account_no}:`, err.message);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// NUMBER TO WORDS (INDIAN RUPEES SYSTEM)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a numeric amount to Indian Currency words (Rupees ... Only)
 */
const numberToWords = (num) => {
    if (num === null || num === undefined || isNaN(num)) return "";
    const n = Math.floor(Math.abs(Number(num)));
    if (n === 0) return "Rupees Zero Only";

    const a = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    ];
    const b = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    const convertChunk = (val) => {
        let str = "";
        let rem = val;
        if (rem >= 100) {
            str += a[Math.floor(rem / 100)] + " Hundred ";
            rem %= 100;
        }
        if (rem >= 20) {
            str += b[Math.floor(rem / 10)] + " ";
            rem %= 10;
        }
        if (rem > 0) {
            str += a[rem] + " ";
        }
        return str.trim();
    };

    let result = "";
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const hundred = n % 1000;

    if (crore > 0) result += convertChunk(crore) + " Crore ";
    if (lakh > 0) result += convertChunk(lakh) + " Lakh ";
    if (thousand > 0) result += convertChunk(thousand) + " Thousand ";
    if (hundred > 0) result += convertChunk(hundred) + " ";

    const paise = Math.round((Math.abs(Number(num)) - n) * 100);
    let paiseStr = "";
    if (paise > 0) {
        paiseStr = ` and ${convertChunk(paise)} Paise`;
    }

    return `Rupees ${result.trim()}${paiseStr} Only`;
};

module.exports = {
    MIN_BALANCE,
    getMinimumBalance,
    calculatePrematureClosurePenalty,
    validateWithdrawal,
    touchAccountActivity,
    recordRDInstallment,
    isFdGroup,
    isRdGroup,
    numberToWords,
};

