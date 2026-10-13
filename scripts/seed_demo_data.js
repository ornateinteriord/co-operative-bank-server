/**
 * ============================================================================
 * UDUPI CO-OPERATIVE BANK - COMPREHENSIVE DEMO DATA SEED SCRIPT
 * ============================================================================
 * Creates realistic demonstration data for Coastal Karnataka / Udupi region:
 *  - 5 Branches (Udupi Main, Manipal, Kundapura, Mangaluru, Karkala)
 *  - 5 Agents (with login access)
 *  - 8 Members / Users (with realistic profiles, KYC, Nominees, logins)
 *  - Accounts: SB (Savings), CA (Current), FD (Fixed Deposit), RD (Recurring), Pigmy
 *  - Loans: Gold Loan, Agri Loan, Business Loan, Vehicle Loan, Personal Loan
 *  - Passbook Transactions with realistic running balances and descriptions
 * ============================================================================
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BranchModel = require('../models/branch.model');
const AccountGroupModel = require('../models/accountGroup.model');
const AccountBookModel = require('../models/accountBook.model');
const MemberModel = require('../models/member.model');
const AgentModel = require('../models/agent.model');
const AccountsModel = require('../models/accounts.model');
const TransactionModel = require('../models/transaction.model');
const UserModel = require('../models/user.model');
const AdminModel = require('../models/Admin/Admin');

const DEMO_PASSWORD = "password123";

// Helper to generate transaction IDs
let txCounter = Date.now();
const getTxId = () => `TXN_${++txCounter}_${Math.floor(100 + Math.random() * 900)}`;

async function seedData() {
    try {
        console.log("=========================================================");
        console.log("🚀 Starting Udupi Co-operative Bank Demo Data Seeding...");
        console.log("=========================================================\n");

        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not configured in .env file!");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB successfully.\n");

        // ---------------------------------------------------------------------
        // 1. SEED BRANCHES (Coastal Karnataka / Udupi & DK District)
        // ---------------------------------------------------------------------
        console.log("🏦 [1/6] Seeding Branches...");
        const branches = [
            {
                branch_id: "BR001",
                branch_name: "Udupi Main Branch",
                branch_prefix: "UDU",
                door_no: "Door No. 4-2-108",
                address1: "Asha Chandra Trade Center, Ground Floor",
                address2: "Opposite Court Road, Near Kalsanka",
                city: "Udupi",
                state: "Karnataka",
                pincode: 576101,
                phone_number: "+91 820 2521100",
                mobile_no: "9845011001",
                email: "udupi.main@udupibank.co.in",
                status: "active",
                date_of_operation: new Date("2015-04-01")
            },
            {
                branch_id: "BR002",
                branch_name: "Manipal University Branch",
                branch_prefix: "MNP",
                door_no: "Shop No. 12, Commercial Complex",
                address1: "Tiger Circle, End Point Road",
                address2: "Manipal",
                city: "Udupi",
                state: "Karnataka",
                pincode: 576104,
                phone_number: "+91 820 2570400",
                mobile_no: "9845011002",
                email: "manipal@udupibank.co.in",
                status: "active",
                date_of_operation: new Date("2017-06-15")
            },
            {
                branch_id: "BR003",
                branch_name: "Kundapura Town Branch",
                branch_prefix: "KND",
                door_no: "Building No. 18/B",
                address1: "Car Street, Parijatha Circle",
                address2: "Kundapura",
                city: "Kundapura",
                state: "Karnataka",
                pincode: 576201,
                phone_number: "+91 8254 230550",
                mobile_no: "9845011003",
                email: "kundapura@udupibank.co.in",
                status: "active",
                date_of_operation: new Date("2018-09-01")
            },
            {
                branch_id: "BR004",
                branch_name: "Mangaluru Hampankatta Branch",
                branch_prefix: "MNG",
                door_no: "Floor 1, Navabharath Circle",
                address1: "K.S. Rao Road, Hampankatta",
                address2: "Mangaluru",
                city: "Mangaluru",
                state: "Karnataka",
                pincode: 575001,
                phone_number: "+91 824 2445100",
                mobile_no: "9845011004",
                email: "mangaluru@udupibank.co.in",
                status: "active",
                date_of_operation: new Date("2019-11-10")
            },
            {
                branch_id: "BR005",
                branch_name: "Karkala Town Branch",
                branch_prefix: "KKL",
                door_no: "Shop 5, Gomateshwara Complex",
                address1: "Market Road, Near Bus Stand",
                address2: "Karkala",
                city: "Karkala",
                state: "Karnataka",
                pincode: 574104,
                phone_number: "+91 8258 231200",
                mobile_no: "9845011005",
                email: "karkala@udupibank.co.in",
                status: "active",
                date_of_operation: new Date("2020-02-20")
            }
        ];

        for (const b of branches) {
            await BranchModel.findOneAndUpdate(
                { branch_id: b.branch_id },
                { $set: b },
                { upsert: true, new: true }
            );
        }
        console.log(`   ✨ ${branches.length} Branches synced successfully.`);

        // ---------------------------------------------------------------------
        // 2. ENSURE STANDARD ACCOUNT GROUPS EXIST
        // ---------------------------------------------------------------------
        console.log("\n📁 [2/6] Verifying Account Groups...");
        const accountGroups = [
            { account_group_id: "AGP001", account_group_name: "SB", account_book_id: "ABK025" },
            { account_group_id: "AGP002", account_group_name: "CA", account_book_id: "ABK025" },
            { account_group_id: "AGP003", account_group_name: "RD", account_book_id: "ABK011" },
            { account_group_id: "AGP004", account_group_name: "FD", account_book_id: "ABK011" },
            { account_group_id: "AGP005", account_group_name: "PIGMY", account_book_id: "ABK011" },
            { account_group_id: "AGP006", account_group_name: "MIS", account_book_id: "ABK011" },
            { account_group_id: "AGP007", account_group_name: "Gold Loan", account_book_id: "ABK026" },
            { account_group_id: "AGP008", account_group_name: "Vehicle Loan", account_book_id: "ABK026" },
            { account_group_id: "AGP009", account_group_name: "Education Loan", account_book_id: "ABK026" },
            { account_group_id: "AGP010", account_group_name: "Business Loan", account_book_id: "ABK026" },
            { account_group_id: "AGP011", account_group_name: "Mortgage Loan", account_book_id: "ABK026" },
            { account_group_id: "AGP012", account_group_name: "OverDraft", account_book_id: "ABK026" },
            { account_group_id: "AGP013", account_group_name: "Personal Loan", account_book_id: "ABK026" },
            { account_group_id: "AGP014", account_group_name: "Agriculture Loan", account_book_id: "ABK026" },
            { account_group_id: "AGP015", account_group_name: "Pigmi Saving", account_book_id: "ABK011" },
            { account_group_id: "AGP016", account_group_name: "Pigmi Loan", account_book_id: "ABK011" },
            { account_group_id: "AGP017", account_group_name: "Pigmi Gold Loan", account_book_id: "ABK011" },
        ];

        for (const ag of accountGroups) {
            await AccountGroupModel.findOneAndUpdate(
                { account_group_id: ag.account_group_id },
                { $set: { ...ag, status: "active" } },
                { upsert: true, new: true }
            );
        }
        console.log(`   ✨ ${accountGroups.length} Account Groups ready.`);

        // ---------------------------------------------------------------------
        // 3. SEED AGENTS (Coastal Karnataka Field Agents)
        // ---------------------------------------------------------------------
        console.log("\n👨‍💼 [3/6] Seeding Agents...");
        const agents = [
            {
                agent_id: "A20002",
                name: "Suresh Poojary",
                gender: "Male",
                dob: new Date("1985-05-12"),
                address: "Kalsanka Road, Near Krishna Temple, Udupi",
                emailid: "suresh.poojary@udupibank.co.in",
                mobile: "9845112233",
                pan_no: "BKYPP1122K",
                aadharcard_no: "452178965412",
                branch_id: "BR001",
                designation: "Senior Field Agent",
                status: "active",
                role: "AGENT",
                password: DEMO_PASSWORD,
                date_of_joining: new Date("2021-01-10"),
                commission_eligible: true,
                commission_balance: 14500
            },
            {
                agent_id: "A20003",
                name: "Ramesh Acharya",
                gender: "Male",
                dob: new Date("1988-08-22"),
                address: "Tiger Circle, End Point, Manipal",
                emailid: "ramesh.acharya@udupibank.co.in",
                mobile: "9845223344",
                pan_no: "CAYPA3344M",
                aadharcard_no: "563289012345",
                branch_id: "BR002",
                designation: "Pigmy Collection Agent",
                status: "active",
                role: "AGENT",
                password: DEMO_PASSWORD,
                date_of_joining: new Date("2021-06-15"),
                commission_eligible: true,
                commission_balance: 9800
            },
            {
                agent_id: "A20004",
                name: "Manjunath Hegde",
                gender: "Male",
                dob: new Date("1982-11-04"),
                address: "Car Street, Parijatha Circle, Kundapura",
                emailid: "manjunath.hegde@udupibank.co.in",
                mobile: "9845334455",
                pan_no: "DHYPH5566N",
                aadharcard_no: "674390123456",
                branch_id: "BR003",
                designation: "Rural Development Agent",
                status: "active",
                role: "AGENT",
                password: DEMO_PASSWORD,
                date_of_joining: new Date("2020-09-01"),
                commission_eligible: true,
                commission_balance: 18200
            },
            {
                agent_id: "A20005",
                name: "Suma Kulal",
                gender: "Female",
                dob: new Date("1992-03-18"),
                address: "K.S. Rao Road, Hampankatta, Mangaluru",
                emailid: "suma.kulal@udupibank.co.in",
                mobile: "9845445566",
                pan_no: "EKYPK7788P",
                aadharcard_no: "785401234567",
                branch_id: "BR004",
                designation: "Customer Relationship Agent",
                status: "active",
                role: "AGENT",
                password: DEMO_PASSWORD,
                date_of_joining: new Date("2022-03-01"),
                commission_eligible: true,
                commission_balance: 12400
            },
            {
                agent_id: "A20006",
                name: "Venkatesh Bhat",
                gender: "Male",
                dob: new Date("1980-07-29"),
                address: "Market Road, Gomateshwara Complex, Karkala",
                emailid: "venkatesh.bhat@udupibank.co.in",
                mobile: "9845556677",
                pan_no: "FHYPB9900Q",
                aadharcard_no: "896512345678",
                branch_id: "BR005",
                designation: "Branch Development Agent",
                status: "active",
                role: "AGENT",
                password: DEMO_PASSWORD,
                date_of_joining: new Date("2019-10-15"),
                commission_eligible: true,
                commission_balance: 22100
            }
        ];

        for (const ag of agents) {
            await AgentModel.findOneAndUpdate(
                { agent_id: ag.agent_id },
                { $set: ag },
                { upsert: true, new: true }
            );

            // Also ensure UserModel entry exists for Agent login
            await UserModel.findOneAndUpdate(
                { user_id: ag.agent_id },
                {
                    $set: {
                        id: ag.agent_id,
                        user_id: ag.agent_id,
                        user_name: ag.agent_id,
                        reference_id: ag.agent_id,
                        password: DEMO_PASSWORD,
                        user_role: "AGENT",
                        branch_code: ag.branch_id,
                        user_status: "active"
                    }
                },
                { upsert: true, new: true }
            );
        }
        console.log(`   ✨ ${agents.length} Agents created with login ID & password: "${DEMO_PASSWORD}".`);

        // ---------------------------------------------------------------------
        // 4. SEED MEMBERS / USERS (Authentic Karnataka / Udupi People)
        // ---------------------------------------------------------------------
        console.log("\n👥 [4/6] Seeding Members & Login Accounts...");
        const membersData = [
            {
                id: "BMS000101",
                name: "Raghavendra Rao",
                gender: "Male",
                dob: "1987-04-14",
                age: 38,
                father: "Venkataramana Rao",
                mobile: "9845001101",
                email: "raghavendra.rao.udupi@gmail.com",
                door: "Door No. 3-45",
                address: "Sri Krishna Krupa, Kunjibettu, Udupi",
                city: "Udupi",
                state: "Karnataka",
                pincode: "576102",
                pan: "ABCDE1234F",
                aadhaar: "345678901234",
                voter: "KA/12/084/123456",
                occupation: "Senior Software Architect",
                nominee: "Smt. Shailaja Rao",
                nominee_relation: "Wife",
                nominee_age: 34,
                branch: "BR001",
                introducer: "A20002",
                introducer_name: "Suresh Poojary",
            },
            {
                id: "BMS000102",
                name: "Deepa Nayak",
                gender: "Female",
                dob: "1991-08-25",
                age: 34,
                father: "Panduranga Nayak",
                mobile: "9845001102",
                email: "deepa.nayak.edu@gmail.com",
                door: "Flat 202, Brahmagiri Enclave",
                address: "Brahmagiri, Court Back Road, Udupi",
                city: "Udupi",
                state: "Karnataka",
                pincode: "576101",
                pan: "BCDEF2345G",
                aadhaar: "456789012345",
                voter: "KA/12/084/234567",
                occupation: "High School Science Teacher",
                nominee: "Sathish Nayak",
                nominee_relation: "Brother",
                nominee_age: 36,
                branch: "BR001",
                introducer: "A20002",
                introducer_name: "Suresh Poojary",
            },
            {
                id: "BMS000103",
                name: "Ganesh Prasad Shetty",
                gender: "Male",
                dob: "1978-12-10",
                age: 47,
                father: "Mahabala Shetty",
                mobile: "9845001103",
                email: "ganesh.shetty.shirva@gmail.com",
                door: "Ganesh Farmhouse",
                address: "Mattar Road, Shirva, Kaup Taluk",
                city: "Udupi",
                state: "Karnataka",
                pincode: "574116",
                pan: "CDEFG3456H",
                aadhaar: "567890123456",
                voter: "KA/12/085/345678",
                occupation: "Dairy Farmer & Areca Grower",
                nominee: "Sujatha Shetty",
                nominee_relation: "Wife",
                nominee_age: 42,
                branch: "BR001",
                introducer: "A20002",
                introducer_name: "Suresh Poojary",
            },
            {
                id: "BMS000104",
                name: "Ananya Adiga",
                gender: "Female",
                dob: "1994-06-19",
                age: 31,
                father: "Subramanya Adiga",
                mobile: "9845001104",
                email: "ananya.adiga.design@gmail.com",
                door: "Shop 4, Santhekatte Bazaar",
                address: "Santhekatte, Kallianpur Post, Udupi",
                city: "Udupi",
                state: "Karnataka",
                pincode: "576105",
                pan: "DEFGH4567I",
                aadhaar: "678901234567",
                voter: "KA/12/084/456789",
                occupation: "Boutique Owner & Fashion Designer",
                nominee: "Subramanya Adiga",
                nominee_relation: "Father",
                nominee_age: 62,
                branch: "BR002",
                introducer: "A20003",
                introducer_name: "Ramesh Acharya",
            },
            {
                id: "BMS000105",
                name: "Praveen Kumar Poojary",
                gender: "Male",
                dob: "1983-02-05",
                age: 43,
                father: "Soma Poojary",
                mobile: "9845001105",
                email: "praveen.poojary.malpe@gmail.com",
                door: "Fisheries Colony No. 12",
                address: "Near Malpe Fisheries Port, Malpe",
                city: "Udupi",
                state: "Karnataka",
                pincode: "576108",
                pan: "EFGHI5678J",
                aadhaar: "789012345678",
                voter: "KA/12/084/567890",
                occupation: "Marine Fisheries Merchant",
                nominee: "Latha P. Poojary",
                nominee_relation: "Wife",
                nominee_age: 38,
                branch: "BR001",
                introducer: "A20002",
                introducer_name: "Suresh Poojary",
            },
            {
                id: "BMS000106",
                name: "Geetha Kudva",
                gender: "Female",
                dob: "1965-10-30",
                age: 60,
                father: "Narayana Kudva",
                mobile: "9845001106",
                email: "geetha.kudva.karkala@gmail.com",
                door: "House 24, Anekere Road",
                address: "Near Gomateshwara Hill, Karkala",
                city: "Karkala",
                state: "Karnataka",
                pincode: "574104",
                pan: "FGHIJ6789K",
                aadhaar: "890123456789",
                voter: "KA/12/086/678901",
                occupation: "Artisan & Senior Citizen",
                nominee: "Mahesh Kudva",
                nominee_relation: "Son",
                nominee_age: 35,
                branch: "BR005",
                introducer: "A20006",
                introducer_name: "Venkatesh Bhat",
            },
            {
                id: "BMS000107",
                name: "Dinesh Kamath",
                gender: "Male",
                dob: "1985-09-15",
                age: 40,
                father: "Laxman Kamath",
                mobile: "9845001107",
                email: "dinesh.kamath.knd@gmail.com",
                door: "Kamath Complex, Main Road",
                address: "Parijatha Circle, Kundapura",
                city: "Kundapura",
                state: "Karnataka",
                pincode: "576201",
                pan: "GHIJK7890L",
                aadhaar: "901234567890",
                voter: "KA/12/087/789012",
                occupation: "Class-1 Electrical Contractor",
                nominee: "Rashmi Kamath",
                nominee_relation: "Wife",
                nominee_age: 36,
                branch: "BR003",
                introducer: "A20004",
                introducer_name: "Manjunath Hegde",
            },
            {
                id: "BMS000108",
                name: "Ashwath Narayana Bhat",
                gender: "Male",
                dob: "1972-01-20",
                age: 54,
                father: "Subraya Bhat",
                mobile: "9845001108",
                email: "ashwath.bhat.hebri@gmail.com",
                door: "Sri Nilaya, Agumbe Road",
                address: "Hebri Post, Karkala Taluk",
                city: "Hebri",
                state: "Karnataka",
                pincode: "576112",
                pan: "HIJKL8901M",
                aadhaar: "012345678901",
                voter: "KA/12/086/890123",
                occupation: "Spices & Rubber Planter",
                nominee: "Shobha Bhat",
                nominee_relation: "Wife",
                nominee_age: 49,
                branch: "BR005",
                introducer: "A20006",
                introducer_name: "Venkatesh Bhat",
            }
        ];

        for (const m of membersData) {
            const memberDoc = {
                member_id: m.id,
                Member_id: m.id,
                name: m.name,
                Name: m.name,
                gender: m.gender,
                dob: m.dob,
                age: m.age,
                father_name: m.father,
                Father_name: m.father,
                contactno: m.mobile,
                mobileno: m.mobile,
                emailid: m.email,
                email: m.email,
                address: m.address,
                city: m.city,
                state: m.state,
                pincode: m.pincode,
                pan_no: m.pan,
                Pan_no: m.pan,
                aadharcard_no: m.aadhaar,
                voter_id: m.voter,
                occupation: m.occupation,
                nominee: m.nominee,
                Nominee_name: m.nominee,
                relation: m.nominee_relation,
                Nominee_Relation: m.nominee_relation,
                Nominee_age: m.nominee_age,
                branch_id: m.branch,
                introducer: m.introducer,
                introducer_name: m.introducer_name,
                password: DEMO_PASSWORD,
                role: "USER",
                status: "active",
                kycStatus: "APPROVED",
                beneficiaryStatus: "CREATED",
                Date_of_joining: "2023-01-15",
                wallet_balance: 5000,
                commission_eligible: true
            };

            await MemberModel.findOneAndUpdate(
                { $or: [{ member_id: m.id }, { Member_id: m.id }] },
                { $set: memberDoc },
                { upsert: true, new: true }
            );

            // Also upsert UserModel so they can log in via AuthController
            await UserModel.findOneAndUpdate(
                { user_id: m.id },
                {
                    $set: {
                        id: m.id,
                        user_id: m.id,
                        user_name: m.id,
                        reference_id: m.id,
                        password: DEMO_PASSWORD,
                        user_role: "USER",
                        branch_code: m.branch,
                        user_status: "active"
                    }
                },
                { upsert: true, new: true }
            );
        }
        console.log(`   ✨ ${membersData.length} Members created with login ID & password: "${DEMO_PASSWORD}".`);

        // ---------------------------------------------------------------------
        // 5. SEED ACCOUNTS & LOANS (Savings, Current, FD, RD, Pigmy, Loans)
        // ---------------------------------------------------------------------
        console.log("\n💳 [5/6] Seeding Bank Accounts & Loans...");

        // Define Accounts & Loans for each member
        const accountsToCreate = [
            // --- Raghavendra Rao (BMS000101) ---
            {
                account_id: "ACC000101",
                account_no: "SB000101",
                member_id: "BMS000101",
                account_type: "AGP001", // SB
                branch_id: "BR001",
                account_amount: 84500,
                is_primary: true,
                status: "active",
                date_of_opening: new Date("2023-01-20"),
                account_operation: "Single",
                interest_rate: 4.0,
                passbook_notes: "Regular salary account with auto-debit enabled"
            },
            {
                account_id: "ACC000102",
                account_no: "FD000101",
                member_id: "BMS000101",
                account_type: "AGP004", // FD
                branch_id: "BR001",
                account_amount: 200000,
                is_primary: false,
                status: "active",
                date_of_opening: new Date("2023-06-10"),
                duration: 24,
                date_of_maturity: new Date("2025-06-10"),
                interest_rate: 7.5,
                account_operation: "Single",
                passbook_notes: "2-Year Term Fixed Deposit"
            },
            {
                account_id: "ACC000103",
                account_no: "RD000101",
                member_id: "BMS000101",
                account_type: "AGP003", // RD
                branch_id: "BR001",
                account_amount: 30000,
                is_primary: false,
                status: "active",
                date_of_opening: new Date("2024-01-05"),
                duration: 12,
                date_of_maturity: new Date("2025-01-05"),
                interest_rate: 7.25,
                rd_installment_amount: 5000,
                rd_total_installments: 12,
                rd_paid_installments: 6,
                account_operation: "Single",
                passbook_notes: "Monthly RD auto-debited from SB000101"
            },
            {
                account_id: "LOAN000101",
                account_no: "GL000101",
                member_id: "BMS000101",
                account_type: "AGP007", // Gold Loan
                branch_id: "BR001",
                account_amount: 150000,
                is_primary: false,
                status: "active",
                date_of_opening: new Date("2024-04-10"),
                duration: 12,
                date_of_maturity: new Date("2025-04-10"),
                interest_rate: 9.5,
                loan_disbursed_to: "SB000101",
                disbursed_at: new Date("2024-04-10"),
                account_operation: "Single",
                passbook_notes: "22K Gold ornaments pledged (approx 48 grams)"
            },

            // --- Deepa Nayak (BMS000102) ---
            {
                account_id: "ACC000104",
                account_no: "SB000102",
                member_id: "BMS000102",
                account_type: "AGP001", // SB
                branch_id: "BR001",
                account_amount: 42300,
                is_primary: true,
                status: "active",
                date_of_opening: new Date("2023-02-15"),
                account_operation: "Single",
                interest_rate: 4.0,
                passbook_notes: "Primary Savings Account"
            },
            {
                account_id: "ACC000105",
                account_no: "RD000102",
                member_id: "BMS000102",
                account_type: "AGP003", // RD
                branch_id: "BR001",
                account_amount: 24000,
                is_primary: false,
                status: "active",
                date_of_opening: new Date("2023-08-01"),
                duration: 24,
                date_of_maturity: new Date("2025-08-01"),
                interest_rate: 7.25,
                rd_installment_amount: 3000,
                rd_total_installments: 24,
                rd_paid_installments: 8,
                account_operation: "Single"
            },
            {
                account_id: "LOAN000102",
                account_no: "VL000102",
                member_id: "BMS000102",
                account_type: "AGP008", // Vehicle Loan
                branch_id: "BR001",
                account_amount: 250000,
                is_primary: false,
                status: "active",
                date_of_opening: new Date("2023-11-20"),
                duration: 36,
                date_of_maturity: new Date("2026-11-20"),
                interest_rate: 9.0,
                loan_disbursed_to: "SB000102",
                disbursed_at: new Date("2023-11-20"),
                account_operation: "Single",
                passbook_notes: "Two-Wheeler EV Loan"
            },

            // --- Ganesh Prasad Shetty (BMS000103) ---
            {
                account_id: "ACC000106",
                account_no: "SB000103",
                member_id: "BMS000103",
                account_type: "AGP001", // SB
                branch_id: "BR001",
                account_amount: 115000,
                is_primary: true,
                status: "active",
                date_of_opening: new Date("2022-11-10"),
                account_operation: "Single",
                interest_rate: 4.0
            },
            {
                account_id: "ACC000107",
                account_no: "FD000102",
                member_id: "BMS000103",
                account_type: "AGP004", // FD
                branch_id: "BR001",
                account_amount: 500000,
                is_primary: false,
                status: "active",
                date_of_opening: new Date("2023-03-15"),
                duration: 36,
                date_of_maturity: new Date("2026-03-15"),
                interest_rate: 7.75,
                account_operation: "Single"
            },
            {
                account_id: "LOAN000103",
                account_no: "AL000103",
                member_id: "BMS000103",
                account_type: "AGP014", // Agriculture Loan
                branch_id: "BR001",
                account_amount: 300000,
                is_primary: false,
                status: "active",
                date_of_opening: new Date("2023-05-10"),
                duration: 24,
                date_of_maturity: new Date("2025-05-10"),
                interest_rate: 7.0, // Subsidized Agri rate
                loan_disbursed_to: "SB000103",
                disbursed_at: new Date("2023-05-10"),
                account_operation: "Single",
                passbook_notes: "Kisan Dairy & Arecanut development facility"
            },

            // --- Ananya Adiga (BMS000104) ---
            {
                account_id: "ACC000108",
                account_no: "SB000104",
                member_id: "BMS000104",
                account_type: "AGP001", // SB
                branch_id: "BR002",
                account_amount: 65200,
                is_primary: true,
                status: "active",
                date_of_opening: new Date("2023-04-12"),
                account_operation: "Single",
                interest_rate: 4.0
            },
            {
                account_id: "ACC000109",
                account_no: "CA000104",
                member_id: "BMS000104",
                account_type: "AGP002", // CA
                branch_id: "BR002",
                account_amount: 150000,
                is_primary: false,
                status: "active",
                date_of_opening: new Date("2023-05-01"),
                account_operation: "Proprietorship",
                passbook_notes: "Ananya Couture Current Account"
            },
            {
                account_id: "ACC000110",
                account_no: "PIG000104",
                member_id: "BMS000104",
                account_type: "AGP005", // PIGMY
                branch_id: "BR002",
                account_amount: 28500,
                is_primary: false,
                status: "active",
                date_of_opening: new Date("2024-01-15"),
                duration: 12,
                assigned_to: "A20003", // Ramesh Acharya
                account_operation: "Single",
                passbook_notes: "Daily Pigmy collection ₹300/day"
            },

            // --- Praveen Kumar Poojary (BMS000105) ---
            {
                account_id: "ACC000111",
                account_no: "SB000105",
                member_id: "BMS000105",
                account_type: "AGP001", // SB
                branch_id: "BR001",
                account_amount: 240000,
                is_primary: true,
                status: "active",
                date_of_opening: new Date("2022-08-20"),
                account_operation: "Single",
                interest_rate: 4.0
            },
            {
                account_id: "ACC000112",
                account_no: "CA000105",
                member_id: "BMS000105",
                account_type: "AGP002", // CA
                branch_id: "BR001",
                account_amount: 485000,
                is_primary: false,
                status: "active",
                date_of_opening: new Date("2022-09-01"),
                account_operation: "Business",
                passbook_notes: "Malpe Coastal Marine Exports"
            },
            {
                account_id: "LOAN000104",
                account_no: "PL000105",
                member_id: "BMS000105",
                account_type: "AGP013", // Personal Loan
                branch_id: "BR001",
                account_amount: 100000,
                is_primary: false,
                status: "active",
                date_of_opening: new Date("2024-02-14"),
                duration: 12,
                date_of_maturity: new Date("2025-02-14"),
                interest_rate: 12.0,
                loan_disbursed_to: "SB000105",
                disbursed_at: new Date("2024-02-14"),
                account_operation: "Single"
            },

            // --- Geetha Kudva (BMS000106 - Senior Citizen) ---
            {
                account_id: "ACC000113",
                account_no: "SB000106",
                member_id: "BMS000106",
                account_type: "AGP001", // SB
                branch_id: "BR005",
                account_amount: 35800,
                is_primary: true,
                status: "active",
                date_of_opening: new Date("2023-03-10"),
                account_operation: "Single",
                interest_rate: 4.5 // Senior citizen SB bonus
            },
            {
                account_id: "ACC000114",
                account_no: "FD000103",
                member_id: "BMS000106",
                account_type: "AGP004", // FD
                branch_id: "BR005",
                account_amount: 100000,
                is_primary: false,
                status: "active",
                date_of_opening: new Date("2023-04-01"),
                duration: 12,
                date_of_maturity: new Date("2024-04-01"),
                interest_rate: 8.25, // Senior citizen FD rate
                account_operation: "Single"
            },

            // --- Dinesh Kamath (BMS000107) ---
            {
                account_id: "ACC000115",
                account_no: "SB000107",
                member_id: "BMS000107",
                account_type: "AGP001", // SB
                branch_id: "BR003",
                account_amount: 95000,
                is_primary: true,
                status: "active",
                date_of_opening: new Date("2022-10-05"),
                account_operation: "Single"
            },
            {
                account_id: "ACC000116",
                account_no: "CA000107",
                member_id: "BMS000107",
                account_type: "AGP002", // CA
                branch_id: "BR003",
                account_amount: 210000,
                is_primary: false,
                status: "active",
                date_of_opening: new Date("2022-11-01"),
                account_operation: "Firm"
            },
            {
                account_id: "LOAN000105",
                account_no: "BL000107",
                member_id: "BMS000107",
                account_type: "AGP010", // Business Loan
                branch_id: "BR003",
                account_amount: 500000,
                is_primary: false,
                status: "active",
                date_of_opening: new Date("2023-07-20"),
                duration: 36,
                date_of_maturity: new Date("2026-07-20"),
                interest_rate: 11.5,
                loan_disbursed_to: "SB000107",
                disbursed_at: new Date("2023-07-20"),
                account_operation: "Business",
                passbook_notes: "Commercial working capital expansion"
            },

            // --- Ashwath Narayana Bhat (BMS000108) ---
            {
                account_id: "ACC000117",
                account_no: "SB000108",
                member_id: "BMS000108",
                account_type: "AGP001", // SB
                branch_id: "BR005",
                account_amount: 180000,
                is_primary: true,
                status: "active",
                date_of_opening: new Date("2021-05-18"),
                account_operation: "Single"
            }
        ];

        for (const acc of accountsToCreate) {
            await AccountsModel.findOneAndUpdate(
                { account_no: acc.account_no },
                { $set: acc },
                { upsert: true, new: true }
            );

            // If marked primary, update member's primary_account_no
            if (acc.is_primary) {
                await MemberModel.findOneAndUpdate(
                    { $or: [{ member_id: acc.member_id }, { Member_id: acc.member_id }] },
                    { $set: { primary_account_no: acc.account_no } }
                );
            }
        }
        console.log(`   ✨ ${accountsToCreate.length} Accounts & Loans created.`);

        // ---------------------------------------------------------------------
        // 6. SEED REALISTIC PASSBOOK & BANK TRANSACTIONS
        // ---------------------------------------------------------------------
        console.log("\n📖 [6/6] Generating Rich Passbook Transactions with Running Balances...");

        // Clear existing demo transactions for these demo accounts to ensure clean calculation
        const demoAccountNos = accountsToCreate.map(a => a.account_no);
        await TransactionModel.deleteMany({ account_number: { $in: demoAccountNos } });

        // Helper to insert an ordered ledger of transactions for an account
        const generateAccountLedger = async ({ memberId, memberName, mobile, accountNo, accountType, initialBalance, items }) => {
            let runningBalance = initialBalance;
            const records = [];

            for (const item of items) {
                const credit = item.credit || 0;
                const debit = item.debit || 0;
                runningBalance = runningBalance + credit - debit;

                const transId = getTxId();
                records.push({
                    transaction_id: transId,
                    transaction_date: item.date,
                    createdAt: item.date,
                    member_id: memberId,
                    account_number: accountNo,
                    account_type: accountType,
                    transaction_type: item.type,
                    description: item.desc,
                    credit: credit,
                    debit: debit,
                    balance: Math.round(runningBalance * 100) / 100,
                    Name: memberName,
                    mobileno: mobile,
                    status: "Completed",
                    reference_no: item.ref || `REF${Math.floor(100000 + Math.random() * 900000)}`,
                    collected_by: item.collected_by || "System",
                    paid_by: item.paid_by || memberName,
                    benefit_type: "direct"
                });
            }

            if (records.length > 0) {
                await TransactionModel.insertMany(records);
            }

            // Sync account_amount with final balance
            await AccountsModel.findOneAndUpdate(
                { account_no: accountNo },
                { $set: { account_amount: Math.round(runningBalance * 100) / 100, last_transaction_date: items[items.length - 1]?.date || new Date() } }
            );

            return records.length;
        };

        // --- Ledger 1: Raghavendra Rao - Primary SB Account (SB000101) ---
        const sb000101Items = [
            {
                date: new Date("2024-01-01T10:30:00Z"),
                type: "Account Opening",
                desc: "INITIAL ACCOUNT OPENING DEPOSIT - CASH",
                credit: 10000,
                debit: 0,
                ref: "CSH/BR001/0142",
                collected_by: "Udupi Cash Counter"
            },
            {
                date: new Date("2024-01-05T14:15:00Z"),
                type: "Salary Credit",
                desc: "SALARY CREDIT - ROBOSOFT TECHNOLOGIES UDUPI",
                credit: 95000,
                debit: 0,
                ref: "NEFT/ROBO/20240105",
                collected_by: "System"
            },
            {
                date: new Date("2024-01-08T18:40:00Z"),
                type: "UPI Transfer",
                desc: "UPI/GPAY TO SRI KRISHNA MATHA SEVA FUND",
                credit: 0,
                debit: 5000,
                ref: "UPI/400819283719"
            },
            {
                date: new Date("2024-01-15T11:20:00Z"),
                type: "Utility Bill",
                desc: "MESCOM ELECTRICITY BILL PAYMENT - UDUPI SUB-DIV",
                credit: 0,
                debit: 2450,
                ref: "BBPS/MESCOM/98124"
            },
            {
                date: new Date("2024-01-20T16:05:00Z"),
                type: "ATM Cash Withdrawal",
                desc: "ATM CASH WITHDRAWAL - KALSANKA UDUPI ATM",
                credit: 0,
                debit: 10000,
                ref: "ATM/UDU/8812"
            },
            {
                date: new Date("2024-02-05T10:00:00Z"),
                type: "Salary Credit",
                desc: "SALARY CREDIT - ROBOSOFT TECHNOLOGIES UDUPI",
                credit: 95000,
                debit: 0,
                ref: "NEFT/ROBO/20240205"
            },
            {
                date: new Date("2024-02-12T13:30:00Z"),
                type: "UPI Transfer",
                desc: "UPI/DIANA RESTAURANT UDUPI - FOOD BILL",
                credit: 0,
                debit: 1850,
                ref: "UPI/404312891234"
            },
            {
                date: new Date("2024-02-28T17:15:00Z"),
                type: "Transfer",
                desc: "TRANSFER TO MONTHLY RD ACCOUNT RD000101",
                credit: 0,
                debit: 5000,
                ref: "INT/TRF/RD000101"
            },
            {
                date: new Date("2024-03-31T20:00:00Z"),
                type: "Interest Credit",
                desc: "QUARTERLY SAVINGS BANK INTEREST CREDIT Q4 23-24",
                credit: 1250,
                debit: 0,
                ref: "SYS/SB/INT/Q4"
            },
            {
                date: new Date("2024-04-10T11:30:00Z"),
                type: "Loan Disbursement",
                desc: "LOAN DISBURSEMENT CREDITED FROM GL000101 (Gold Loan)",
                credit: 150000,
                debit: 0,
                ref: "LN/DISB/GL000101",
                collected_by: "Branch Loan Officer"
            },
            {
                date: new Date("2024-04-15T15:00:00Z"),
                type: "RTGS Transfer",
                desc: "RTGS OUTWARD - HOME RENOVATION CONTRACTOR UDUPI",
                credit: 0,
                debit: 140000,
                ref: "RTGS/BMS/20240415"
            },
            {
                date: new Date("2024-05-10T12:00:00Z"),
                type: "Loan Repayment",
                desc: "MONTHLY EMI REPAYMENT DEBITED - GOLD LOAN GL000101",
                credit: 0,
                debit: 13150,
                ref: "EMI/GL000101/M1"
            },
            {
                date: new Date("2024-06-10T12:00:00Z"),
                type: "Loan Repayment",
                desc: "MONTHLY EMI REPAYMENT DEBITED - GOLD LOAN GL000101",
                credit: 0,
                debit: 13150,
                ref: "EMI/GL000101/M2"
            },
            {
                date: new Date("2024-06-30T20:00:00Z"),
                type: "Interest Credit",
                desc: "QUARTERLY SAVINGS BANK INTEREST CREDIT Q1 24-25",
                credit: 1450,
                debit: 0,
                ref: "SYS/SB/INT/Q1"
            },
            {
                date: new Date("2024-07-10T12:00:00Z"),
                type: "Loan Repayment",
                desc: "MONTHLY EMI REPAYMENT DEBITED - GOLD LOAN GL000101",
                credit: 0,
                debit: 13150,
                ref: "EMI/GL000101/M3"
            },
            {
                date: new Date("2024-08-05T10:15:00Z"),
                type: "Cash Deposit",
                desc: "CASH DEPOSIT AT UDUPI MAIN BRANCH COUNTER",
                credit: 25000,
                debit: 0,
                ref: "CSH/BR001/0891",
                collected_by: "Suresh Poojary"
            },
            {
                date: new Date("2024-09-01T14:20:00Z"),
                type: "UPI Transfer",
                desc: "UPI/BIG MISHRA PEDHA UDUPI - FESTIVAL SWEETS",
                credit: 0,
                debit: 3450,
                ref: "UPI/424519082341"
            }
        ];

        const count1 = await generateAccountLedger({
            memberId: "BMS000101",
            memberName: "Raghavendra Rao",
            mobile: "9845001101",
            accountNo: "SB000101",
            accountType: "AGP001",
            initialBalance: 0,
            items: sb000101Items
        });
        console.log(`   ✨ Generated ${count1} transactions for Raghavendra Rao (SB000101)`);

        // --- Ledger 2: Gold Loan Account for Raghavendra Rao (GL000101) ---
        const gl000101Items = [
            {
                date: new Date("2024-04-10T11:30:00Z"),
                type: "Loan Sanction",
                desc: "GOLD LOAN SANCTIONED - PLEDGE 48G 22KT ORNAMENTS",
                credit: 150000,
                debit: 0,
                ref: "GL/SANC/00101"
            },
            {
                date: new Date("2024-05-10T12:00:00Z"),
                type: "Loan Repayment",
                desc: "MONTHLY EMI REPAYMENT - INSTALMENT 1/12 RECEIVED",
                credit: 13150,
                debit: 0,
                ref: "EMI/GL000101/M1"
            },
            {
                date: new Date("2024-06-10T12:00:00Z"),
                type: "Loan Repayment",
                desc: "MONTHLY EMI REPAYMENT - INSTALMENT 2/12 RECEIVED",
                credit: 13150,
                debit: 0,
                ref: "EMI/GL000101/M2"
            },
            {
                date: new Date("2024-07-10T12:00:00Z"),
                type: "Loan Repayment",
                desc: "MONTHLY EMI REPAYMENT - INSTALMENT 3/12 RECEIVED",
                credit: 13150,
                debit: 0,
                ref: "EMI/GL000101/M3"
            }
        ];

        for (const item of gl000101Items) {
            await TransactionModel.create({
                transaction_id: getTxId(),
                transaction_date: item.date,
                createdAt: item.date,
                member_id: "BMS000101",
                account_number: "GL000101",
                account_type: "AGP007",
                transaction_type: item.type,
                description: item.desc,
                credit: item.credit,
                debit: item.debit || 0,
                balance: 150000 - (item.type === "Loan Repayment" ? item.credit : 0),
                Name: "Raghavendra Rao",
                mobileno: "9845001101",
                status: "Completed",
                reference_no: item.ref,
                is_loan_repayment: item.type === "Loan Repayment"
            });
        }
        console.log(`   ✨ Generated Gold Loan transactions for GL000101`);

        // --- Ledger 3: Deepa Nayak - Primary SB Account (SB000102) ---
        const sb000102Items = [
            {
                date: new Date("2024-01-10T10:00:00Z"),
                type: "Account Opening",
                desc: "INITIAL ACCOUNT OPENING DEPOSIT",
                credit: 5000,
                debit: 0,
                ref: "CSH/BR001/0210"
            },
            {
                date: new Date("2024-01-25T15:30:00Z"),
                type: "Salary Credit",
                desc: "TEACHER SALARY CREDIT - GOVT HIGH SCHOOL UDUPI",
                credit: 48000,
                debit: 0,
                ref: "TREASURY/EDU/202401"
            },
            {
                date: new Date("2024-02-02T11:45:00Z"),
                type: "UPI Transfer",
                desc: "UPI/MORE SUPERMARKET UDUPI - GROCERIES",
                credit: 0,
                debit: 4200,
                ref: "UPI/403310928341"
            },
            {
                date: new Date("2024-02-15T16:00:00Z"),
                type: "Transfer",
                desc: "MONTHLY RD CONTRIBUTION TO RD000102",
                credit: 0,
                debit: 3000,
                ref: "TRF/RD000102"
            },
            {
                date: new Date("2024-02-25T15:30:00Z"),
                type: "Salary Credit",
                desc: "TEACHER SALARY CREDIT - GOVT HIGH SCHOOL UDUPI",
                credit: 48000,
                debit: 0,
                ref: "TREASURY/EDU/202402"
            },
            {
                date: new Date("2024-03-05T14:10:00Z"),
                type: "Loan Repayment",
                desc: "VEHICLE LOAN EMI AUTO-DEBIT - VL000102",
                credit: 0,
                debit: 7950,
                ref: "EMI/VL000102"
            },
            {
                date: new Date("2024-03-31T20:00:00Z"),
                type: "Interest Credit",
                desc: "QUARTERLY SAVINGS BANK INTEREST CREDIT",
                credit: 680,
                debit: 0,
                ref: "SYS/SB/INT/Q4"
            },
            {
                date: new Date("2024-04-05T14:10:00Z"),
                type: "Loan Repayment",
                desc: "VEHICLE LOAN EMI AUTO-DEBIT - VL000102",
                credit: 0,
                debit: 7950,
                ref: "EMI/VL000102"
            },
            {
                date: new Date("2024-05-05T14:10:00Z"),
                type: "Loan Repayment",
                desc: "VEHICLE LOAN EMI AUTO-DEBIT - VL000102",
                credit: 0,
                debit: 7950,
                ref: "EMI/VL000102"
            },
            {
                date: new Date("2024-06-05T14:10:00Z"),
                type: "Loan Repayment",
                desc: "VEHICLE LOAN EMI AUTO-DEBIT - VL000102",
                credit: 0,
                debit: 7950,
                ref: "EMI/VL000102"
            },
            {
                date: new Date("2024-07-20T17:00:00Z"),
                type: "Cash Deposit",
                desc: "CASH DEPOSIT BY BROTHER SATHISH NAYAK",
                credit: 20000,
                debit: 0,
                ref: "CSH/BR001/0955",
                collected_by: "Suresh Poojary"
            }
        ];

        const count2 = await generateAccountLedger({
            memberId: "BMS000102",
            memberName: "Deepa Nayak",
            mobile: "9845001102",
            accountNo: "SB000102",
            accountType: "AGP001",
            initialBalance: 0,
            items: sb000102Items
        });
        console.log(`   ✨ Generated ${count2} transactions for Deepa Nayak (SB000102)`);

        // --- Ledger 4: Ganesh Prasad Shetty - Agri & Savings (SB000103) ---
        const sb000103Items = [
            {
                date: new Date("2024-01-15T11:00:00Z"),
                type: "Account Opening",
                desc: "INITIAL ACCOUNT OPENING - AGRICULTURAL SAVINGS",
                credit: 25000,
                debit: 0,
                ref: "CSH/BR001/0312"
            },
            {
                date: new Date("2024-02-10T14:00:00Z"),
                type: "Milk Union Credit",
                desc: "DAIRY PROCEEDS CREDIT - D.K. CO-OPERATIVE MILK UNION (NANDINI)",
                credit: 42500,
                debit: 0,
                ref: "NEFT/DKMUL/202402"
            },
            {
                date: new Date("2024-03-01T10:15:00Z"),
                type: "Areca Sale",
                desc: "ARECANUT HARVEST SALE PROCEEDS - CAMPCO LTD MANGALURU",
                credit: 125000,
                debit: 0,
                ref: "RTGS/CAMPCO/88912"
            },
            {
                date: new Date("2024-03-20T16:30:00Z"),
                type: "Cash Withdrawal",
                desc: "CASH WITHDRAWAL FOR FERTILIZERS & LABOUR WAGES",
                credit: 0,
                debit: 35000,
                ref: "WDL/BR001/0451",
                collected_by: "Suresh Poojary"
            },
            {
                date: new Date("2024-04-10T14:00:00Z"),
                type: "Milk Union Credit",
                desc: "DAIRY PROCEEDS CREDIT - D.K. CO-OPERATIVE MILK UNION (NANDINI)",
                credit: 38200,
                debit: 0,
                ref: "NEFT/DKMUL/202404"
            },
            {
                date: new Date("2024-05-15T12:00:00Z"),
                type: "Loan Repayment",
                desc: "AGRICULTURE LOAN HALF-YEARLY INTEREST & PRINCIPAL - AL000103",
                credit: 0,
                debit: 26000,
                ref: "EMI/AL000103"
            },
            {
                date: new Date("2024-06-30T20:00:00Z"),
                type: "Interest Credit",
                desc: "QUARTERLY SAVINGS BANK INTEREST CREDIT",
                credit: 1850,
                debit: 0,
                ref: "SYS/SB/INT/Q1"
            }
        ];

        const count3 = await generateAccountLedger({
            memberId: "BMS000103",
            memberName: "Ganesh Prasad Shetty",
            mobile: "9845001103",
            accountNo: "SB000103",
            accountType: "AGP001",
            initialBalance: 0,
            items: sb000103Items
        });
        console.log(`   ✨ Generated ${count3} transactions for Ganesh Prasad Shetty (SB000103)`);

        // --- Ledger 5: Ananya Adiga - Pigmy Daily Deposit (PIG000104) ---
        const pig000104Items = [
            {
                date: new Date("2024-05-01T17:00:00Z"),
                type: "Pigmy Collection",
                desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)",
                credit: 300,
                debit: 0,
                ref: "PIG/001/DAY01",
                collected_by: "Ramesh Acharya"
            },
            {
                date: new Date("2024-05-02T17:00:00Z"),
                type: "Pigmy Collection",
                desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)",
                credit: 300,
                debit: 0,
                ref: "PIG/001/DAY02",
                collected_by: "Ramesh Acharya"
            },
            {
                date: new Date("2024-05-03T17:00:00Z"),
                type: "Pigmy Collection",
                desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)",
                credit: 300,
                debit: 0,
                ref: "PIG/001/DAY03",
                collected_by: "Ramesh Acharya"
            },
            {
                date: new Date("2024-05-04T17:00:00Z"),
                type: "Pigmy Collection",
                desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)",
                credit: 300,
                debit: 0,
                ref: "PIG/001/DAY04",
                collected_by: "Ramesh Acharya"
            },
            {
                date: new Date("2024-05-05T17:00:00Z"),
                type: "Pigmy Collection",
                desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)",
                credit: 500,
                debit: 0,
                ref: "PIG/001/DAY05",
                collected_by: "Ramesh Acharya"
            },
            {
                date: new Date("2024-05-06T17:00:00Z"),
                type: "Pigmy Collection",
                desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)",
                credit: 300,
                debit: 0,
                ref: "PIG/001/DAY06",
                collected_by: "Ramesh Acharya"
            },
            {
                date: new Date("2024-05-07T17:00:00Z"),
                type: "Pigmy Collection",
                desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)",
                credit: 300,
                debit: 0,
                ref: "PIG/001/DAY07",
                collected_by: "Ramesh Acharya"
            },
            {
                date: new Date("2024-05-08T17:00:00Z"),
                type: "Pigmy Collection",
                desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)",
                credit: 300,
                debit: 0,
                ref: "PIG/001/DAY08",
                collected_by: "Ramesh Acharya"
            },
            {
                date: new Date("2024-05-09T17:00:00Z"),
                type: "Pigmy Collection",
                desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)",
                credit: 300,
                debit: 0,
                ref: "PIG/001/DAY09",
                collected_by: "Ramesh Acharya"
            },
            {
                date: new Date("2024-05-10T17:00:00Z"),
                type: "Pigmy Collection",
                desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)",
                credit: 1000,
                debit: 0,
                ref: "PIG/001/DAY10",
                collected_by: "Ramesh Acharya"
            }
        ];

        const count4 = await generateAccountLedger({
            memberId: "BMS000104",
            memberName: "Ananya Adiga",
            mobile: "9845001104",
            accountNo: "PIG000104",
            accountType: "AGP005",
            initialBalance: 24600,
            items: pig000104Items
        });
        console.log(`   ✨ Generated ${count4} daily Pigmy transactions for Ananya Adiga (PIG000104)`);

        // --- Ledger 6: Praveen Kumar Poojary - Current Account (CA000105) ---
        const ca000105Items = [
            {
                date: new Date("2024-01-05T09:30:00Z"),
                type: "Current Deposit",
                desc: "EXPORT FISH CONSIGNMENT PAYMENT - GOA HARBOUR DEALER",
                credit: 250000,
                debit: 0,
                ref: "RTGS/GOA/20240105"
            },
            {
                date: new Date("2024-01-18T14:20:00Z"),
                type: "Cheque Clearing",
                desc: "DIESEL FUEL PAYMENT - MALPE PORT FUEL OUTLET CHQ #77281",
                credit: 0,
                debit: 85000,
                ref: "CHQ/77281"
            },
            {
                date: new Date("2024-02-01T11:00:00Z"),
                type: "Current Deposit",
                desc: "SEAFOOD EXPORT SETTLEMENT - COCHIN SEAFOODS LTD",
                credit: 380000,
                debit: 0,
                ref: "NEFT/COCHIN/8912"
            },
            {
                date: new Date("2024-02-15T16:45:00Z"),
                type: "Cheque Clearing",
                desc: "BOAT MAINTENANCE & NET REPAIR CHQ #77282",
                credit: 0,
                debit: 60000,
                ref: "CHQ/77282"
            }
        ];

        const count5 = await generateAccountLedger({
            memberId: "BMS000105",
            memberName: "Praveen Kumar Poojary",
            mobile: "9845001105",
            accountNo: "CA000105",
            accountType: "AGP002",
            initialBalance: 0,
            items: ca000105Items
        });
        console.log(`   ✨ Generated ${count5} Current Account transactions for Praveen Poojary (CA000105)`);

        // ---------------------------------------------------------------------
        // SUMMARY & CREDENTIALS
        // ---------------------------------------------------------------------
        console.log("\n=========================================================");
        console.log("🎉 DEMO DATA SEEDED SUCCESSFULLY FOR UDUPI CO-OP BANK!");
        console.log("=========================================================");
        console.log("\n📋 DEMO LOGIN CREDENTIALS:\n");
        console.log("🔹 ADMIN LOGIN:");
        console.log("   Username : admin");
        console.log("   Password : admin123 (or existing admin password)");
        console.log("   Role     : ADMIN\n");

        console.log("🔹 FIELD AGENT LOGINS (Password: password123):");
        console.log("   1. Suresh Poojary    | Agent ID: A20002 | Branch: Udupi Main  | Mobile: 9845112233");
        console.log("   2. Ramesh Acharya    | Agent ID: A20003 | Branch: Manipal     | Mobile: 9845223344 (Pigmy Agent)");
        console.log("   3. Manjunath Hegde   | Agent ID: A20004 | Branch: Kundapura   | Mobile: 9845334455");
        console.log("   4. Suma Kulal        | Agent ID: A20005 | Branch: Mangaluru   | Mobile: 9845445566");
        console.log("   5. Venkatesh Bhat    | Agent ID: A20006 | Branch: Karkala     | Mobile: 9845556677\n");

        console.log("🔹 MEMBER / USER LOGINS (Password: password123):");
        console.log("   1. Raghavendra Rao   | Member ID: BMS000101 | SB: SB000101 | Loans: GL000101 (Gold Loan)  | FD: FD000101 | RD: RD000101");
        console.log("   2. Deepa Nayak       | Member ID: BMS000102 | SB: SB000102 | Loans: VL000102 (Vehicle)    | RD: RD000102");
        console.log("   3. Ganesh P. Shetty  | Member ID: BMS000103 | SB: SB000103 | Loans: AL000103 (Agri Loan)  | FD: FD000102");
        console.log("   4. Ananya Adiga      | Member ID: BMS000104 | SB: SB000104 | CA: CA000104                 | Pigmy: PIG000104");
        console.log("   5. Praveen K Poojary | Member ID: BMS000105 | SB: SB000105 | CA: CA000105                 | Loans: PL000105 (Personal)");
        console.log("   6. Geetha Kudva      | Member ID: BMS000106 | SB: SB000106 | FD: FD000103 (Senior Citizen)");
        console.log("   7. Dinesh Kamath     | Member ID: BMS000107 | SB: SB000107 | CA: CA000107                 | Loans: BL000107 (Business)");
        console.log("   8. Ashwath N. Bhat   | Member ID: BMS000108 | SB: SB000108");
        console.log("\n=========================================================");

        await mongoose.disconnect();
        console.log("✅ MongoDB disconnected cleanly.");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ Error during demo data seeding:", error);
        process.exit(1);
    }
}

seedData();
