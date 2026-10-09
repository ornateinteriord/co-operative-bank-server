/**
 * schedulerController.js
 * 
 * Admin endpoints to monitor and manually execute daily banking cron jobs:
 * - Maturity calculation (FD/RD/Pigmy)
 * - Dormant account detection (SB/CA inactivity > 12m)
 * - Overdue loan processing & penal interest
 * - RD missed installment tracking & penalty
 * - SB quarterly interest distribution
 */

const AccountsModel = require("../../../models/accounts.model");
const AccountGroupModel = require("../../../models/accountGroup.model");
const {
    processMaturedAccounts,
    processDormantAccounts,
    processOverdueLoans,
    processRDMissedInstallments,
    processSBQuarterlyInterest,
} = require("../../../utils/maturityScheduler");
const { isFdGroup, isRdGroup } = require("../../../utils/bankingRules");

/**
 * Get overview of all scheduler statuses and pending queues
 */
const getSchedulerStatus = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        // 1. Pending Matured Accounts
        const pendingMatured = await AccountsModel.countDocuments({
            date_of_maturity: { $lte: today },
            maturity_processed: { $ne: true },
            status: { $nin: ["closed", "inactive"] },
            account_amount: { $gt: 0 },
            interest_rate: { $gt: 0 },
        });

        // 2. Currently Dormant Accounts
        const activeDormant = await AccountsModel.countDocuments({
            is_dormant: true,
            status: "dormant",
        });

        // 3. Dormant Candidates (SB/CA active with last_transaction_date < 12 months ago or null)
        const allGroups = await AccountGroupModel.find({});
        const operatingGroupIds = allGroups
            .filter(g => {
                const name = (g.account_group_name || "").toUpperCase();
                return name.includes("SAVING") || name === "SB" || name.includes("CURRENT") || name === "CA";
            })
            .map(g => g.account_group_id);

        const dormantCandidates = await AccountsModel.countDocuments({
            account_type: { $in: operatingGroupIds },
            status: { $nin: ["closed", "inactive", "dormant"] },
            is_dormant: { $ne: true },
            $or: [
                { last_transaction_date: { $lt: twelveMonthsAgo } },
                { last_transaction_date: null, date_of_opening: { $lt: twelveMonthsAgo } }
            ]
        });

        // 4. Overdue Loans
        const loanGroupIds = allGroups
            .filter(g => {
                const name = (g.account_group_name || "").toUpperCase();
                return name.includes("LOAN") || name.includes("OVERDRAFT");
            })
            .map(g => g.account_group_id);

        const overdueLoans = await AccountsModel.countDocuments({
            account_type: { $in: loanGroupIds },
            date_of_maturity: { $lt: today, $ne: null },
            account_amount: { $gt: 0 },
            status: { $nin: ["closed", "inactive"] },
        });

        // 5. Total Active RD Accounts
        const rdGroupIds = allGroups
            .filter(g => isRdGroup((g.account_group_name || "").toUpperCase()))
            .map(g => g.account_group_id);

        const activeRD = await AccountsModel.countDocuments({
            account_type: { $in: rdGroupIds },
            status: { $nin: ["closed", "inactive"] },
        });

        // 6. Quarterly SB Interest Due
        const quarterMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
        const sbInterestDueThisMonth = quarterMonths.includes(new Date().getMonth());

        return res.status(200).json({
            success: true,
            data: {
                server_time: new Date(),
                next_scheduled_run: "00:05 AM Daily (IST)",
                metrics: {
                    pending_matured_accounts: pendingMatured,
                    current_dormant_accounts: activeDormant,
                    dormant_candidates_unflagged: dormantCandidates,
                    overdue_loans_count: overdueLoans,
                    active_rd_accounts: activeRD,
                    sb_quarterly_interest_due_this_month: sbInterestDueThisMonth,
                }
            }
        });
    } catch (error) {
        console.error("Error getting scheduler status:", error);
        return res.status(500).json({ success: false, message: "Failed to get scheduler status", error: error.message });
    }
};

/**
 * Manually trigger Maturity Calculation Job
 */
const runMaturityJob = async (req, res) => {
    try {
        console.log("⚡ Admin manually triggered maturity calculation job");
        const result = await processMaturedAccounts();
        return res.status(200).json({
            success: true,
            message: "Maturity processing completed",
            result
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error running maturity job", error: error.message });
    }
};

/**
 * Manually trigger Dormant Account Detection Job
 */
const runDormantJob = async (req, res) => {
    try {
        console.log("⚡ Admin manually triggered dormant account detection job");
        const result = await processDormantAccounts();
        return res.status(200).json({
            success: true,
            message: "Dormant account processing completed",
            result
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error running dormant job", error: error.message });
    }
};

/**
 * Manually trigger Overdue Loans Job
 */
const runOverdueJob = async (req, res) => {
    try {
        console.log("⚡ Admin manually triggered overdue loans job");
        const result = await processOverdueLoans();
        return res.status(200).json({
            success: true,
            message: "Overdue loans processing completed",
            result
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error running overdue loans job", error: error.message });
    }
};

/**
 * Manually trigger RD Missed Installment Penalty Job
 */
const runRDPenaltyJob = async (req, res) => {
    try {
        console.log("⚡ Admin manually triggered RD installment check job");
        const result = await processRDMissedInstallments();
        return res.status(200).json({
            success: true,
            message: "RD missed installments processing completed",
            result
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error running RD penalty job", error: error.message });
    }
};

/**
 * Manually trigger SB Quarterly Interest Job
 */
const runSBInterestJob = async (req, res) => {
    try {
        console.log("⚡ Admin manually triggered SB quarterly interest job");
        const result = await processSBQuarterlyInterest();
        return res.status(200).json({
            success: true,
            message: "SB quarterly interest processing completed",
            result
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error running SB interest job", error: error.message });
    }
};

module.exports = {
    getSchedulerStatus,
    runMaturityJob,
    runDormantJob,
    runOverdueJob,
    runRDPenaltyJob,
    runSBInterestJob,
};
