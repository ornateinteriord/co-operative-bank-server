/**
 * certificateController.js
 * 
 * Provides official banking certificates:
 * 1. Fixed Deposit Receipt (FDR) / RD Certificate
 * 2. Loan Clearance / No Objection Certificate (NOC)
 */

const AccountsModel = require("../../../models/accounts.model");
const MemberModel = require("../../../models/member.model");
const AccountGroupModel = require("../../../models/accountGroup.model");
const BranchModel = require("../../../models/branch.model");
const TransactionModel = require("../../../models/transaction.model");
const { numberToWords, isFdGroup, isRdGroup } = require("../../../utils/bankingRules");
const { isLoanAccount } = require("../../../utils/primaryAccountHelper");

/**
 * Generate / Retrieve Fixed Deposit or Recurring Deposit Certificate
 */
const getDepositCertificate = async (req, res) => {
    try {
        const accountId = req.params.accountId || req.query.accountId || req.query.account_id;
        if (!accountId) {
            return res.status(400).json({ success: false, message: "Account ID or Account Number is required" });
        }

        const account = await AccountsModel.findOne({
            $or: [{ account_id: accountId }, { account_no: accountId }]
        });

        if (!account) {
            return res.status(404).json({ success: false, message: "Deposit account not found" });
        }

        const accountGroup = await AccountGroupModel.findOne({ account_group_id: account.account_type });
        const groupName = ((accountGroup && accountGroup.account_group_name) || "").toUpperCase();

        const isFD = isFdGroup(groupName);
        const isRD = isRdGroup(groupName);

        if (!isFD && !isRD) {
            return res.status(400).json({
                success: false,
                message: "Deposit Certificate is only applicable for Fixed Deposit (FD) and Recurring Deposit (RD) accounts."
            });
        }

        // Fetch Member details
        const member = await MemberModel.findOne({
            $or: [
                { member_id: account.member_id },
                { Member_id: account.member_id },
                { member_id: String(account.member_id) },
                { Member_id: String(account.member_id) }
            ]
        });

        // Fetch Branch details
        let branch = null;
        if (account.branch_id) {
            branch = await BranchModel.findOne({
                $or: [{ branch_id: account.branch_id }, { _id: account.branch_id }]
            });
        }

        const principalAmount = account.account_amount || 0;
        const durationMonths = account.duration || 12;
        const interestRate = account.interest_rate || 0;

        // Calculate maturity amount
        let maturityAmount = account.net_amount || 0;
        let interestAmount = account.interest_amount || 0;

        if (!maturityAmount || maturityAmount <= 0) {
            if (isFD) {
                // FD Simple Interest: I = (P * R * T) / (100 * 12)
                interestAmount = Math.round((principalAmount * interestRate * durationMonths) / (100 * 12) * 100) / 100;
                maturityAmount = principalAmount + interestAmount;
            } else if (isRD) {
                // RD installment: total principal = monthly installment * duration
                const monthlyInstallment = account.rd_installment_amount || principalAmount;
                const totalDeposit = monthlyInstallment * durationMonths;
                // RD Simple Interest approximation
                interestAmount = Math.round((monthlyInstallment * durationMonths * (durationMonths + 1) * interestRate) / (2 * 100 * 12) * 100) / 100;
                maturityAmount = totalDeposit + interestAmount;
            }
        }

        const certType = isFD ? "FIXED DEPOSIT RECEIPT (FDR)" : "RECURRING DEPOSIT CERTIFICATE (RDC)";
        const certPrefix = isFD ? "FDR" : "RDC";
        const certificateNo = `${certPrefix}-${account.account_no}`;

        const certificateData = {
            certificate_no: certificateNo,
            certificate_type: certType,
            issue_date: account.date_of_opening || new Date(),
            bank_name: "UDUPI CO-OPERATIVE BANK LTD",
            registration_no: "NIDHI-REG-0897/2020",
            branch: {
                branch_name: (branch && branch.branch_name) || "Head Office / Main Branch",
                branch_code: (branch && branch.branch_id) || account.branch_id || "BR001",
                address: (branch && branch.address) || "Udupi, Karnataka, India",
            },
            depositor: {
                member_id: account.member_id,
                name: (member && member.name) || (member && member.Name) || "Valued Member",
                relative_name: (member && member.father_husband_name) || (member && member.relative_name) || "",
                address: (member && member.address) || "",
                phone: (member && member.contactno) || (member && member.mobileno) || "",
                pan_no: (member && member.Pan_no) || (member && member.pan_no) || "",
                nominee_name: (member && member.nominee_name) || account.joint_member || "As per Member Record",
                nominee_relation: (member && member.nominee_relation) || "Nominee",
                joint_member: account.joint_member || null,
            },
            account: {
                account_id: account.account_id,
                account_no: account.account_no,
                account_type: groupName,
                scheme_name: accountGroup ? accountGroup.account_group_name : "Deposit Scheme",
                status: account.status,
                principal_amount: principalAmount,
                principal_amount_in_words: numberToWords(principalAmount),
                monthly_installment: isRD ? (account.rd_installment_amount || principalAmount) : null,
                interest_rate: interestRate,
                tenure_months: durationMonths,
                date_of_deposit: account.date_of_opening,
                date_of_maturity: account.date_of_maturity,
                interest_amount: interestAmount,
                maturity_amount: maturityAmount,
                maturity_amount_in_words: numberToWords(maturityAmount),
                is_matured: account.maturity_processed || (account.date_of_maturity && new Date() >= new Date(account.date_of_maturity)),
            },
            terms: [
                "This deposit receipt is governed by the Rules and Bye-laws of the Bank.",
                "Interest is payable as per the agreed scheme and tenure.",
                "Premature encashment is subject to penal interest reduction as per Nidhi / Co-operative rules.",
                "This receipt must be surrendered at the time of maturity or premature withdrawal."
            ]
        };

        return res.status(200).json({
            success: true,
            data: certificateData
        });
    } catch (error) {
        console.error("Error generating deposit certificate:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate deposit certificate",
            error: error.message
        });
    }
};

