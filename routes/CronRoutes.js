const express = require("express");
const { processDailyROI } = require("../controllers/Users/roiService/roiService");

const router = express.Router();

/**
 * @route   GET /api/cron/roi
 * @desc    Trigger Daily ROI Payout (Vercel Cron)
 * @access  Protected (CRON_SECRET)
 */
router.get("/roi", async (req, res) => {
    // 1. Simple Secret Protection
    // Vercel Cron sends a secret in the Authorization header: `Bearer ${CRON_SECRET}` 
    // OR we can use a custom header. For simplicity, we'll check it from headers or query.
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    // Log the incoming request for Vercel diagnostics
    console.log(`⏰ [CRON] [${new Date().toISOString()}] ROI Trigger received.`);
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        console.warn("⚠️ [CRON] Unauthorized ROI trigger attempt. Check Vercel CRON_SECRET environment variable.");
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log("🚀 [CRON] Vercel Trigger: Starting Daily ROI Distribution...");
    
    const startTime = Date.now();
    try {
        const result = await processDailyROI();
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ [CRON] Vercel ROI Payout completed in ${duration}s:`, result);
        
        return res.status(200).json({ 
            success: true, 
            message: "ROI processing completed", 
            duration: `${duration}s`,
            data: result 
        });
    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ [CRON] Vercel ROI Error after ${duration}s:`, error.message);
        
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error", 
            duration: `${duration}s`, 
            error: error.message 
        });
    }
});

/**
 * @route   GET /api/cron/daily-banking
 * @desc    Trigger Daily Banking Operations (Maturity, Dormant, Overdue Loans, RD Penalties, SB Interest)
 * @access  Protected (CRON_SECRET)
 */
router.get("/daily-banking", async (req, res) => {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    console.log(`⏰ [CRON] [${new Date().toISOString()}] Daily Banking Operations Trigger received.`);
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        console.warn("⚠️ [CRON] Unauthorized Daily Banking trigger attempt.");
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
        processMaturedAccounts,
        processDormantAccounts,
        processOverdueLoans,
        processRDMissedInstallments,
        processSBQuarterlyInterest,
    } = require("../utils/maturityScheduler");

    const startTime = Date.now();
    try {
        console.log("🚀 [CRON] Starting Daily Banking Jobs...");
        const maturityRes = await processMaturedAccounts();
        const dormantRes = await processDormantAccounts();
        const overdueRes = await processOverdueLoans();
        const rdRes = await processRDMissedInstallments();
        const sbRes = await processSBQuarterlyInterest();

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ [CRON] Daily Banking Jobs finished in ${duration}s`);

        return res.status(200).json({
            success: true,
            message: "Daily banking jobs completed successfully",
            duration: `${duration}s`,
            results: {
                maturity: maturityRes,
                dormant: dormantRes,
                overdue_loans: overdueRes,
                rd_installments: rdRes,
                sb_interest: sbRes,
            }
        });
    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ [CRON] Daily Banking Jobs failed after ${duration}s:`, error.message);
        return res.status(500).json({
            success: false,
            message: "Daily banking execution error",
            duration: `${duration}s`,
            error: error.message
        });
    }
});

module.exports = router;

