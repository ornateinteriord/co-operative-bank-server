const AccountsModel = require("../models/accounts.model");
const MemberModel = require("../models/member.model");
const AccountGroupModel = require("../models/accountGroup.model");
const TransactionModel = require("../models/transaction.model");
const generateTransactionId = require("./generateTransactionId");

/**
 * Checks whether an account or account group is a loan facility.
 * Loan accounts cannot be primary operating accounts.
 */
const isLoanAccount = (account = {}, accountGroup = null) => {
    const accNo = (account.account_no || "").toUpperCase();
    const accId = (account.account_id || "").toUpperCase();
    const groupName = ((accountGroup && accountGroup.account_group_name) || account.account_group_name || "").toUpperCase();
    const bookId = ((accountGroup && accountGroup.account_book_id) || "").toUpperCase();

    const isLoanPrefix = /^(PL|ML|GL|BL|VL|EL|AL|PGL|PGLD|OD|LN)/i.test(accNo);
    const isLoanId = accId.startsWith("LOAN");
    const isLoanGroup = groupName.includes("LOAN") || groupName.includes("OVERDRAFT") || bookId === "ABK026";

    return isLoanPrefix || isLoanId || isLoanGroup;
};

/**
 * Resolve the primary operating account for a member.
 * Hierarchy:
 * 1. Explicit primary_account_no saved on Member profile (if active and operating)
 * 2. Operating account marked with is_primary: true
 * 3. Default: The operating account created first (earliest date_of_opening, createdAt)
 */
const resolvePrimaryAccountForMember = async (memberId) => {
    if (!memberId) return { account: null, member: null, isDefault: false };

    // Fetch member
    const member = await MemberModel.findOne({
        $or: [
            { member_id: memberId },
            { member_id: String(memberId) },
            { Member_id: memberId }
        ]
    });

    const memberQuery = {
        $or: [
            { member_id: memberId },
            { member_id: String(memberId) },
            { member_id: parseInt(memberId) || 0 }
        ],
        status: { $nin: ["closed", "inactive"] }
    };

    // 1. Check if member has an explicit primary_account_no
    if (member && member.primary_account_no) {
        const primaryAcc = await AccountsModel.findOne({
            ...memberQuery,
            account_no: member.primary_account_no
        });

        if (primaryAcc) {
            const grp = await AccountGroupModel.findOne({ account_group_id: primaryAcc.account_type });
            if (!isLoanAccount(primaryAcc, grp)) {
                return { account: primaryAcc, member, isDefault: false };
            }
        }
    }

    // 2. Check if an account is flagged with is_primary: true
    const explicitAcc = await AccountsModel.findOne({
        ...memberQuery,
        is_primary: true
    });

    if (explicitAcc) {
        const grp = await AccountGroupModel.findOne({ account_group_id: explicitAcc.account_type });
        if (!isLoanAccount(explicitAcc, grp)) {
            return { account: explicitAcc, member, isDefault: false };
        }
    }

    // 3. Default: Find all active accounts of this member sorted by earliest creation
    const allAccounts = await AccountsModel.find(memberQuery)
        .sort({ date_of_opening: 1, createdAt: 1 });

    if (allAccounts.length === 0) {
        return { account: null, member, isDefault: false };
    }

    // Preload account groups for lookup
    const allGroups = await AccountGroupModel.find({});
    const groupMap = {};
    allGroups.forEach(g => { groupMap[g.account_group_id] = g; });

    // Filter operating accounts (SB, CA, Pigmy Saving, etc.)
    const operatingAccounts = allAccounts.filter(acc => {
        const grp = groupMap[acc.account_type];
        return !isLoanAccount(acc, grp);
    });

    if (operatingAccounts.length > 0) {
        // Earliest created operating account is the primary account by default
        return { account: operatingAccounts[0], member, isDefault: true };
    }

    return { account: null, member, isDefault: false };
};

/**
 * Sets an operating account as the member's primary account.
 */
