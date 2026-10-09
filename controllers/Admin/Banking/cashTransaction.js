const CashTransactionModel = require("../../../models/cashTransaction.model");
const AccountsModel = require("../../../models/accounts.model");
const MemberModel = require("../../../models/member.model");
const TransactionModel = require("../../../models/transaction.model");
const axios = require("axios");
const generateTransactionId = require("../../../utils/generateTransactionId");
const { touchAccountActivity, calculatePrematureClosurePenalty, isFdGroup, isRdGroup } = require("../../../utils/bankingRules");
const AccountGroupModel = require("../../../models/accountGroup.model");

/**
 * Get all cash transactions with balance calculations
 */
const getAllCashTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;

        // Build filter
        const filter = { status: { $ne: 'inactive' } };

        if (search) {
            filter.$or = [
                { cash_transaction_id: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { reference_no: { $regex: search, $options: 'i' } },
                { voucher_no: { $regex: search, $options: 'i' } }
            ];
        }

        // Get all transactions sorted by date
        const allTransactions = await CashTransactionModel.find(filter).sort({ transaction_date: 1, createdAt: 1 });

        // Calculate balances
        let runningBalance = 0;
        let totalDebit = 0;
        let totalCredit = 0;

        const transactionsWithBalance = allTransactions.map((transaction) => {
            const debit = transaction.debit || 0;
            const credit = transaction.credit || 0;

            totalDebit += debit;
            totalCredit += credit;

            // Credit increases balance, debit decreases balance
            runningBalance += credit - debit;

            return {
                ...transaction.toObject(),
                balance: runningBalance
            };
        });

        // Calculate opening and closing balances
        const openingBalance = 0; // Assuming opening balance is 0
        const closingBalance = runningBalance;

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedTransactions = transactionsWithBalance.slice(startIndex, endIndex);

        return res.status(200).json({
            success: true,
            message: "Cash transactions fetched successfully",
            data: paginatedTransactions,
            summary: {
                openingBalance,
                debitAmount: totalDebit,
                creditAmount: totalCredit,
                closingBalance
            },
            pagination: {
                total: transactionsWithBalance.length,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(transactionsWithBalance.length / limit)
            }
        });
    } catch (error) {
        console.error("Error in getAllCashTransactions:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch cash transactions",
            error: error.message
        });
    }
};

/**
 * Get cash transaction by ID
 */
const getCashTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await CashTransactionModel.findOne({
            cash_transaction_id: id,
            status: { $ne: 'inactive' }
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Cash transaction not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cash transaction fetched successfully",
            data: transaction
        });
    } catch (error) {
        console.error("Error in getCashTransactionById:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch cash transaction",
            error: error.message
        });
    }
};

/**
 * Create cash transaction
 */
const createCashTransaction = async (req, res) => {
    try {
        const {
            transaction_date,
            description,
            reference_no,
            credit,
            debit,
            voucher_no,
            branch_id
        } = req.body;

        // Generate cash transaction ID
        const count = await CashTransactionModel.countDocuments();
        const cash_transaction_id = `CASH${String(count + 1).padStart(4, '0')}`;

        const newTransaction = new CashTransactionModel({
            cash_transaction_id,
            transaction_date,
            description,
            reference_no,
            credit,
            debit,
            voucher_no,
            branch_id,
            status: "active"
        });

        await newTransaction.save();

        return res.status(201).json({
            success: true,
            message: "Cash transaction created successfully",
            data: newTransaction
        });
    } catch (error) {
        console.error("Error in createCashTransaction:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create cash transaction",
            error: error.message
        });
    }
};

/**
 * Soft delete cash transaction
 */
const deleteCashTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await CashTransactionModel.findOneAndUpdate(
            { cash_transaction_id: id },
            { $set: { status: "inactive" } },
            { new: true }
        );

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Cash transaction not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Cash transaction deleted successfully",
            data: transaction
        });
    } catch (error) {
        console.error("Error in deleteCashTransaction:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete cash transaction",
            error: error.message
        });
    }
};

/**
 * Create maturity payment with Cashfree Payout
 */
