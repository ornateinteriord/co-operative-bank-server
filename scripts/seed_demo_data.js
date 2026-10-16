/**
 * ============================================================================
 * UDUPI CO-OPERATIVE BANK - COMPREHENSIVE DEMO DATA SEED SCRIPT (16-25 RECORDS)
 * ============================================================================
 * Generates extensive demonstration data for Coastal Karnataka / Udupi region:
 *  - 5 Branches (Udupi Main, Manipal, Kundapura, Mangaluru, Karkala)
 *  - 8 Field Agents (with login access)
 *  - 25 Members / Users (Complete KYC, Nominee, logins, passwords)
 *  - 50+ Bank Accounts (Savings, Current, Fixed Deposits, Recurring, Pigmy)
 *  - 25 Loans covering all categories (Gold, Agri, Vehicle, Business, Personal,
 *    Mortgage, Education, Overdraft, Pigmy Loan, Pigmy Gold Loan)
 *  - Hundreds of Passbook Transactions with precise running balance calculations
 * ============================================================================
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BranchModel = require('../models/branch.model');
const AccountGroupModel = require('../models/accountGroup.model');
const MemberModel = require('../models/member.model');
const AgentModel = require('../models/agent.model');
const AccountsModel = require('../models/accounts.model');
const TransactionModel = require('../models/transaction.model');
const UserModel = require('../models/user.model');

const DEMO_PASSWORD = "password123";

// Helper to generate transaction IDs
let txCounter = Date.now();
const getTxId = () => `TXN_${++txCounter}_${Math.floor(100 + Math.random() * 900)}`;

async function seedData() {
    try {
        console.log("=====================================================================");
        console.log("🚀 Starting Udupi Co-operative Bank Demo Data Seeding (25 Members)...");
        console.log("=====================================================================\n");

        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not configured in .env file!");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB successfully.\n");

        // ---------------------------------------------------------------------
        // 1. SEED BRANCHES (Coastal Karnataka / Udupi & DK District)
        // ---------------------------------------------------------------------
        console.log("🏦 [1/6] Seeding 5 Branches...");
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
        // 2. VERIFY / SEED ACCOUNT GROUPS
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
        // 3. SEED 8 FIELD AGENTS
        // ---------------------------------------------------------------------
        console.log("\n👨‍💼 [3/6] Seeding 8 Field Agents...");
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
            },
            {
                agent_id: "A20007",
                name: "Divya Shetty",
                gender: "Female",
                dob: new Date("1990-09-14"),
                address: "Main Road, Brahmavara Post, Udupi",
                emailid: "divya.shetty@udupibank.co.in",
                mobile: "9845667788",
                pan_no: "GHYPS1234R",
                aadharcard_no: "907623456789",
                branch_id: "BR001",
                designation: "Women Empowerment & Credit Agent",
                status: "active",
                role: "AGENT",
                password: DEMO_PASSWORD,
                date_of_joining: new Date("2021-08-01"),
                commission_eligible: true,
                commission_balance: 16700
            },
            {
                agent_id: "A20008",
                name: "Chethan Kumar",
                gender: "Male",
                dob: new Date("1986-12-05"),
                address: "Kaup Beach Road, Near Light House, Kaup",
                emailid: "chethan.kumar@udupibank.co.in",
                mobile: "9845778899",
                pan_no: "HHYPK2345S",
                aadharcard_no: "018734567890",
                branch_id: "BR001",
                designation: "Coastal Business Agent",
                status: "active",
                role: "AGENT",
                password: DEMO_PASSWORD,
                date_of_joining: new Date("2020-04-10"),
                commission_eligible: true,
                commission_balance: 13900
            },
            {
                agent_id: "A20009",
                name: "Shailesh Rao",
                gender: "Male",
                dob: new Date("1989-04-20"),
                address: "Byndoor Market Circle, Byndoor",
                emailid: "shailesh.rao@udupibank.co.in",
                mobile: "9845889900",
                pan_no: "IHYPR3456T",
                aadharcard_no: "129845678901",
                branch_id: "BR003",
                designation: "Agri Credit Agent",
                status: "active",
                role: "AGENT",
                password: DEMO_PASSWORD,
                date_of_joining: new Date("2022-01-15"),
                commission_eligible: true,
                commission_balance: 11200
            }
        ];

        for (const ag of agents) {
            await AgentModel.findOneAndUpdate(
                { agent_id: ag.agent_id },
                { $set: ag },
                { upsert: true, new: true }
            );

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
        console.log(`   ✨ ${agents.length} Agents synced with password "${DEMO_PASSWORD}".`);

        // ---------------------------------------------------------------------
        // 4. SEED 25 MEMBERS / USERS (Authentic Karnataka / Udupi & DK Names)
        // ---------------------------------------------------------------------
        console.log("\n👥 [4/6] Seeding 25 Members & Login Accounts...");
        const rawMembers = [
            {
                id: "BMS000101",
                name: "Raghavendra Rao",
                gender: "Male",
                dob: "1987-04-14",
                age: 38,
                father: "Venkataramana Rao",
                mobile: "9845001101",
                email: "raghavendra.rao.udupi@gmail.com",
                address: "Sri Krishna Krupa, Kunjibettu, Udupi",
                city: "Udupi",
                pincode: "576102",
                pan: "ABCDE1234F",
                aadhaar: "345678901234",
                voter: "KA/12/084/123456",
                occupation: "Senior Software Architect",
                nominee: "Smt. Shailaja Rao",
                relation: "Wife",
                nominee_age: 34,
                branch: "BR001",
                introducer: "A20002"
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
                address: "Flat 202, Brahmagiri Enclave, Brahmagiri, Udupi",
                city: "Udupi",
                pincode: "576101",
                pan: "BCDEF2345G",
                aadhaar: "456789012345",
                voter: "KA/12/084/234567",
                occupation: "High School Science Teacher",
                nominee: "Sathish Nayak",
                relation: "Brother",
                nominee_age: 36,
                branch: "BR001",
                introducer: "A20002"
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
                address: "Ganesh Farmhouse, Mattar Road, Shirva, Kaup",
                city: "Udupi",
                pincode: "574116",
                pan: "CDEFG3456H",
                aadhaar: "567890123456",
                voter: "KA/12/085/345678",
                occupation: "Dairy Farmer & Areca Grower",
                nominee: "Sujatha Shetty",
                relation: "Wife",
                nominee_age: 42,
                branch: "BR001",
                introducer: "A20002"
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
                address: "Shop 4, Santhekatte Bazaar, Santhekatte, Udupi",
                city: "Udupi",
                pincode: "576105",
                pan: "DEFGH4567I",
                aadhaar: "678901234567",
                voter: "KA/12/084/456789",
                occupation: "Boutique Owner & Fashion Designer",
                nominee: "Subramanya Adiga",
                relation: "Father",
                nominee_age: 62,
                branch: "BR002",
                introducer: "A20003"
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
                address: "Fisheries Colony No. 12, Malpe Harbour, Malpe",
                city: "Udupi",
                pincode: "576108",
                pan: "EFGHI5678J",
                aadhaar: "789012345678",
                voter: "KA/12/084/567890",
                occupation: "Marine Fisheries Merchant",
                nominee: "Latha P. Poojary",
                relation: "Wife",
                nominee_age: 38,
                branch: "BR001",
                introducer: "A20002"
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
                address: "House 24, Anekere Road, Near Gomateshwara, Karkala",
                city: "Karkala",
                pincode: "574104",
                pan: "FGHIJ6789K",
                aadhaar: "890123456789",
                voter: "KA/12/086/678901",
                occupation: "Artisan & Senior Citizen",
                nominee: "Mahesh Kudva",
                relation: "Son",
                nominee_age: 35,
                branch: "BR005",
                introducer: "A20006"
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
                address: "Kamath Complex, Parijatha Circle, Kundapura",
                city: "Kundapura",
                pincode: "576201",
                pan: "GHIJK7890L",
                aadhaar: "901234567890",
                voter: "KA/12/087/789012",
                occupation: "Class-1 Electrical Contractor",
                nominee: "Rashmi Kamath",
                relation: "Wife",
                nominee_age: 36,
                branch: "BR003",
                introducer: "A20004"
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
                address: "Sri Nilaya, Agumbe Road, Hebri Post",
                city: "Hebri",
                pincode: "576112",
                pan: "HIJKL8901M",
                aadhaar: "012345678901",
                voter: "KA/12/086/890123",
                occupation: "Spices & Rubber Planter",
                nominee: "Shobha Bhat",
                relation: "Wife",
                nominee_age: 49,
                branch: "BR005",
                introducer: "A20006"
            },
            {
                id: "BMS000109",
                name: "Sneha Suvarna",
                gender: "Female",
                dob: "1989-11-12",
                age: 36,
                father: "Keshava Suvarna",
                mobile: "9845001109",
                email: "sneha.suvarna.mnp@gmail.com",
                address: "Professors Quarters, End Point, Manipal",
                city: "Manipal",
                pincode: "576104",
                pan: "IJKLM9012N",
                aadhaar: "123456789012",
                voter: "KA/12/084/901234",
                occupation: "Associate Professor in Biotechnology",
                nominee: "Rohit Suvarna",
                relation: "Husband",
                nominee_age: 39,
                branch: "BR002",
                introducer: "A20003"
            },
            {
                id: "BMS000110",
                name: "Shridhar Acharya",
                gender: "Male",
                dob: "1975-03-28",
                age: 51,
                father: "Vasudeva Acharya",
                mobile: "9845001110",
                email: "shridhar.acharya.gold@gmail.com",
                address: "Car Street, Near Sanskrit College, Udupi",
                city: "Udupi",
                pincode: "576101",
                pan: "JKLMN0123O",
                aadhaar: "234567890123",
                voter: "KA/12/084/012345",
                occupation: "Traditional Gold & Silver Jeweller",
                nominee: "Vidya Acharya",
                relation: "Wife",
                nominee_age: 46,
                branch: "BR001",
                introducer: "A20002"
            },
            {
                id: "BMS000111",
                name: "Manjula Kulal",
                gender: "Female",
                dob: "1984-07-16",
                age: 41,
                father: "Sheena Kulal",
                mobile: "9845001111",
                email: "manjula.kulal.shg@gmail.com",
                address: "Stree Shakthi Bhavan, Padubidri Market, Padubidri",
                city: "Kaup",
                pincode: "574111",
                pan: "KLMNO1234P",
                aadhaar: "345678901234",
                voter: "KA/12/085/123456",
                occupation: "Self Help Group President & Handloom Weaver",
                nominee: "Ravi Kulal",
                relation: "Husband",
                nominee_age: 44,
                branch: "BR001",
                introducer: "A20008"
            },
            {
                id: "BMS000112",
                name: "Sandeep Mendon",
                gender: "Male",
                dob: "1988-10-08",
                age: 37,
                father: "Babu Mendon",
                mobile: "9845001112",
                email: "sandeep.mendon.fish@gmail.com",
                address: "Gopadi Beach Road, Gopadi Post, Kundapura",
                city: "Kundapura",
                pincode: "576211",
                pan: "LMNOP2345Q",
                aadhaar: "456789012345",
                voter: "KA/12/087/234567",
                occupation: "Mechanized Trawler Owner & Operator",
                nominee: "Mamatha Mendon",
                relation: "Wife",
                nominee_age: 33,
                branch: "BR003",
                introducer: "A20004"
            },
            {
                id: "BMS000113",
                name: "Poornima Hegde",
                gender: "Female",
                dob: "1981-05-22",
                age: 44,
                father: "Ramakrishna Hegde",
                mobile: "9845001113",
                email: "poornima.hegde.edu@gmail.com",
                address: "Kodi Sea Walk Road, Kodi, Kundapura",
                city: "Kundapura",
                pincode: "576261",
                pan: "MNOPQ3456R",
                aadhaar: "567890123456",
                voter: "KA/12/087/345678",
                occupation: "Govt School Headmistress",
                nominee: "Sudarshan Hegde",
                relation: "Husband",
                nominee_age: 48,
                branch: "BR003",
                introducer: "A20004"
            },
            {
                id: "BMS000114",
                name: "Harish Devadiga",
                gender: "Male",
                dob: "1986-02-14",
                age: 40,
                father: "Anand Devadiga",
                mobile: "9845001114",
                email: "harish.devadiga.music@gmail.com",
                address: "Near Venkataramana Temple, Car Street, Karkala",
                city: "Karkala",
                pincode: "574104",
                pan: "NOPQR4567S",
                aadhaar: "678901234567",
                voter: "KA/12/086/456789",
                occupation: "Traditional Instrument Manufacturer & Merchant",
                nominee: "Shwetha Devadiga",
                relation: "Wife",
                nominee_age: 36,
                branch: "BR005",
                introducer: "A20006"
            },
            {
                id: "BMS000115",
                name: "Sunitha Alva",
                gender: "Female",
                dob: "1979-09-03",
                age: 46,
                father: "Bhoja Alva",
                mobile: "9845001115",
                email: "sunitha.alva.farm@gmail.com",
                address: "Alva Green Heritage, Kuntalpady, Karkala",
                city: "Karkala",
                pincode: "574104",
                pan: "OPQRS5678T",
                aadhaar: "789012345678",
                voter: "KA/12/086/567890",
                occupation: "Agro-Tourism Homestay Proprietor",
                nominee: "Prakash Alva",
                relation: "Husband",
                nominee_age: 50,
                branch: "BR005",
                introducer: "A20006"
            },
            {
                id: "BMS000116",
                name: "Prashanth Kotian",
                gender: "Male",
                dob: "1983-06-25",
                age: 42,
                father: "Monappa Kotian",
                mobile: "9845001116",
                email: "prashanth.kotian.trade@gmail.com",
                address: "Kotian Building, K.S. Rao Road, Hampankatta, Mangaluru",
                city: "Mangaluru",
                pincode: "575001",
                pan: "PQRST6789U",
                aadhaar: "890123456789",
                voter: "KA/12/088/678901",
                occupation: "Hardware & Sanitary Fittings Merchant",
                nominee: "Vanitha Kotian",
                relation: "Wife",
                nominee_age: 39,
                branch: "BR004",
                introducer: "A20005"
            },
            {
                id: "BMS000117",
                name: "Kavitha Shenoy",
                gender: "Female",
                dob: "1993-12-18",
                age: 32,
                father: "Damodar Shenoy",
                mobile: "9845001117",
                email: "kavitha.shenoy.health@gmail.com",
                address: "Kadri Hills, Near Temple Road, Mangaluru",
                city: "Mangaluru",
                pincode: "575002",
                pan: "QRSTU7890V",
                aadhaar: "901234567890",
                voter: "KA/12/088/789012",
                occupation: "Consultant Clinical Nutritionist",
                nominee: "Gautham Shenoy",
                relation: "Husband",
                nominee_age: 34,
                branch: "BR004",
                introducer: "A20005"
            },
            {
                id: "BMS000118",
                name: "Naveen Kumar Shetty",
                gender: "Male",
                dob: "1980-04-05",
                age: 45,
                father: "Sadashiva Shetty",
                mobile: "9845001118",
                email: "naveen.shetty.logistics@gmail.com",
                address: "Surathkal Junction, NH-66, Surathkal",
                city: "Mangaluru",
                pincode: "575014",
                pan: "RSTUV8901W",
                aadhaar: "012345678901",
                voter: "KA/12/088/890123",
                occupation: "Coastal Container Transporter",
                nominee: "Rekha N. Shetty",
                relation: "Wife",
                nominee_age: 41,
                branch: "BR004",
                introducer: "A20005"
            },
            {
                id: "BMS000119",
                name: "Mamatha Ballal",
                gender: "Female",
                dob: "1982-08-30",
                age: 43,
                father: "Chandrahas Ballal",
                mobile: "9845001119",
                email: "mamatha.ballal.bmv@gmail.com",
                address: "Ballal Compound, Car Street, Brahmavara",
                city: "Brahmavara",
                pincode: "576213",
                pan: "STUVW9012X",
                aadhaar: "123456789012",
                voter: "KA/12/084/901234",
                occupation: "Agricultural Co-operative Society Director",
                nominee: "Pradeep Ballal",
                relation: "Husband",
                nominee_age: 47,
                branch: "BR001",
                introducer: "A20007"
            },
            {
                id: "BMS000120",
                name: "Dr. Girish Upadhyaya",
                gender: "Male",
                dob: "1974-01-11",
                age: 52,
                father: "Krishna Upadhyaya",
                mobile: "9845001120",
                email: "girish.upadhyaya.ayur@gmail.com",
                address: "Ayur Kuteera, Saligrama-Kota Road, Kota Post",
                city: "Udupi",
                pincode: "576221",
                pan: "TUVWX0123Y",
                aadhaar: "234567890123",
                voter: "KA/12/084/012345",
                occupation: "Senior Ayurvedic Physician",
                nominee: "Gayathri Upadhyaya",
                relation: "Wife",
                nominee_age: 48,
                branch: "BR001",
                introducer: "A20007"
            },
            {
                id: "BMS000121",
                name: "Rajeshwari Marakala",
                gender: "Female",
                dob: "1987-03-21",
                age: 39,
                father: "Karantha Marakala",
                mobile: "9845001121",
                email: "rajeshwari.marakala@gmail.com",
                address: "Weavers Colony, Saligrama Post, Brahmavara",
                city: "Brahmavara",
                pincode: "576225",
                pan: "UVWXY1234Z",
                aadhaar: "345678901234",
                voter: "KA/12/084/123456",
                occupation: "Udupi Handloom GI Silk Weaver",
                nominee: "Shekhar Marakala",
                relation: "Husband",
                nominee_age: 42,
                branch: "BR001",
                introducer: "A20007"
            },
            {
                id: "BMS000122",
                name: "Vinayaka Prabhu",
                gender: "Male",
                dob: "1981-10-15",
                age: 44,
                father: "Narayana Prabhu",
                mobile: "9845001122",
                email: "vinayaka.prabhu.cashew@gmail.com",
                address: "Prabhu Industrial Estate, NH-66, Byndoor",
                city: "Byndoor",
                pincode: "576214",
                pan: "VWXYZ2345A",
                aadhaar: "456789012345",
                voter: "KA/12/087/234567",
                occupation: "Cashew Processing & Export Industrialist",
                nominee: "Saritha Prabhu",
                relation: "Wife",
                nominee_age: 40,
                branch: "BR003",
                introducer: "A20009"
            },
            {
                id: "BMS000123",
                name: "Bharathi Somayaji",
                gender: "Female",
                dob: "1990-06-27",
                age: 35,
                father: "Keshava Somayaji",
                mobile: "9845001123",
                email: "bharathi.somayaji.ca@gmail.com",
                address: "Ambalpady Temple Main Road, Ambalpady, Udupi",
                city: "Udupi",
                pincode: "576103",
                pan: "WXYZA3456B",
                aadhaar: "567890123456",
                voter: "KA/12/084/345678",
                occupation: "Chartered Accountant & Tax Consultant",
                nominee: "Prasad Somayaji",
                relation: "Husband",
                nominee_age: 37,
                branch: "BR001",
                introducer: "A20002"
            },
            {
                id: "BMS000124",
                name: "Sudhakar Billava",
                gender: "Male",
                dob: "1985-05-19",
                age: 40,
                father: "Koraga Billava",
                mobile: "9845001124",
                email: "sudhakar.billava.resort@gmail.com",
                address: "Beach View Heritage, Kaup Light House Road, Kaup",
                city: "Kaup",
                pincode: "574106",
                pan: "XYZAB4567C",
                aadhaar: "678901234567",
                voter: "KA/12/085/456789",
                occupation: "Beach Resort & Seafood Restaurant Owner",
                nominee: "Usha S. Billava",
                relation: "Wife",
                nominee_age: 36,
                branch: "BR001",
                introducer: "A20008"
            },
            {
                id: "BMS000125",
                name: "Nagendra Holla",
                gender: "Male",
                dob: "1977-12-04",
                age: 48,
                father: "Mahalinga Holla",
                mobile: "9845001125",
                email: "nagendra.holla.barkur@gmail.com",
                address: "Near Kalikamba Temple, Historic Barkur Post",
                city: "Brahmavara",
                pincode: "576210",
                pan: "YZABC5678D",
                aadhaar: "789012345678",
                voter: "KA/12/084/567890",
                occupation: "Organic Paddy Cultivator & Heritage Guide",
                nominee: "Padmavathi Holla",
                relation: "Wife",
                nominee_age: 44,
                branch: "BR001",
                introducer: "A20007"
            }
        ];

        for (const m of rawMembers) {
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
                state: "Karnataka",
                pincode: m.pincode,
                pan_no: m.pan,
                Pan_no: m.pan,
                aadharcard_no: m.aadhaar,
                voter_id: m.voter,
                occupation: m.occupation,
                nominee: m.nominee,
                Nominee_name: m.nominee,
                relation: m.relation,
                Nominee_Relation: m.relation,
                Nominee_age: m.nominee_age,
                branch_id: m.branch,
                introducer: m.introducer,
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
        console.log(`   ✨ ${rawMembers.length} Members & User Logins synced (password: "${DEMO_PASSWORD}").`);

        // ---------------------------------------------------------------------
        // 5. SEED 50+ ACCOUNTS & 25 LOANS
        // ---------------------------------------------------------------------
        console.log("\n💳 [5/6] Seeding 50+ Accounts and 25 Loans...");

        const accountsList = [
            // --- 25 Primary Savings (SB) Accounts (one per member) ---
            { id: "ACC000101", no: "SB000101", mem: "BMS000101", type: "AGP001", br: "BR001", amt: 170500, isPri: true, op: "Single" },
            { id: "ACC000102", no: "SB000102", mem: "BMS000102", type: "AGP001", br: "BR001", amt: 95270,  isPri: true, op: "Single" },
            { id: "ACC000103", no: "SB000103", mem: "BMS000103", type: "AGP001", br: "BR001", amt: 284550, isPri: true, op: "Single" },
            { id: "ACC000104", no: "SB000104", mem: "BMS000104", type: "AGP001", br: "BR002", amt: 65200,  isPri: true, op: "Single" },
            { id: "ACC000105", no: "SB000105", mem: "BMS000105", type: "AGP001", br: "BR001", amt: 240000, isPri: true, op: "Single" },
            { id: "ACC000106", no: "SB000106", mem: "BMS000106", type: "AGP001", br: "BR005", amt: 35800,  isPri: true, op: "Single" },
            { id: "ACC000107", no: "SB000107", mem: "BMS000107", type: "AGP001", br: "BR003", amt: 95000,  isPri: true, op: "Single" },
            { id: "ACC000108", no: "SB000108", mem: "BMS000108", type: "AGP001", br: "BR005", amt: 180000, isPri: true, op: "Single" },
            { id: "ACC000109", no: "SB000109", mem: "BMS000109", type: "AGP001", br: "BR002", amt: 112000, isPri: true, op: "Single" },
            { id: "ACC000110", no: "SB000110", mem: "BMS000110", type: "AGP001", br: "BR001", amt: 88500,  isPri: true, op: "Single" },
            { id: "ACC000111", no: "SB000111", mem: "BMS000111", type: "AGP001", br: "BR001", amt: 42000,  isPri: true, op: "Single" },
            { id: "ACC000112", no: "SB000112", mem: "BMS000112", type: "AGP001", br: "BR003", amt: 135000, isPri: true, op: "Single" },
            { id: "ACC000113", no: "SB000113", mem: "BMS000113", type: "AGP001", br: "BR003", amt: 78000,  isPri: true, op: "Single" },
            { id: "ACC000114", no: "SB000114", mem: "BMS000114", type: "AGP001", br: "BR005", amt: 54000,  isPri: true, op: "Single" },
            { id: "ACC000115", no: "SB000115", mem: "BMS000115", type: "AGP001", br: "BR005", amt: 165000, isPri: true, op: "Single" },
            { id: "ACC000116", no: "SB000116", mem: "BMS000116", type: "AGP001", br: "BR004", amt: 310000, isPri: true, op: "Single" },
            { id: "ACC000117", no: "SB000117", mem: "BMS000117", type: "AGP001", br: "BR004", amt: 62000,  isPri: true, op: "Single" },
            { id: "ACC000118", no: "SB000118", mem: "BMS000118", type: "AGP001", br: "BR004", amt: 420000, isPri: true, op: "Single" },
            { id: "ACC000119", no: "SB000119", mem: "BMS000119", type: "AGP001", br: "BR001", amt: 98000,  isPri: true, op: "Single" },
            { id: "ACC000120", no: "SB000120", mem: "BMS000120", type: "AGP001", br: "BR001", amt: 145000, isPri: true, op: "Single" },
            { id: "ACC000121", no: "SB000121", mem: "BMS000121", type: "AGP001", br: "BR001", amt: 31500,  isPri: true, op: "Single" },
            { id: "ACC000122", no: "SB000122", mem: "BMS000122", type: "AGP001", br: "BR003", amt: 520000, isPri: true, op: "Single" },
            { id: "ACC000123", no: "SB000123", mem: "BMS000123", type: "AGP001", br: "BR001", amt: 185000, isPri: true, op: "Single" },
            { id: "ACC000124", no: "SB000124", mem: "BMS000124", type: "AGP001", br: "BR001", amt: 290000, isPri: true, op: "Single" },
            { id: "ACC000125", no: "SB000125", mem: "BMS000125", type: "AGP001", br: "BR001", amt: 73000,  isPri: true, op: "Single" },

            // --- Current Accounts (CA) ---
            { id: "ACC000201", no: "CA000104", mem: "BMS000104", type: "AGP002", br: "BR002", amt: 150000, isPri: false, op: "Proprietorship" },
            { id: "ACC000202", no: "CA000105", mem: "BMS000105", type: "AGP002", br: "BR001", amt: 485000, isPri: false, op: "Business" },
            { id: "ACC000203", no: "CA000107", mem: "BMS000107", type: "AGP002", br: "BR003", amt: 210000, isPri: false, op: "Firm" },
            { id: "ACC000204", no: "CA000116", mem: "BMS000116", type: "AGP002", br: "BR004", amt: 620000, isPri: false, op: "Business" },
            { id: "ACC000205", no: "CA000122", mem: "BMS000122", type: "AGP002", br: "BR003", amt: 950000, isPri: false, op: "Industrial" },

            // --- Fixed Deposit (FD) Accounts ---
            { id: "ACC000301", no: "FD000101", mem: "BMS000101", type: "AGP004", br: "BR001", amt: 200000, isPri: false, duration: 24, rate: 7.5 },
            { id: "ACC000302", no: "FD000102", mem: "BMS000103", type: "AGP004", br: "BR001", amt: 500000, isPri: false, duration: 36, rate: 7.75 },
            { id: "ACC000303", no: "FD000103", mem: "BMS000106", type: "AGP004", br: "BR005", amt: 100000, isPri: false, duration: 12, rate: 8.25 },
            { id: "ACC000304", no: "FD000104", mem: "BMS000109", type: "AGP004", br: "BR002", amt: 300000, isPri: false, duration: 24, rate: 7.5 },
            { id: "ACC000305", no: "FD000105", mem: "BMS000120", type: "AGP004", br: "BR001", amt: 250000, isPri: false, duration: 36, rate: 7.75 },

            // --- Recurring Deposit (RD) Accounts ---
            { id: "ACC000401", no: "RD000101", mem: "BMS000101", type: "AGP003", br: "BR001", amt: 30000, isPri: false, duration: 12, rate: 7.25, rdInst: 5000, rdTotal: 12, rdPaid: 6 },
            { id: "ACC000402", no: "RD000102", mem: "BMS000102", type: "AGP003", br: "BR001", amt: 24000, isPri: false, duration: 24, rate: 7.25, rdInst: 3000, rdTotal: 24, rdPaid: 8 },
            { id: "ACC000403", no: "RD000103", mem: "BMS000113", type: "AGP003", br: "BR003", amt: 20000, isPri: false, duration: 12, rate: 7.0,  rdInst: 4000, rdTotal: 12, rdPaid: 5 },

            // --- Pigmy Daily Collection Accounts ---
            { id: "ACC000501", no: "PIG000104", mem: "BMS000104", type: "AGP005", br: "BR002", amt: 28500, isPri: false, assigned_to: "A20003", notes: "₹300/day by Agent Ramesh" },
            { id: "ACC000502", no: "PIG000111", mem: "BMS000111", type: "AGP005", br: "BR001", amt: 18200, isPri: false, assigned_to: "A20008", notes: "₹200/day by Agent Chethan" },
            { id: "ACC000503", no: "PIG000121", mem: "BMS000121", type: "AGP005", br: "BR001", amt: 15400, isPri: false, assigned_to: "A20007", notes: "₹150/day by Agent Divya" },

            // =================================================================
            // 25 LOANS ACROSS ALL 10 LOAN CATEGORIES (AGP007 to AGP017)
            // =================================================================
            {
                id: "LOAN000101", no: "GL000101", mem: "BMS000101", type: "AGP007", br: "BR001",
                amt: 150000, rate: 9.5, duration: 12, disbTo: "SB000101",
                notes: "22K Gold Loan (48 grams pledged jewellery)"
            },
            {
                id: "LOAN000102", no: "VL000102", mem: "BMS000102", type: "AGP008", br: "BR001",
                amt: 250000, rate: 9.0, duration: 36, disbTo: "SB000102",
                notes: "Two-Wheeler Electric Vehicle Loan"
            },
            {
                id: "LOAN000103", no: "AL000103", mem: "BMS000103", type: "AGP014", br: "BR001",
                amt: 300000, rate: 7.0, duration: 24, disbTo: "SB000103",
                notes: "Subsidized Kisan Dairy & Arecanut development facility"
            },
            {
                id: "LOAN000104", no: "BL000104", mem: "BMS000104", type: "AGP010", br: "BR002",
                amt: 400000, rate: 11.5, duration: 36, disbTo: "SB000104",
                notes: "Boutique equipment and designer inventory working capital"
            },
            {
                id: "LOAN000105", no: "PL000105", mem: "BMS000105", type: "AGP013", br: "BR001",
                amt: 100000, rate: 12.0, duration: 12, disbTo: "SB000105",
                notes: "Personal loan for boat maintenance"
            },
            {
                id: "LOAN000106", no: "ML000106", mem: "BMS000107", type: "AGP011", br: "BR003",
                amt: 1200000, rate: 10.0, duration: 60, disbTo: "SB000107",
                notes: "Mortgage loan on commercial property in Kundapura"
            },
            {
                id: "LOAN000107", no: "AL000107", mem: "BMS000108", type: "AGP014", br: "BR005",
                amt: 450000, rate: 7.25, duration: 36, disbTo: "SB000108",
                notes: "Rubber Plantation & Irrigation Agriculture Facility"
            },
            {
                id: "LOAN000108", no: "EL000108", mem: "BMS000109", type: "AGP009", br: "BR002",
                amt: 500000, rate: 8.5, duration: 48, disbTo: "SB000109",
                notes: "Higher Education Loan for Postdoctoral Research"
            },
            {
                id: "LOAN000109", no: "GL000109", mem: "BMS000110", type: "AGP007", br: "BR001",
                amt: 220000, rate: 9.5, duration: 12, disbTo: "SB000110",
                notes: "Gold loan on hallmarked 65g ornaments"
            },
            {
                id: "LOAN000110", no: "PGL000110", mem: "BMS000111", type: "AGP016", br: "BR001",
                amt: 50000, rate: 10.0, duration: 12, disbTo: "SB000111",
                notes: "Micro Pigmy Loan for SHG Loom Upgrades"
            },
            {
                id: "LOAN000111", no: "VL000111", mem: "BMS000112", type: "AGP008", br: "BR003",
                amt: 350000, rate: 9.25, duration: 36, disbTo: "SB000112",
                notes: "Utility Vehicle Loan for fish distribution"
            },
            {
                id: "LOAN000112", no: "PL000112", mem: "BMS000113", type: "AGP013", br: "BR003",
                amt: 150000, rate: 11.5, duration: 18, disbTo: "SB000113",
                notes: "Teacher Personal Loan for home library extension"
            },
            {
                id: "LOAN000113", no: "BL000113", mem: "BMS000114", type: "AGP010", br: "BR005",
                amt: 300000, rate: 11.0, duration: 24, disbTo: "SB000114",
                notes: "Music store expansion and inventory finance"
            },
            {
                id: "LOAN000114", no: "ML000114", mem: "BMS000115", type: "AGP011", br: "BR005",
                amt: 800000, rate: 10.25, duration: 48, disbTo: "SB000115",
                notes: "Mortgage loan on ancestral farmhouse homestay"
            },
            {
                id: "LOAN000115", no: "OD000115", mem: "BMS000116", type: "AGP012", br: "BR004",
                amt: 500000, rate: 12.0, duration: 12, disbTo: "SB000116",
                notes: "Commercial Business Overdraft facility against stock"
            },
            {
                id: "LOAN000116", no: "GL000116", mem: "BMS000117", type: "AGP007", br: "BR004",
                amt: 180000, rate: 9.5, duration: 12, disbTo: "SB000117",
                notes: "Emergency Gold loan against 52g ornaments"
            },
            {
                id: "LOAN000117", no: "VL000117", mem: "BMS000118", type: "AGP008", br: "BR004",
                amt: 850000, rate: 9.5, duration: 48, disbTo: "SB000118",
                notes: "Commercial Heavy Transport Truck vehicle loan"
            },
            {
                id: "LOAN000118", no: "AL000118", mem: "BMS000119", type: "AGP014", br: "BR001",
                amt: 250000, rate: 7.0, duration: 24, disbTo: "SB000119",
                notes: "Agri credit for micro-irrigation and solar pump"
            },
            {
                id: "LOAN000119", no: "BL000119", mem: "BMS000120", type: "AGP010", br: "BR001",
                amt: 200000, rate: 11.0, duration: 24, disbTo: "SB000120",
                notes: "Ayurvedic clinic herbal processing equipment loan"
            },
            {
                id: "LOAN000120", no: "PGLD000120", mem: "BMS000121", type: "AGP017", br: "BR001",
                amt: 75000, rate: 9.75, duration: 12, disbTo: "SB000121",
                notes: "Pigmi Gold Loan for weaver handloom raw silk purchase"
            },
            {
                id: "LOAN000121", no: "BL000121", mem: "BMS000122", type: "AGP010", br: "BR003",
                amt: 1000000, rate: 11.0, duration: 36, disbTo: "SB000122",
                notes: "Cashew processing industrial expansion loan"
            },
            {
                id: "LOAN000122", no: "PL000122", mem: "BMS000123", type: "AGP013", br: "BR001",
                amt: 200000, rate: 11.5, duration: 12, disbTo: "SB000123",
                notes: "Professional personal loan for CA office digitization"
            },
            {
                id: "LOAN000123", no: "BL000123", mem: "BMS000124", type: "AGP010", br: "BR001",
                amt: 600000, rate: 11.5, duration: 36, disbTo: "SB000124",
                notes: "Kaup resort cottage renovation business credit"
            },
            {
                id: "LOAN000124", no: "AL000124", mem: "BMS000125", type: "AGP014", br: "BR001",
                amt: 180000, rate: 7.0, duration: 24, disbTo: "SB000125",
                notes: "Organic paddy crop cultivation agricultural loan"
            },
            {
                id: "LOAN000125", no: "GL000125", mem: "BMS000106", type: "AGP007", br: "BR005",
                amt: 120000, rate: 9.5, duration: 12, disbTo: "SB000106",
                notes: "Senior citizen gold loan with concession rate"
            }
        ];

        let createdAccCount = 0;
        let createdLoanCount = 0;

        for (const item of accountsList) {
            const isLoan = item.no.startsWith('GL') || item.no.startsWith('VL') ||
                           item.no.startsWith('AL') || item.no.startsWith('BL') ||
                           item.no.startsWith('PL') || item.no.startsWith('ML') ||
                           item.no.startsWith('EL') || item.no.startsWith('OD') ||
                           item.no.startsWith('PGL') || item.no.startsWith('PGLD');

            const accDoc = {
                account_id: item.id,
                account_no: item.no,
                member_id: item.mem,
                account_type: item.type,
                branch_id: item.br,
                account_amount: item.amt,
                is_primary: Boolean(item.isPri),
                status: "active",
                date_of_opening: new Date("2023-01-20"),
                account_operation: item.op || "Single",
                interest_rate: item.rate || (isLoan ? 10.5 : 4.0),
                duration: item.duration || 12,
                date_of_maturity: item.duration ? new Date("2025-06-30") : null,
                loan_disbursed_to: item.disbTo || null,
                disbursed_at: item.disbTo ? new Date("2024-01-15") : null,
                passbook_notes: item.notes || (isLoan ? "Active sanctioned loan" : "Operating bank account"),
                rd_installment_amount: item.rdInst || null,
                rd_total_installments: item.rdTotal || null,
                rd_paid_installments: item.rdPaid || 0,
                assigned_to: item.assigned_to || null,
                last_transaction_date: new Date()
            };

            await AccountsModel.findOneAndUpdate(
                { account_no: item.no },
                { $set: accDoc },
                { upsert: true, new: true }
            );

            if (item.isPri) {
                await MemberModel.findOneAndUpdate(
                    { $or: [{ member_id: item.mem }, { Member_id: item.mem }] },
                    { $set: { primary_account_no: item.no } }
                );
            }

            if (isLoan) createdLoanCount++;
            else createdAccCount++;
        }
        console.log(`   ✨ ${createdAccCount} Standard Accounts and ${createdLoanCount} Loans synced successfully.`);

        // ---------------------------------------------------------------------
        // 6. SEED PASSBOOK & BANK TRANSACTIONS
        // ---------------------------------------------------------------------
        console.log("\n📖 [6/6] Generating Rich Passbook Transactions with Running Balances...");

        const allAccNos = accountsList.map(a => a.no);
        await TransactionModel.deleteMany({ account_number: { $in: allAccNos } });

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

            await AccountsModel.findOneAndUpdate(
                { account_no: accountNo },
                {
                    $set: {
                        account_amount: Math.round(runningBalance * 100) / 100,
                        last_transaction_date: items[items.length - 1]?.date || new Date()
                    }
                }
            );

            return records.length;
        };

        // --- 1. Ledger for Raghavendra Rao (SB000101) --- 17 transactions
        await generateAccountLedger({
            memberId: "BMS000101",
            memberName: "Raghavendra Rao",
            mobile: "9845001101",
            accountNo: "SB000101",
            accountType: "AGP001",
            initialBalance: 0,
            items: [
                { date: new Date("2024-01-01T10:30:00Z"), type: "Account Opening", desc: "INITIAL ACCOUNT OPENING DEPOSIT - CASH", credit: 10000, debit: 0, ref: "CSH/BR001/0142" },
                { date: new Date("2024-01-05T14:15:00Z"), type: "Salary Credit", desc: "SALARY CREDIT - ROBOSOFT TECHNOLOGIES UDUPI", credit: 95000, debit: 0, ref: "NEFT/ROBO/20240105" },
                { date: new Date("2024-01-08T18:40:00Z"), type: "UPI Transfer", desc: "UPI/GPAY TO SRI KRISHNA MATHA SEVA FUND", credit: 0, debit: 5000, ref: "UPI/400819283719" },
                { date: new Date("2024-01-15T11:20:00Z"), type: "Utility Bill", desc: "MESCOM ELECTRICITY BILL PAYMENT - UDUPI SUB-DIV", credit: 0, debit: 2450, ref: "BBPS/MESCOM/98124" },
                { date: new Date("2024-01-20T16:05:00Z"), type: "ATM Cash Withdrawal", desc: "ATM CASH WITHDRAWAL - KALSANKA UDUPI ATM", credit: 0, debit: 10000, ref: "ATM/UDU/8812" },
                { date: new Date("2024-02-05T10:00:00Z"), type: "Salary Credit", desc: "SALARY CREDIT - ROBOSOFT TECHNOLOGIES UDUPI", credit: 95000, debit: 0, ref: "NEFT/ROBO/20240205" },
                { date: new Date("2024-02-12T13:30:00Z"), type: "UPI Transfer", desc: "UPI/DIANA RESTAURANT UDUPI - FOOD BILL", credit: 0, debit: 1850, ref: "UPI/404312891234" },
                { date: new Date("2024-02-28T17:15:00Z"), type: "Transfer", desc: "TRANSFER TO MONTHLY RD ACCOUNT RD000101", credit: 0, debit: 5000, ref: "INT/TRF/RD000101" },
                { date: new Date("2024-03-31T20:00:00Z"), type: "Interest Credit", desc: "QUARTERLY SAVINGS BANK INTEREST CREDIT Q4 23-24", credit: 1250, debit: 0, ref: "SYS/SB/INT/Q4" },
                { date: new Date("2024-04-10T11:30:00Z"), type: "Loan Disbursement", desc: "LOAN DISBURSEMENT CREDITED FROM GL000101 (Gold Loan)", credit: 150000, debit: 0, ref: "LN/DISB/GL000101" },
                { date: new Date("2024-04-15T15:00:00Z"), type: "RTGS Transfer", desc: "RTGS OUTWARD - HOME RENOVATION CONTRACTOR UDUPI", credit: 0, debit: 140000, ref: "RTGS/BMS/20240415" },
                { date: new Date("2024-05-10T12:00:00Z"), type: "Loan Repayment", desc: "MONTHLY EMI REPAYMENT DEBITED - GOLD LOAN GL000101", credit: 0, debit: 13150, ref: "EMI/GL000101/M1" },
                { date: new Date("2024-06-10T12:00:00Z"), type: "Loan Repayment", desc: "MONTHLY EMI REPAYMENT DEBITED - GOLD LOAN GL000101", credit: 0, debit: 13150, ref: "EMI/GL000101/M2" },
                { date: new Date("2024-06-30T20:00:00Z"), type: "Interest Credit", desc: "QUARTERLY SAVINGS BANK INTEREST CREDIT Q1 24-25", credit: 1450, debit: 0, ref: "SYS/SB/INT/Q1" },
                { date: new Date("2024-07-10T12:00:00Z"), type: "Loan Repayment", desc: "MONTHLY EMI REPAYMENT DEBITED - GOLD LOAN GL000101", credit: 0, debit: 13150, ref: "EMI/GL000101/M3" },
                { date: new Date("2024-08-05T10:15:00Z"), type: "Cash Deposit", desc: "CASH DEPOSIT AT UDUPI MAIN BRANCH COUNTER", credit: 25000, debit: 0, ref: "CSH/BR001/0891" },
                { date: new Date("2024-09-01T14:20:00Z"), type: "UPI Transfer", desc: "UPI/BIG MISHRA PEDHA UDUPI - FESTIVAL SWEETS", credit: 0, debit: 3450, ref: "UPI/424519082341" }
            ]
        });

        // --- 2. Ledger for Deepa Nayak (SB000102) --- 11 transactions
        await generateAccountLedger({
            memberId: "BMS000102",
            memberName: "Deepa Nayak",
            mobile: "9845001102",
            accountNo: "SB000102",
            accountType: "AGP001",
            initialBalance: 0,
            items: [
                { date: new Date("2024-01-10T10:00:00Z"), type: "Account Opening", desc: "INITIAL ACCOUNT OPENING DEPOSIT", credit: 5000, debit: 0, ref: "CSH/BR001/0210" },
                { date: new Date("2024-01-25T15:30:00Z"), type: "Salary Credit", desc: "TEACHER SALARY CREDIT - GOVT HIGH SCHOOL UDUPI", credit: 48000, debit: 0, ref: "TREASURY/EDU/202401" },
                { date: new Date("2024-02-02T11:45:00Z"), type: "UPI Transfer", desc: "UPI/MORE SUPERMARKET UDUPI - GROCERIES", credit: 0, debit: 4200, ref: "UPI/403310928341" },
                { date: new Date("2024-02-15T16:00:00Z"), type: "Transfer", desc: "MONTHLY RD CONTRIBUTION TO RD000102", credit: 0, debit: 3000, ref: "TRF/RD000102" },
                { date: new Date("2024-02-25T15:30:00Z"), type: "Salary Credit", desc: "TEACHER SALARY CREDIT - GOVT HIGH SCHOOL UDUPI", credit: 48000, debit: 0, ref: "TREASURY/EDU/202402" },
                { date: new Date("2024-03-05T14:10:00Z"), type: "Loan Repayment", desc: "VEHICLE LOAN EMI AUTO-DEBIT - VL000102", credit: 0, debit: 7950, ref: "EMI/VL000102/M1" },
                { date: new Date("2024-03-31T20:00:00Z"), type: "Interest Credit", desc: "QUARTERLY SAVINGS BANK INTEREST CREDIT", credit: 680, debit: 0, ref: "SYS/SB/INT/Q4" },
                { date: new Date("2024-04-05T14:10:00Z"), type: "Loan Repayment", desc: "VEHICLE LOAN EMI AUTO-DEBIT - VL000102", credit: 0, debit: 7950, ref: "EMI/VL000102/M2" },
                { date: new Date("2024-05-05T14:10:00Z"), type: "Loan Repayment", desc: "VEHICLE LOAN EMI AUTO-DEBIT - VL000102", credit: 0, debit: 7950, ref: "EMI/VL000102/M3" },
                { date: new Date("2024-06-05T14:10:00Z"), type: "Loan Repayment", desc: "VEHICLE LOAN EMI AUTO-DEBIT - VL000102", credit: 0, debit: 7950, ref: "EMI/VL000102/M4" },
                { date: new Date("2024-07-20T17:00:00Z"), type: "Cash Deposit", desc: "CASH DEPOSIT BY BROTHER SATHISH NAYAK", credit: 20000, debit: 0, ref: "CSH/BR001/0955" }
            ]
        });

        // --- 3. Ledger for Ganesh Prasad Shetty (SB000103) ---
        await generateAccountLedger({
            memberId: "BMS000103",
            memberName: "Ganesh Prasad Shetty",
            mobile: "9845001103",
            accountNo: "SB000103",
            accountType: "AGP001",
            initialBalance: 0,
            items: [
                { date: new Date("2024-01-15T11:00:00Z"), type: "Account Opening", desc: "INITIAL ACCOUNT OPENING - AGRICULTURAL SAVINGS", credit: 25000, debit: 0, ref: "CSH/BR001/0312" },
                { date: new Date("2024-02-10T14:00:00Z"), type: "Milk Union Credit", desc: "DAIRY PROCEEDS CREDIT - D.K. CO-OPERATIVE MILK UNION (NANDINI)", credit: 42500, debit: 0, ref: "NEFT/DKMUL/202402" },
                { date: new Date("2024-03-01T10:15:00Z"), type: "Areca Sale", desc: "ARECANUT HARVEST SALE PROCEEDS - CAMPCO LTD MANGALURU", credit: 125000, debit: 0, ref: "RTGS/CAMPCO/88912" },
                { date: new Date("2024-03-20T16:30:00Z"), type: "Cash Withdrawal", desc: "CASH WITHDRAWAL FOR FERTILIZERS & LABOUR WAGES", credit: 0, debit: 35000, ref: "WDL/BR001/0451" },
                { date: new Date("2024-04-10T14:00:00Z"), type: "Milk Union Credit", desc: "DAIRY PROCEEDS CREDIT - D.K. CO-OPERATIVE MILK UNION (NANDINI)", credit: 38200, debit: 0, ref: "NEFT/DKMUL/202404" },
                { date: new Date("2024-05-15T12:00:00Z"), type: "Loan Repayment", desc: "AGRICULTURE LOAN HALF-YEARLY INTEREST & PRINCIPAL - AL000103", credit: 0, debit: 26000, ref: "EMI/AL000103" },
                { date: new Date("2024-06-30T20:00:00Z"), type: "Interest Credit", desc: "QUARTERLY SAVINGS BANK INTEREST CREDIT", credit: 1850, debit: 0, ref: "SYS/SB/INT/Q1" }
            ]
        });

        // --- 4. Ledger for Ananya Adiga - Pigmy Account (PIG000104) ---
        await generateAccountLedger({
            memberId: "BMS000104",
            memberName: "Ananya Adiga",
            mobile: "9845001104",
            accountNo: "PIG000104",
            accountType: "AGP005",
            initialBalance: 24600,
            items: [
                { date: new Date("2024-05-01T17:00:00Z"), type: "Pigmy Collection", desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)", credit: 300, debit: 0, ref: "PIG/001/DAY01" },
                { date: new Date("2024-05-02T17:00:00Z"), type: "Pigmy Collection", desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)", credit: 300, debit: 0, ref: "PIG/001/DAY02" },
                { date: new Date("2024-05-03T17:00:00Z"), type: "Pigmy Collection", desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)", credit: 300, debit: 0, ref: "PIG/001/DAY03" },
                { date: new Date("2024-05-04T17:00:00Z"), type: "Pigmy Collection", desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)", credit: 300, debit: 0, ref: "PIG/001/DAY04" },
                { date: new Date("2024-05-05T17:00:00Z"), type: "Pigmy Collection", desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)", credit: 500, debit: 0, ref: "PIG/001/DAY05" },
                { date: new Date("2024-05-06T17:00:00Z"), type: "Pigmy Collection", desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)", credit: 300, debit: 0, ref: "PIG/001/DAY06" },
                { date: new Date("2024-05-07T17:00:00Z"), type: "Pigmy Collection", desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)", credit: 300, debit: 0, ref: "PIG/001/DAY07" },
                { date: new Date("2024-05-08T17:00:00Z"), type: "Pigmy Collection", desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)", credit: 300, debit: 0, ref: "PIG/001/DAY08" },
                { date: new Date("2024-05-09T17:00:00Z"), type: "Pigmy Collection", desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)", credit: 300, debit: 0, ref: "PIG/001/DAY09" },
                { date: new Date("2024-05-10T17:00:00Z"), type: "Pigmy Collection", desc: "DAILY PIGMY COLLECTION - AGENT RAMESH ACHARYA (A20003)", credit: 1000, debit: 0, ref: "PIG/001/DAY10" }
            ]
        });

        // --- 5. Ledger for Praveen Poojary - Current Account (CA000105) ---
        await generateAccountLedger({
            memberId: "BMS000105",
            memberName: "Praveen Kumar Poojary",
            mobile: "9845001105",
            accountNo: "CA000105",
            accountType: "AGP002",
            initialBalance: 0,
            items: [
                { date: new Date("2024-01-05T09:30:00Z"), type: "Current Deposit", desc: "EXPORT FISH CONSIGNMENT PAYMENT - GOA HARBOUR DEALER", credit: 250000, debit: 0, ref: "RTGS/GOA/20240105" },
                { date: new Date("2024-01-18T14:20:00Z"), type: "Cheque Clearing", desc: "DIESEL FUEL PAYMENT - MALPE PORT FUEL OUTLET CHQ #77281", credit: 0, debit: 85000, ref: "CHQ/77281" },
                { date: new Date("2024-02-01T11:00:00Z"), type: "Current Deposit", desc: "SEAFOOD EXPORT SETTLEMENT - COCHIN SEAFOODS LTD", credit: 380000, debit: 0, ref: "NEFT/COCHIN/8912" },
                { date: new Date("2024-02-15T16:45:00Z"), type: "Cheque Clearing", desc: "BOAT MAINTENANCE & NET REPAIR CHQ #77282", credit: 0, debit: 60000, ref: "CHQ/77282" }
            ]
        });

        // --- 6. Generate 6 to 10 automated transactions for members 6 to 25 ---
        for (let idx = 6; idx <= 25; idx++) {
            const m = rawMembers[idx - 1];
            const sbAccNo = `SB000${String(100 + idx)}`;
            const baseAmt = 30000 + (idx * 4500);

            const txList = [
                {
                    date: new Date(`2024-01-${String(Math.min(idx, 28)).padStart(2, '0')}T10:00:00Z`),
                    type: "Account Opening",
                    desc: "INITIAL ACCOUNT OPENING DEPOSIT - CASH",
                    credit: baseAmt,
                    debit: 0,
                    ref: `CSH/BR00${(idx % 5) + 1}/${String(idx).padStart(4, '0')}`
                },
                {
                    date: new Date(`2024-02-10T14:30:00Z`),
                    type: "Credit Transfer",
                    desc: `BUSINESS PROCEEDS - ${m.occupation.toUpperCase()} RECEIPTS`,
                    credit: 45000,
                    debit: 0,
                    ref: `NEFT/BMS/${getTxId().substring(0, 10)}`
                },
                {
                    date: new Date(`2024-02-25T11:15:00Z`),
                    type: "ATM Withdrawal",
                    desc: `ATM CASH WITHDRAWAL - ${m.city.toUpperCase()} ATM`,
                    credit: 0,
                    debit: 10000,
                    ref: `ATM/${m.city.substring(0, 3).toUpperCase()}/${Math.floor(1000 + Math.random() * 9000)}`
                },
                {
                    date: new Date(`2024-03-31T20:00:00Z`),
                    type: "Interest Credit",
                    desc: "QUARTERLY SAVINGS INTEREST CREDIT - Q4 23-24",
                    credit: Math.round(baseAmt * 0.01),
                    debit: 0,
                    ref: "SYS/SB/INT/Q4"
                },
                {
                    date: new Date(`2024-05-15T16:00:00Z`),
                    type: "UPI Transfer",
                    desc: `UPI/LOCAL MERCHANT AT ${m.city.toUpperCase()}`,
                    credit: 0,
                    debit: 3500,
                    ref: `UPI/${getTxId().substring(4, 16)}`
                },
                {
                    date: new Date(`2024-06-30T20:00:00Z`),
                    type: "Interest Credit",
                    desc: "QUARTERLY SAVINGS INTEREST CREDIT - Q1 24-25",
                    credit: Math.round(baseAmt * 0.011),
                    debit: 0,
                    ref: "SYS/SB/INT/Q1"
                }
            ];

            await generateAccountLedger({
                memberId: m.id,
                memberName: m.name,
                mobile: m.mobile,
                accountNo: sbAccNo,
                accountType: "AGP001",
                initialBalance: 0,
                items: txList
            });
        }
        console.log(`   ✨ Generated full transaction ledgers across all 25 member operating accounts.`);

        // --- 7. Also create loan repayment entries for each of the 25 loans ---
        for (let lIdx = 1; lIdx <= 25; lIdx++) {
            const loanItem = accountsList.find(a => a.id === `LOAN000${String(100 + lIdx)}`);
            if (loanItem) {
                const memInfo = rawMembers.find(m => m.id === loanItem.mem);
                const emiAmount = Math.round(loanItem.amt / (loanItem.duration || 12));

                await TransactionModel.create({
                    transaction_id: getTxId(),
                    transaction_date: new Date("2024-02-15T11:00:00Z"),
                    createdAt: new Date("2024-02-15T11:00:00Z"),
                    member_id: loanItem.mem,
                    account_number: loanItem.no,
                    account_type: loanItem.type,
                    transaction_type: "Loan Sanction",
                    description: `LOAN SANCTIONED - ${loanItem.notes}`,
                    credit: loanItem.amt,
                    debit: 0,
                    balance: loanItem.amt,
                    Name: memInfo?.name || "Member",
                    mobileno: memInfo?.mobile || "",
                    status: "Completed",
                    reference_no: `LN/SANC/${loanItem.no}`
                });

                // Add 2 monthly repayments
                await TransactionModel.create({
                    transaction_id: getTxId(),
                    transaction_date: new Date("2024-03-15T12:00:00Z"),
                    createdAt: new Date("2024-03-15T12:00:00Z"),
                    member_id: loanItem.mem,
                    account_number: loanItem.no,
                    account_type: loanItem.type,
                    transaction_type: "Loan Repayment",
                    description: `MONTHLY EMI REPAYMENT - INSTALMENT 1/${loanItem.duration || 12}`,
                    credit: emiAmount,
                    debit: 0,
                    balance: loanItem.amt - emiAmount,
                    Name: memInfo?.name || "Member",
                    mobileno: memInfo?.mobile || "",
                    status: "Completed",
                    reference_no: `EMI/${loanItem.no}/M1`,
                    is_loan_repayment: true
                });

                await TransactionModel.create({
                    transaction_id: getTxId(),
                    transaction_date: new Date("2024-04-15T12:00:00Z"),
                    createdAt: new Date("2024-04-15T12:00:00Z"),
                    member_id: loanItem.mem,
                    account_number: loanItem.no,
                    account_type: loanItem.type,
                    transaction_type: "Loan Repayment",
                    description: `MONTHLY EMI REPAYMENT - INSTALMENT 2/${loanItem.duration || 12}`,
                    credit: emiAmount,
                    debit: 0,
                    balance: loanItem.amt - (emiAmount * 2),
                    Name: memInfo?.name || "Member",
                    mobileno: memInfo?.mobile || "",
                    status: "Completed",
                    reference_no: `EMI/${loanItem.no}/M2`,
                    is_loan_repayment: true
                });
            }
        }
        console.log(`   ✨ Generated Sanction & EMI transactions for all 25 Loans.`);

        // ---------------------------------------------------------------------
        // SUMMARY & CREDENTIALS
        // ---------------------------------------------------------------------
        console.log("\n=====================================================================");
        console.log("🎉 COMPREHENSIVE DATA (25 MEMBERS, 25 LOANS) SEEDED SUCCESSFULLY!");
        console.log("=====================================================================");
        console.log("\n📋 DATA SUMMARY:");
        console.log("   • Branches         : 5 (Udupi, Manipal, Kundapura, Mangaluru, Karkala)");
        console.log("   • Field Agents     : 8 Active Agents");
        console.log("   • Members / Users  : 25 Active Members (BMS000101 to BMS000125)");
        console.log("   • Loans            : 25 Sanctioned Loans with EMI history (GL, VL, AL, BL, PL, ML, EL, OD, PGL, PGLD)");
        console.log("   • Accounts         : 50+ Accounts (SB, CA, FD, RD, PIGMY)");
        console.log("   • Passbook Entries : Multi-page transactions with running balance calculations");
        console.log("\n🔑 LOGIN CREDENTIALS (Default password for all: password123):");
        console.log("   • Admin Logins     : 'admin' / 'admin01' (Password: existing admin password / admin123)");
        console.log("   • Agent Logins     : A20002 to A20009 (e.g. A20002 / password123)");
        console.log("   • Member Logins    : BMS000101 to BMS000125 (e.g. BMS000101 / password123)");
        console.log("=====================================================================\n");

        await mongoose.disconnect();
        console.log("✅ MongoDB disconnected cleanly.");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ Error during demo data seeding:", error);
        process.exit(1);
    }
}

seedData();