/**
 * Generate / Retrieve Loan No Objection Certificate (NOC) / Clearance Certificate
 */
const getLoanNOC = async (req, res) => {
    try {
        const accountId = req.params.accountId || req.query.accountId || req.query.account_id;
        if (!accountId) {
            return res.status(400).json({ success: false, message: "Loan Account ID or Number is required" });
        }

        const account = await AccountsModel.findOne({
            $or: [{ account_id: accountId }, { account_no: accountId }]
        });

        if (!account) {
            return res.status(404).json({ success: false, message: "Loan account not found" });
        }

        const accountGroup = await AccountGroupModel.findOne({ account_group_id: account.account_type });
        const groupName = ((accountGroup && accountGroup.account_group_name) || "").toUpperCase();

        if (!isLoanAccount(account, accountGroup)) {
            return res.status(400).json({
                success: false,
                message: "Loan NOC is only applicable for loan accounts."
            });
        }

        // Verify loan is fully settled (balance <= 0 or status === closed)
        const currentBalance = account.account_amount || 0;
        if (currentBalance > 0 && account.status !== "closed") {
            return res.status(400).json({
                success: false,
                message: `Cannot issue NOC: Loan has an outstanding balance of ₹${currentBalance.toFixed(2)}. The loan must be fully repaid before an NOC can be generated.`
            });
        }

        // Fetch Member
        const member = await MemberModel.findOne({
            $or: [
                { member_id: account.member_id },
                { Member_id: account.member_id },
                { member_id: String(account.member_id) },
                { Member_id: String(account.member_id) }
            ]
        });

        // Fetch Branch
        let branch = null;
        if (account.branch_id) {
            branch = await BranchModel.findOne({
                $or: [{ branch_id: account.branch_id }, { _id: account.branch_id }]
            });
        }

        // Fetch total repayments made towards this loan
        const repaymentTransactions = await TransactionModel.find({
            $or: [
                { account_number: account.account_no },
                { reference_no: account.account_id },
            ],
            transaction_type: { $regex: /loan repayment|repayment|credit/i },
            status: "Completed",
        });

        const totalRepaid = repaymentTransactions.reduce((acc, tx) => acc + (tx.credit || tx.debit || 0), 0);
        const nocCertificateNo = `NOC-${account.account_no}`;
        const today = new Date();

        const nocData = {
            certificate_no: nocCertificateNo,
            certificate_title: "NO OBJECTION CERTIFICATE / LOAN CLEARANCE CERTIFICATE",
            issue_date: today,
            bank_name: "UDUPI CO-OPERATIVE BANK LTD",
            registration_no: "NIDHI-REG-0897/2020",
            branch: {
                branch_name: (branch && branch.branch_name) || "Head Office / Main Branch",
                branch_code: (branch && branch.branch_id) || account.branch_id || "BR001",
                address: (branch && branch.address) || "Udupi, Karnataka, India",
            },
            borrower: {
                member_id: account.member_id,
                name: (member && member.name) || (member && member.Name) || "Valued Member",
                relative_name: (member && member.father_husband_name) || (member && member.relative_name) || "",
                address: (member && member.address) || "",
                phone: (member && member.contactno) || (member && member.mobileno) || "",
                pan_no: (member && member.Pan_no) || (member && member.pan_no) || "",
            },
            loan_details: {
                account_id: account.account_id,
                account_no: account.account_no,
                loan_type: groupName,
                sanction_date: account.date_of_opening,
                closure_date: account.date_of_close || today,
                interest_rate: account.interest_rate || 0,
                tenure_months: account.duration || 0,
                outstanding_balance: 0,
                status: "CLOSED / FULLY SETTLED",
            },
            declaration: `This is to certify that Sri/Smt ${(member && member.name) || 'Member'} (Member ID: ${account.member_id}) who availed a ${groupName} under Account Number ${account.account_no} has fully settled the loan along with all accrued interest and applicable charges. There are NO DUES outstanding against this loan account as of ${today.toDateString()}. The Bank holds no further lien, charge, or hypothecation against this account.`
        };

        return res.status(200).json({
            success: true,
            data: nocData
        });
    } catch (error) {
        console.error("Error generating loan NOC:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate loan NOC",
            error: error.message
        });
    }
};

module.exports = {
    getDepositCertificate,
    getLoanNOC,
};