const createMaturityPayment = async (req, res) => {
    try {
        const {
            account_id,
            account_no,
            account_type,
            member_id,
            amount,
            payment_method = 'online', // 'online', 'cash', 'cheque'
            description,
            reference_no,
            voucher_no,
            branch_id
        } = req.body;

        // Validate required fields
        if (!account_id || !account_no || !account_type || !member_id || !amount) {
            return res.status(400).json({
                success: false,
                message: "Account details, member ID, and amount are required"
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than zero"
            });
        }

        // Validate account exists and is matured
        const account = await AccountsModel.findOne({ account_id: account_id });
        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        // Check if account is eligible for maturity (has maturity date and amount)
        if (account.status !== "matured" && account.status !== "active") {
            return res.status(400).json({
                success: false,
                message: "Account is not in matured status for payment"
            });
        }

        if (account.account_amount < amount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient account balance. Available: ₹${account.account_amount}, Requested: ₹${amount}`
            });
        }

        // Validate member exists
        const member = await MemberModel.findOne({ member_id: member_id });
        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        // Process payment based on method
        let payoutResponse = null;
        let payoutStatus = "completed";
        let payoutReference = null;

        if (payment_method === 'online') {
            // Process with Cashfree Payout
            if (!process.env.CI_APP_ID || !process.env.CI_SECRET_KEY) {
                return res.status(500).json({
                    success: false,
                    message: "Payout gateway not configured. Contact administrator."
                });
            }

            // // Check if member has KYC and beneficiary details
            // if (member.kycStatus !== "APPROVED") {
            //     return res.status(400).json({
            //         success: false,
            //         message: "Member KYC not approved. Cannot process online payout."
            //     });
            // }

            // if (member.beneficiaryStatus !== "CREATED" || !member.beneficiaryId) {
            //     return res.status(400).json({
            //         success: false,
            //         message: "Member beneficiary not created. Cannot process online payout."
            //     });
            // }

            // Get Cashfree payout base URL
            const CASHFREE_PAYOUT_BASE_URL = process.env.PAYMENT_MODE === 'PRODUCTION'
                ? 'https://api.cashfree.com/payout'  // V2 Production
                : 'https://sandbox.cashfree.com/payout';  // V2 Sandbox

            // Step 1: Get Bearer token from Cashfree using V1 authorize endpoint
            // NOTE: Requires IP whitelisting in Cashfree Dashboard
            let bearerToken;
            try {
                // V1 authorize endpoint is used to get the bearer token
                const CASHFREE_PAYOUT_V1_URL = process.env.PAYMENT_MODE === 'PRODUCTION'
                    ? 'https://payout-api.cashfree.com'  // V1 Production
                    : 'https://payout-gamma.cashfree.com';  // V1 Sandbox

                console.log("🔄 Attempting Cashfree Payout authorization...");
                console.log("   URL:", `${CASHFREE_PAYOUT_V1_URL}/payout/v1/authorize`);
                console.log("   Client ID:", process.env.CI_APP_ID);

                const authResponse = await axios.post(
                    `${CASHFREE_PAYOUT_V1_URL}/payout/v1/authorize`,
                    {},
                    {
                        headers: {
                            "X-Client-Id": process.env.CI_APP_ID,
                            "X-Client-Secret": process.env.CI_SECRET_KEY,
                            "Content-Type": "application/json"
                        }
                    }
                );

                console.log("📦 Auth Response:", JSON.stringify(authResponse.data, null, 2));

                // Handle different response structures
                if (authResponse.data?.data?.token) {
                    bearerToken = authResponse.data.data.token;
                } else if (authResponse.data?.token) {
                    bearerToken = authResponse.data.token;
                } else if (authResponse.data?.subCode === "200" && authResponse.data?.data?.token) {
                    bearerToken = authResponse.data.data.token;
                }

                if (bearerToken) {
                    console.log("✅ Cashfree Payout authorization successful, token received");
                } else {
                    console.error("❌ Token not found in response structure:", authResponse.data);
                    throw new Error("Failed to obtain authorization token from Cashfree - unexpected response structure");
                }
            } catch (authError) {
                console.error("❌ Cashfree Payout authorization error:");
                console.error("   Status:", authError.response?.status);
                console.error("   Response:", JSON.stringify(authError.response?.data, null, 2));
                console.error("   Message:", authError.message);
                return res.status(500).json({
                    success: false,
                    message: "Failed to authorize with payout gateway",
                    error: authError.response?.data?.message || authError.message
                });
            }

            // Create transfer payload
            const transferId = `MATURITY_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const transferPayload = {
                transfer_id: transferId,
                transfer_amount: amount,
                transfer_mode: "banktransfer",
                beneficiary_details: {
                    beneficiary_name: member.name,
                    beneficiary_instrument_details: {
                        bank_account_number: member.account_number,
                        bank_ifsc: member.ifsc_code
                    },
                    email: member.emailid || "noemail@example.com",
                    phone: member.contactno
                },
                remarks: `Maturity payment for account ${account_no}`
            };

            // Step 2: Make payout request with Bearer token
            payoutResponse = await axios.post(
                `${CASHFREE_PAYOUT_BASE_URL}/transfers`,
                transferPayload,
                {
                    headers: {
                        "Authorization": `Bearer ${bearerToken}`,
                        "Content-Type": "application/json",
                        "x-api-version": "2024-01-01"
                    }
                }
            );

            payoutReference = transferId;
            payoutStatus = payoutResponse.data.status || "completed";
        }

        // Update account balance (reduce the amount)
        account.account_amount -= amount;
        if (account.account_amount <= 0) {
            account.status = "closed"; // Close account if balance reaches zero
            account.date_of_close = new Date();
        }
        account.last_transaction_date = new Date();
        await account.save();

        // Revive dormant account if activity found
        await touchAccountActivity(account.account_no);

        // Create cash transaction record
        const count = await CashTransactionModel.countDocuments();
        const cash_transaction_id = `CASH${String(count + 1).padStart(4, '0')}`;

        const cashTransaction = new CashTransactionModel({
            cash_transaction_id,
            transaction_date: new Date(),
            description: description || `Maturity payment for account ${account_no}`,
            reference_no: reference_no || payoutReference,
            credit: 0,
            debit: amount,
            voucher_no,
            branch_id,
            status: "active",
            payment_method,
            payout_reference: payoutReference,
            payout_status: payoutStatus
        });

        await cashTransaction.save();

        // Create transaction record
        const transactionId = await generateTransactionId();
        const transaction = await TransactionModel.create({
            transaction_id: transactionId,
            transaction_date: new Date(),
            member_id,
            account_number: account_no,
            account_type,
            transaction_type: "Maturity Payment",
            description: description || `Maturity payment for account ${account_no}`,
            credit: 0,
            debit: amount,
            balance: account.account_amount,
            status: "Completed",
            reference_no: reference_no || payoutReference,
            Name: member.name,
            mobileno: member.contactno,
            payment_method,
            payout_reference: payoutReference,
            payout_status: payoutStatus
        });

        // Update account close date if closed
        if (account.status === "closed") {
            account.date_of_close = new Date();
            await account.save();
        }

        return res.status(201).json({
            success: true,
            message: payment_method === 'online'
                ? "Maturity payment processed successfully via Cashfree Payout"
                : "Maturity payment recorded successfully",
            data: {
                cashTransaction,
                transaction,
                account: {
                    ...account.toObject(),
                    new_balance: account.account_amount
                },
                ...(payment_method === 'online' && {
                    payout_response: payoutResponse?.data,
                    payout_reference: payoutReference
                })
            }
        });

    } catch (error) {
        console.error("Error in createMaturityPayment:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process maturity payment",
            error: error.message
        });
    }
};