const setPrimaryAccountForMember = async (memberId, accountIdentifier) => {
    if (!memberId) {
        throw new Error("Member ID is required");
    }
    if (!accountIdentifier) {
        throw new Error("Account number or ID is required");
    }

    const memberQuery = {
        $or: [
            { member_id: memberId },
            { member_id: String(memberId) },
            { member_id: parseInt(memberId) || 0 }
        ]
    };

    const targetAccount = await AccountsModel.findOne({
        ...memberQuery,
        $or: [
            { account_no: accountIdentifier },
            { account_id: accountIdentifier }
        ]
    });

    if (!targetAccount) {
        throw new Error(`Account ${accountIdentifier} not found for this member`);
    }

    const grp = await AccountGroupModel.findOne({ account_group_id: targetAccount.account_type });
    if (isLoanAccount(targetAccount, grp)) {
        throw new Error("Loan accounts cannot be designated as primary operating accounts. Please select a Savings (SB) or Current (CA) account.");
    }

    // Reset is_primary on all accounts of this member
    await AccountsModel.updateMany(memberQuery, { $set: { is_primary: false } });

    // Set is_primary: true on the chosen account
    targetAccount.is_primary = true;
    await targetAccount.save();

    // Persist primary_account_no on member profile
    await MemberModel.findOneAndUpdate(
        {
            $or: [
                { member_id: memberId },
                { member_id: String(memberId) },
                { Member_id: memberId }
            ]
        },
        { $set: { primary_account_no: targetAccount.account_no } }
    );

    return targetAccount;
};

/**
 * Disburse a sanctioned/approved loan amount into the member's primary operating account.
 */
const disburseLoanToAccount = async ({ loanAccount, amount, enteredBy, targetAccountNo }) => {
    const loanAmount = Number(amount || loanAccount.account_amount || 0);
    if (loanAmount <= 0) {
        return { disbursed: false, reason: "Zero or negative loan amount" };
    }

    if (loanAccount.loan_disbursed_to) {
        return {
            disbursed: false,
            alreadyDisbursed: true,
            disbursed_to: loanAccount.loan_disbursed_to,
            disbursed_at: loanAccount.disbursed_at
        };
    }

    let targetAccount = null;
    let member = null;

    if (targetAccountNo) {
        targetAccount = await AccountsModel.findOne({
            account_no: targetAccountNo,
            status: { $nin: ["closed", "inactive"] }
        });
        member = await MemberModel.findOne({
            $or: [
                { member_id: loanAccount.member_id },
                { Member_id: loanAccount.member_id }
            ]
        });
    }

    if (targetAccount) {
        const grp = await AccountGroupModel.findOne({ account_group_id: targetAccount.account_type });
        if (isLoanAccount(targetAccount, grp)) {
            console.warn(`⚠️ Target account ${targetAccount.account_no} is a loan account; falling back to primary operating account.`);
            targetAccount = null;
        }
    }

    if (!targetAccount) {
        const resolved = await resolvePrimaryAccountForMember(loanAccount.member_id);
        targetAccount = resolved.account;
        member = resolved.member;
    }

    if (!targetAccount) {
        console.warn(`⚠️ Could not disburse loan ${loanAccount.account_no || loanAccount.account_id}: Member ${loanAccount.member_id} has no active operating account.`);
        return {
            disbursed: false,
            reason: "No active operating account (SB/CA) found for member to receive disbursement"
        };
    }

    // 1. Credit the primary operating account
    const previousBalance = Number(targetAccount.account_amount || 0);
    const newBalance = previousBalance + loanAmount;
    targetAccount.account_amount = newBalance;
    await targetAccount.save();

    // 2. Mark the loan account as disbursed
    loanAccount.loan_disbursed_to = targetAccount.account_no;
    loanAccount.disbursed_at = new Date();
    await loanAccount.save();

    // 3. Create credit transaction for the primary account
    try {
        const loanGroup = await AccountGroupModel.findOne({ account_group_id: loanAccount.account_type });
        const loanGroupName = loanGroup?.account_group_name || "Loan";

        const transId = await generateTransactionId();
        await TransactionModel.create({
            transaction_id: transId,
            transaction_date: new Date(),
            member_id: loanAccount.member_id,
            account_number: targetAccount.account_no,
            account_type: targetAccount.account_type,
            transaction_type: "Loan Disbursement",
            description: `Loan disbursement credited from ${loanAccount.account_no || loanAccount.account_id} (${loanGroupName})`,
            credit: loanAmount,
            debit: 0,
            balance: newBalance,
            Name: member ? (member.name || member.Name) : null,
            mobileno: member ? (member.contactno || member.mobileno) : null,
            status: "Completed",
            collected_by: enteredBy || "System"
        });

        console.log(`✅ Disbursed ₹${loanAmount} from loan ${loanAccount.account_no} to primary account ${targetAccount.account_no} (Tx: ${transId})`);
    } catch (txErr) {
        console.error("❌ Error recording loan disbursement transaction:", txErr.message);
    }

    return {
        disbursed: true,
        disbursed_to: targetAccount.account_no,
        target_account_id: targetAccount.account_id,
        amount: loanAmount,
        new_balance: newBalance
    };
};

module.exports = {
    isLoanAccount,
    resolvePrimaryAccountForMember,
    setPrimaryAccountForMember,
    disburseLoanToAccount
};
