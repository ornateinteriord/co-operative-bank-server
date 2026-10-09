const express = require("express");
const router = express.Router();
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");
const { getMemberById } = require("../controllers/Admin/Member");
const { getMyAccounts, getMyLoans, updateMyProfile, getMemberBasicInfo, getMemberAccountsPublic, getMemberTransactions, createMemberAccount, getMemberAccountGroups, getMemberInterestsByAccountGroup, setPrimaryAccount } = require("../controllers/Member");

router.get('/get-member/:memberId', Authenticated, authorizeRoles(["USER", "ADMIN", "ADMIN_01"]), getMemberById)

// Member dashboard routes  
router.get('/get-my-accounts', Authenticated, authorizeRoles(["USER"]), getMyAccounts);
router.get('/get-my-loans', Authenticated, authorizeRoles(["USER"]), getMyLoans);
router.post('/create-account', Authenticated, authorizeRoles(["USER"]), createMemberAccount);
router.post('/set-primary-account', Authenticated, authorizeRoles(["USER", "ADMIN", "ADMIN_01", "AGENT"]), setPrimaryAccount);
router.get('/get-account-groups', Authenticated, authorizeRoles(["USER"]), getMemberAccountGroups);
router.get('/get-interests-by-account-group/:account_group_id', Authenticated, authorizeRoles(["USER"]), getMemberInterestsByAccountGroup);

// Update member profile
router.put('/update-profile/:memberId', Authenticated, authorizeRoles(["USER"]), updateMyProfile);

// Transfer-related routes (for recipient lookup)
router.get('/basic-info/:memberId', Authenticated, authorizeRoles(["USER", "ADMIN", "ADMIN_01"]), getMemberBasicInfo);
router.get('/accounts/:memberId', Authenticated, authorizeRoles(["USER", "ADMIN", "ADMIN_01"]), getMemberAccountsPublic);

// Get member transactions (with optional account_type filter)
router.get('/transactions/:memberId', Authenticated, authorizeRoles(["USER"]), getMemberTransactions);

// Member Deposit Certificate & Loan NOC
const { getDepositCertificate, getLoanNOC } = require("../controllers/Admin/Banking/certificateController");
router.get('/certificate/:accountId', Authenticated, authorizeRoles(["USER", "ADMIN", "ADMIN_01"]), getDepositCertificate);
router.get('/loan-noc/:accountId', Authenticated, authorizeRoles(["USER", "ADMIN", "ADMIN_01"]), getLoanNOC);

module.exports = router;