/**
 * Premature Closure of FD/RD Account
 * Calculates penalty, closes the account, and credits the member with reduced interest.
 */
const prematureClosureAccount = async (req, res) => {
    try {
        const { account_id, member_id, payment_method = 'cash', description, reference_no, voucher_no, branch_id } = req.body;

        if (!account_id || !member_id) {
            return res.status(400).json({ success: false, message: "account_id and member_id are required" });
        }

        const account = await AccountsModel.findOne({ account_id });
        if (!account) return res.status(404).json({ success: false, message: "Account not found" });

        if (["closed", "inactive"].includes(account.status)) {
            return res.status(400).json({ success: false, message: "Account is already closed" });
        }

        const accountGroup = await AccountGroupModel.findOne({ account_group_id: account.account_type });
        const groupName = ((accountGroup && accountGroup.account_group_name) || "").toUpperCase();

        if (!isFdGroup(groupName) && !isRdGroup(groupName)) {
            return res.status(400).json({
                success: false,
                message: "Premature closure is only applicable to FD and RD accounts. For SB/CA, process a regular withdrawal."
            });
        }

        // Maturity not yet reached — premature closure
        const today = new Date();
        const maturityDate = account.date_of_maturity ? new Date(account.date_of_maturity) : null;
        const isPremature = !maturityDate || today < maturityDate;

        const closure = calculatePrematureClosurePenalty(account);
        const payoutAmount = closure.netAmount;
        const penaltyAmount = closure.penaltyAmount;
        const principalAmount = account.account_amount;

        const member = await MemberModel.findOne({ member_id });
        if (!member) return res.status(404).json({ success: false, message: "Member not found" });

        // Close the account
        account.status = "closed";
        account.date_of_close = today;
        account.account_amount = 0;
        account.premature_closure_applied = isPremature;
        account.premature_closure_penalty = isPremature ? penaltyAmount : 0;
        account.interest_amount = closure.interestEarned;
        account.net_amount = payoutAmount;
        account.last_transaction_date = today;
        await account.save();

        // Create transaction record for closure payout
        const txId = await generateTransactionId();
        const closureTx = await TransactionModel.create({
            transaction_id: txId,
            transaction_date: today,
            member_id,
            account_number: account.account_no,
            account_type: account.account_type,
            transaction_type: isPremature ? "Premature Closure" : "Maturity Closure",
            description: description || `${isPremature ? 'Premature' : 'Maturity'} closure of ${groupName} account ${account.account_no}` +
                (isPremature ? `. Penalty: ₹${penaltyAmount.toFixed(2)} (Rate reduced to ${closure.revisedInterestRate}%)` : ""),
            credit: 0,
            debit: payoutAmount,
            balance: 0,
            status: "Completed",
            reference_no: reference_no || txId,
            Name: member.name,
            mobileno: member.contactno,
        });

        // Create cash transaction record
        const count = await CashTransactionModel.countDocuments();
        const cash_transaction_id = `CASH${String(count + 1).padStart(4, '0')}`;
        await CashTransactionModel.create({
            cash_transaction_id,
            transaction_date: today,
            description: description || `Account closure payout – ${account.account_no}`,
            reference_no: reference_no || txId,
            credit: 0,
            debit: payoutAmount,
            voucher_no: voucher_no || cash_transaction_id,
            branch_id,
            status: "active"
        });

        return res.status(200).json({
            success: true,
            message: isPremature
                ? `Premature closure processed. Penalty of ₹${penaltyAmount.toFixed(2)} applied. Net payout: ₹${payoutAmount.toFixed(2)}`
                : `Account closed at maturity. Net payout: ₹${payoutAmount.toFixed(2)}`,
            data: {
                account_no: account.account_no,
                principal: principalAmount,
                interest_earned: closure.interestEarned,
                penalty_applied: isPremature ? penaltyAmount : 0,
                net_payout: payoutAmount,
                revised_interest_rate: isPremature ? closure.revisedInterestRate : account.interest_rate,
                elapsed_months: closure.elapsedMonths,
                transaction_id: txId,
                is_premature: isPremature,
            }
        });
    } catch (error) {
        console.error("Error in prematureClosureAccount:", error);
        return res.status(500).json({ success: false, message: "Failed to process closure", error: error.message });
    }
};

