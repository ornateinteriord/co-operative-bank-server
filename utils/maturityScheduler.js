const cron = require("node-cron");
const AccountsModel = require("../models/accounts.model");
const TransactionModel = require("../models/transaction.model");
const AccountGroupModel = require("../models/accountGroup.model");
const generateTransactionId = require("./generateTransactionId");

// ─────────────────────────────────────────────────────────────────────────────
// Helper: identify account type by group name
// ─────────────────────────────────────────────────────────────────────────────
const getGroupName = async (account_type) => {
    if (!account_type) return "";
    const grp = await AccountGroupModel.findOne({ account_group_id: account_type });
    return ((grp && grp.account_group_name) || "").toUpperCase();
};

const isLoanGroupName = (name) =>
    name.includes("LOAN") || name.includes("OVERDRAFT");

const isSavingsGroupName = (name) =>
    name.includes("SAVING") || name === "SB";

const isCurrentGroupName = (name) =>
    name.includes("CURRENT") || name === "CA";

const isRdGroupName = (name) =>
    name.includes("RECURRING") || name === "RD";

const isFdGroupName = (name) =>
    name.includes("FIXED") || name === "FD";

const isPigmyGroupName = (name) =>
    name.includes("PIGMY") || name.includes("PIGMI");

// ─────────────────────────────────────────────────────────────────────────────
// 1. MATURITY PROCESSING (FD / RD / Pigmy)
//    Runs for accounts where date_of_maturity ≤ today, not yet processed.
//    Uses simple interest: I = (P × R × T) / (100 × 12)
// ─────────────────────────────────────────────────────────────────────────────
const processMaturedAccounts = async () => {
    console.log("⏰ [Maturity] Starting maturity processing...");
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const maturedAccounts = await AccountsModel.find({
            date_of_maturity: { $lte: today },
            maturity_processed: { $ne: true },
            status: { $nin: ["closed", "inactive"] },
            account_amount: { $gt: 0 },
            interest_rate: { $gt: 0 },
        });

        console.log(`📋 [Maturity] ${maturedAccounts.length} account(s) to process`);
        let processed = 0, errors = 0;

        for (const account of maturedAccounts) {
            try {
                const groupName = await getGroupName(account.account_type);
                // Skip loan accounts — they don't accrue maturity interest
                if (isLoanGroupName(groupName)) continue;

                const durationMonths = (account.duration && account.duration > 0) ? account.duration : 12;
                // Simple Interest: I = P × R × T / (100 × 12)
                const interestAmount = Math.round(
                    (account.account_amount * account.interest_rate * durationMonths) / (100 * 12) * 100
                ) / 100;
                const netAmount = account.account_amount + interestAmount;

                await AccountsModel.findByIdAndUpdate(account._id, {
                    interest_amount: interestAmount,
                    net_amount: netAmount,
                    account_amount: netAmount,
                    maturity_processed: true,
                    last_transaction_date: new Date(),
                });

                const txId = await generateTransactionId();
                await TransactionModel.create({
                    transaction_id: txId,
                    transaction_date: new Date(),
                    member_id: account.member_id,
                    account_number: account.account_no,
                    account_type: account.account_type,
                    transaction_type: "Interest Credit",
                    description: `Maturity interest credited – ${account.account_no} (Duration: ${durationMonths}m @ ${account.interest_rate}%)`,
                    credit: interestAmount,
                    debit: 0,
                    balance: netAmount,
                    status: "Completed",
                    reference_no: account.account_id,
                });

                console.log(`✅ [Maturity] ${account.account_no}: ₹${interestAmount} interest → net ₹${netAmount}`);
                processed++;
            } catch (err) {
                console.error(`❌ [Maturity] Error on ${account.account_id}:`, err.message);
                errors++;
            }
        }

        console.log(`📊 [Maturity] Done. Processed: ${processed}, Errors: ${errors}`);
        return { success: true, processed, errors };
    } catch (error) {
        console.error("❌ [Maturity] Fatal error:", error.message);
        return { success: false, error: error.message };
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. DORMANT ACCOUNT DETECTION
//    Flags accounts with NO transaction in the last 12 months as dormant.
//    SB and CA accounts are eligible. Loan accounts are excluded.
// ─────────────────────────────────────────────────────────────────────────────
const processDormantAccounts = async () => {
    console.log("😴 [Dormant] Checking for dormant accounts...");
    try {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        // Find all active operating accounts (not loans, not already closed)
        const activeAccounts = await AccountsModel.find({
            status: { $nin: ["closed", "inactive", "dormant"] },
            is_dormant: { $ne: true },
        });

        let flagged = 0;
        let revived = 0;

        for (const account of activeAccounts) {
            try {
                const groupName = await getGroupName(account.account_type);
                // Only flag SB and CA (operating accounts) as dormant
                if (!isSavingsGroupName(groupName) && !isCurrentGroupName(groupName)) continue;

                // Find latest transaction on this account
                const latestTx = await TransactionModel.findOne({
                    $or: [
                        { account_number: account.account_no },
                        { member_id: account.member_id, account_type: account.account_type }
                    ],
                    status: "Completed"
                }).sort({ transaction_date: -1 });

                const lastActivity = latestTx
                    ? latestTx.transaction_date
                    : (account.last_transaction_date || account.date_of_opening);

                if (!lastActivity || lastActivity < twelveMonthsAgo) {
                    // Mark as dormant
                    await AccountsModel.findByIdAndUpdate(account._id, {
                        is_dormant: true,
                        dormant_since: lastActivity || account.date_of_opening,
                        status: "dormant",
                    });
                    console.log(`😴 [Dormant] Flagged: ${account.account_no} (last activity: ${lastActivity ? lastActivity.toDateString() : "never"})`);
                    flagged++;
                }
            } catch (err) {
                console.error(`❌ [Dormant] Error on ${account.account_id}:`, err.message);
            }
        }

        // Also revive dormant accounts that have had recent activity
        const dormantAccounts = await AccountsModel.find({
            is_dormant: true,
            status: "dormant",
        });

        for (const account of dormantAccounts) {
            try {
                const latestTx = await TransactionModel.findOne({
                    $or: [
                        { account_number: account.account_no },
                        { member_id: account.member_id, account_type: account.account_type }
                    ],
                    status: "Completed",
                    transaction_date: { $gte: twelveMonthsAgo }
                }).sort({ transaction_date: -1 });

                if (latestTx) {
                    // Account has recent activity → revive it
                    await AccountsModel.findByIdAndUpdate(account._id, {
                        is_dormant: false,
                        dormant_since: null,
                        status: "active",
                        last_transaction_date: latestTx.transaction_date,
                    });
                    console.log(`✅ [Dormant] Revived: ${account.account_no}`);
                    revived++;
                }
            } catch (err) {
                console.error(`❌ [Dormant] Error reviving ${account.account_id}:`, err.message);
            }
        }

        console.log(`📊 [Dormant] Done. Flagged: ${flagged}, Revived: ${revived}`);
        return { success: true, flagged, revived };
    } catch (error) {
        console.error("❌ [Dormant] Fatal error:", error.message);
        return { success: false, error: error.message };
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. OVERDUE LOAN PROCESSING
//    Loans that are past maturity date AND still have outstanding balance are
//    marked overdue. Daily penal interest is accrued on the outstanding amount.
//    Penal rate default: +2% p.a. above the loan's interest rate.
// ─────────────────────────────────────────────────────────────────────────────
const processOverdueLoans = async () => {
    console.log("⚠️ [Overdue] Processing overdue loans...");
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find all loan accounts that are past maturity and still have outstanding balance
        const allGroups = await AccountGroupModel.find({});
        const loanGroupIds = allGroups
            .filter(g => isLoanGroupName((g.account_group_name || "").toUpperCase()))
            .map(g => g.account_group_id);

        const overdueLoans = await AccountsModel.find({
            account_type: { $in: loanGroupIds },
            date_of_maturity: { $lt: today, $ne: null },
            account_amount: { $gt: 0 }, // Still has outstanding balance
            status: { $nin: ["closed", "inactive"] },
        });

        let flagged = 0;
        let penalApplied = 0;

        for (const loan of overdueLoans) {
            try {
                const updates = {};

                if (!loan.is_overdue) {
                    updates.is_overdue = true;
                    updates.overdue_since = loan.date_of_maturity;
                    flagged++;
                    console.log(`🔴 [Overdue] Flagged: ${loan.account_no} overdue since ${loan.date_of_maturity?.toDateString()}`);
                }

                // Calculate daily penal interest on outstanding amount
                // Penal Rate = loan interest_rate + penal_interest_rate (default 2%)
                const penalRate = (loan.interest_rate || 0) + (loan.penal_interest_rate || 2);
                const dailyPenalRate = penalRate / (100 * 365);
                const dailyPenalAmount = Math.round(loan.account_amount * dailyPenalRate * 100) / 100;

                if (dailyPenalAmount > 0) {
                    updates.penal_interest_accrued = (loan.penal_interest_accrued || 0) + dailyPenalAmount;
                    penalApplied++;
                }

                if (Object.keys(updates).length > 0) {
                    await AccountsModel.findByIdAndUpdate(loan._id, updates);
                }
            } catch (err) {
                console.error(`❌ [Overdue] Error on ${loan.account_id}:`, err.message);
            }
        }

        // Clear overdue flag for loans that are now fully repaid
        const resolvedLoans = await AccountsModel.find({
            is_overdue: true,
            account_amount: { $lte: 0 },
        });
        for (const loan of resolvedLoans) {
            await AccountsModel.findByIdAndUpdate(loan._id, {
                is_overdue: false,
                status: "closed",
                date_of_close: new Date(),
            });
            console.log(`✅ [Overdue] Resolved: ${loan.account_no} fully repaid`);
        }

        console.log(`📊 [Overdue] Done. Newly flagged: ${flagged}, Penal applied: ${penalApplied}`);
        return { success: true, flagged, penalApplied };
    } catch (error) {
        console.error("❌ [Overdue] Fatal error:", error.message);
        return { success: false, error: error.message };
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. RD MISSED INSTALLMENT TRACKING
//    Monthly: check if RD accounts received their expected installment.
//    If missed, increment rd_missed_installments and accrue ₹5 penalty per missed.
// ─────────────────────────────────────────────────────────────────────────────
const processRDMissedInstallments = async () => {
    console.log("📅 [RD] Processing missed RD installments...");
    try {
        const allGroups = await AccountGroupModel.find({});
        const rdGroupIds = allGroups
            .filter(g => isRdGroupName((g.account_group_name || "").toUpperCase()))
            .map(g => g.account_group_id);

        const rdAccounts = await AccountsModel.find({
            account_type: { $in: rdGroupIds },
            status: { $nin: ["closed", "inactive"] },
            rd_installment_amount: { $gt: 0 },
        });

        const today = new Date();
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1); // 1st of this month
        let penalised = 0;

        for (const account of rdAccounts) {
            try {
                const lastInstallDate = account.rd_last_installment_date;

                // If we never recorded a last installment date, use date_of_opening
                const expectedFrom = lastInstallDate || account.date_of_opening;

                // Count how many full months have elapsed since expected installment date
                const monthsElapsed = Math.floor(
                    (thisMonth - new Date(expectedFrom)) / (1000 * 60 * 60 * 24 * 30.44)
                );

                if (monthsElapsed <= 0) continue; // No missed installment yet

                // Check how many installment credits appeared in TransactionModel for this account
                // in the elapsed period
                const installmentCredits = await TransactionModel.countDocuments({
                    account_number: account.account_no,
                    transaction_type: { $in: ["Collection", "RD Installment", "Money Added"] },
                    status: "Completed",
                    transaction_date: { $gte: expectedFrom, $lte: today },
                });

                const expectedInstallments = Math.max(1, monthsElapsed);
                const missedThisCycle = Math.max(0, expectedInstallments - installmentCredits - (account.rd_paid_installments || 0));

                if (missedThisCycle > 0) {
                    const penaltyPerMiss = 5; // ₹5 per missed installment (standard Nidhi rule)
                    const newPenalty = missedThisCycle * penaltyPerMiss;

                    await AccountsModel.findByIdAndUpdate(account._id, {
                        $inc: {
                            rd_missed_installments: missedThisCycle,
                            rd_penalty_accrued: newPenalty,
                        }
                    });

                    console.log(`📛 [RD] ${account.account_no}: ${missedThisCycle} missed → penalty ₹${newPenalty}`);
                    penalised++;
                }
            } catch (err) {
                console.error(`❌ [RD] Error on ${account.account_id}:`, err.message);
            }
        }

        console.log(`📊 [RD] Done. Accounts penalised: ${penalised}`);
        return { success: true, penalised };
    } catch (error) {
        console.error("❌ [RD] Fatal error:", error.message);
        return { success: false, error: error.message };
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. SAVINGS ACCOUNT (SB) QUARTERLY INTEREST
//    Runs on 1st of Jan, Apr, Jul, Oct (quarterly).
//    Rate is typically 3.5% p.a. → 0.875% per quarter.
//    Only credits if account was opened before the quarter.
// ─────────────────────────────────────────────────────────────────────────────
const processSBQuarterlyInterest = async () => {
    const today = new Date();
    // Only run on the 1st day of a quarter month
    const quarterMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
    if (!quarterMonths.includes(today.getMonth())) {
        console.log("ℹ️ [SB Interest] Not a quarter start – skipping");
        return { success: true, skipped: true };
    }

    console.log("💰 [SB Interest] Processing quarterly savings interest...");
    try {
        const allGroups = await AccountGroupModel.find({});
        const sbGroupIds = allGroups
            .filter(g => isSavingsGroupName((g.account_group_name || "").toUpperCase()))
            .map(g => g.account_group_id);

        const sbAccounts = await AccountsModel.find({
            account_type: { $in: sbGroupIds },
            status: { $nin: ["closed", "inactive", "dormant"] },
            account_amount: { $gt: 0 },
        });

        const SB_ANNUAL_RATE = 3.5; // 3.5% per annum – standard Nidhi SB rate
        const quarterlyRate = SB_ANNUAL_RATE / 4 / 100; // 0.00875
        let credited = 0;

        for (const account of sbAccounts) {
            try {
                // Skip if already credited this quarter
                if (account.sb_interest_last_credited) {
                    const lastCredit = new Date(account.sb_interest_last_credited);
                    if (
                        lastCredit.getFullYear() === today.getFullYear() &&
                        lastCredit.getMonth() === today.getMonth()
                    ) {
                        continue; // Already credited this quarter
                    }
                }

                const interestAmount = Math.round(account.account_amount * quarterlyRate * 100) / 100;
                if (interestAmount <= 0) continue;

                const newBalance = account.account_amount + interestAmount;

                await AccountsModel.findByIdAndUpdate(account._id, {
                    account_amount: newBalance,
                    sb_interest_last_credited: today,
                    sb_interest_accrued: 0, // Reset after crediting
                    last_transaction_date: today,
                });

                const txId = await generateTransactionId();
                await TransactionModel.create({
                    transaction_id: txId,
                    transaction_date: today,
                    member_id: account.member_id,
                    account_number: account.account_no,
                    account_type: account.account_type,
                    transaction_type: "Interest Credit",
                    description: `Quarterly SB interest @ ${SB_ANNUAL_RATE}% p.a. (₹${interestAmount})`,
                    credit: interestAmount,
                    debit: 0,
                    balance: newBalance,
                    status: "Completed",
                    reference_no: `SB-INT-Q${Math.ceil((today.getMonth() + 1) / 3)}-${today.getFullYear()}`,
                });

                console.log(`✅ [SB Interest] ${account.account_no}: ₹${interestAmount} credited → balance ₹${newBalance}`);
                credited++;
            } catch (err) {
                console.error(`❌ [SB Interest] Error on ${account.account_id}:`, err.message);
            }
        }

        console.log(`📊 [SB Interest] Done. Accounts credited: ${credited}`);
        return { success: true, credited };
    } catch (error) {
        console.error("❌ [SB Interest] Fatal error:", error.message);
        return { success: false, error: error.message };
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// START ALL SCHEDULERS
//   - Daily midnight: maturity, dormant, overdue loans, RD penalty
//   - Quarterly (1st of Jan/Apr/Jul/Oct via daily check): SB interest
// ─────────────────────────────────────────────────────────────────────────────
const startMaturityScheduler = () => {
    // Run all daily banking jobs at 00:05 every night
    cron.schedule("5 0 * * *", async () => {
        console.log("\n🕛 ======= Daily Banking Jobs Started =======");
        await processMaturedAccounts();
        await processDormantAccounts();
        await processOverdueLoans();
        await processRDMissedInstallments();
        await processSBQuarterlyInterest(); // Only runs on quarter-start months
        console.log("🕛 ======= Daily Banking Jobs Complete =======\n");
    });

    console.log("✅ [Scheduler] All daily banking cron jobs registered (runs at 00:05 daily)");
};

module.exports = {
    startMaturityScheduler,
    // Exported for manual triggering via admin/debug endpoints
    processMaturedAccounts,
    processDormantAccounts,
    processOverdueLoans,
    processRDMissedInstallments,
    processSBQuarterlyInterest,
};