/**
 * Preview Premature Closure calculation without executing
 */
const previewPrematureClosure = async (req, res) => {
    try {
        const account_id = req.query.account_id || req.params.account_id || req.body.account_id;
        if (!account_id) {
            return res.status(400).json({ success: false, message: "account_id is required" });
        }

        const account = await AccountsModel.findOne({
            $or: [{ account_id }, { account_no: account_id }]
        });
        if (!account) return res.status(404).json({ success: false, message: "Account not found" });

        const accountGroup = await AccountGroupModel.findOne({ account_group_id: account.account_type });
        const groupName = ((accountGroup && accountGroup.account_group_name) || "").toUpperCase();

        if (!isFdGroup(groupName) && !isRdGroup(groupName)) {
            return res.status(400).json({
                success: false,
                message: "Premature closure calculation is only applicable for FD and RD accounts."
            });
        }

        const today = new Date();
        const maturityDate = account.date_of_maturity ? new Date(account.date_of_maturity) : null;
        const isPremature = !maturityDate || today < maturityDate;

        const closure = calculatePrematureClosurePenalty(account);

        return res.status(200).json({
            success: true,
            data: {
                account_id: account.account_id,
                account_no: account.account_no,
                account_type: groupName,
                status: account.status,
                principal_deposit: account.account_amount,
                contract_interest_rate: account.interest_rate,
                revised_interest_rate: isPremature ? closure.revisedInterestRate : account.interest_rate,
                date_of_opening: account.date_of_opening,
                date_of_maturity: account.date_of_maturity,
                total_tenure_months: closure.totalTenureMonths,
                elapsed_months: closure.elapsedMonths,
                is_premature: isPremature,
                interest_earned: closure.interestEarned,
                penalty_amount: isPremature ? closure.penaltyAmount : 0,
                net_payout: closure.netAmount
            }
        });
    } catch (error) {
        console.error("Error in previewPrematureClosure:", error);
        return res.status(500).json({ success: false, message: "Failed to calculate preview", error: error.message });
    }
};

module.exports = {
    getAllCashTransactions,
    getCashTransactionById,
    createCashTransaction,
    deleteCashTransaction,
    createMaturityPayment,
    prematureClosureAccount,
    previewPrematureClosure,
};

