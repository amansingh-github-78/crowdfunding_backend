const crypto = require("crypto");
const User = require("../models/User");
const Campaign = require("../models/Campaign");
const PaymentStatus = require("../models/Payment");

const PAYU_KEY = process.env.PAYU_MERCHANT_KEY;
const PAYU_SALT = process.env.PAYU_MERCHANT_SALT;
const PAYU_BASE_URL = process.env.PAYU_BASE_URL; // PayU API URL
// const PAYU_SUCCESS_URL = process.env.PAYU_SUCCESS_URL
// const PAYU_FAILURE_URL = process.env.PAYU_FAILURE_URL

// ✅ Unified Payment Route - Handles both initiation & success/failure
exports.processPayment = async (req, res) => {
  try {
    const { amount, donorName, donorEmail, campaignId } = req.body;

    if (!amount || !donorName || !donorEmail || !campaignId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Generate Transaction Details
    const txnid = "Txn" + new Date().getTime();
    const productinfo = "Donation";

    const udf1 = campaignId;
    const udf2 = "",
      udf3 = "",
      udf4 = "",
      udf5 = "",
      udf6 = "",
      udf7 = "",
      udf8 = "",
      udf9 = "",
      udf10 = "";

    // ✅ Construct hash string
    const hashString = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${donorName}|${donorEmail}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}|${udf6}|${udf7}|${udf8}|${udf9}|${udf10}|${PAYU_SALT}`;

    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    // Prepare PayU Payment Data
    const payuData = {
      key: PAYU_KEY,
      txnid,
      amount,
      productinfo,
      firstname: donorName,
      email: donorEmail,
      phone: "9999999999",
      surl: `${process.env.BACKEND_URL}/successRedirect/${campaignId}/${txnid}/${amount}/${donorEmail}/${donorName}`,
      furl: `${process.env.BACKEND_URLL}/successFailure/${campaignId}`,
      hash,
      action: PAYU_BASE_URL,
      udf1,
    };

    console.log(payuData);

    res.json({ loading: true, paymentData: payuData });
  } catch (error) {
    console.error("🚨 Payment initiation error:", error);
    res.status(500).json({
      loading: false,
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Receives PayU's Payment Confirmation
exports.handlePaymentSuccess = async (req, res) => {
  try {
    const { txnid, amount, campaignId, donorEmail, donorName } = req.body;

    if (!campaignId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing campaignId" });
    }

    // Step 1: Find Donor
    const donor = await User.findOne({ email: donorEmail });
    if (!donor) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Step 2: Find Campaign & Creator
    const campaign = await Campaign.findById(campaignId).populate("creator");
    if (!campaign || !campaign.creator) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    }

    const existingPayment = await PaymentStatus.findOne({ txnid });
    if (existingPayment) {
      return res
        .status(400)
        .json({ success: false, message: "Payment already processed!" });
    }

    // Step 3: Prevent Duplicate Transaction Processing
    let donorPaymentStatus = await PaymentStatus.findOne({ user: donor._id });

    if (donorPaymentStatus) {
      // Check if the transaction already exists in donation details
      const existingTransaction = donorPaymentStatus.donationDetails.some(
        (d) => d.transactionId === txnid
      );
      if (existingTransaction) {
        return res.status(200).json({
          success: false,
          message: "Duplicate transaction detected, ignoring.",
        });
      }
    } else {
      // Create PaymentStatus if it doesn't exist
      donorPaymentStatus = await PaymentStatus.create({
        user: donor._id,
        name: donor.name,
        email: donor.email,
        funds: 0,
        donationDetails: [],
        withdrawalDetails: [],
      });
    }

    // Step 4: Add Donation Details to Donor's PaymentStatus
    donorPaymentStatus.donationDetails.push({
      campaignId: campaign._id,
      campaign: campaign.name,
      transactionId: txnid,
      amount,
      date: new Date(),
    });

    // Step 5: Handle Self Donation or Transfer to Creator
    const isSelfDonation = donor._id.equals(campaign.creator._id);

    if (isSelfDonation) {
      donorPaymentStatus.funds += Number(amount);
      await donorPaymentStatus.save();
    } else {
      // Step 6: Get or Create PaymentStatus for Creator
      let creatorPaymentStatus = await PaymentStatus.findOne({
        user: campaign.creator._id,
      });

      if (!creatorPaymentStatus) {
        creatorPaymentStatus = await PaymentStatus.create({
          user: campaign.creator._id,
          name: campaign.creator.name,
          email: campaign.creator.email,
          funds: 0,
          donationDetails: [],
          withdrawalDetails: [],
        });
      }

      creatorPaymentStatus.funds += Number(amount);
      await creatorPaymentStatus.save();
    }

    // Step 7: Update Campaign Details
    campaign.donationDetails.push({
      name: donorName,
      transactionId: txnid,
      amount,
    });
    campaign.raisedFunds += Number(amount);
    campaign.backers += 1;
    await campaign.save();

    // Send Success Response
    res
      .status(200)
      .json({ success: true, message: "Payment successfully processed" });
  } catch (error) {
    console.error("🚨 Processing Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const paymentStatus = await PaymentStatus.findOne({ user: req.user.id });

    if (paymentStatus && paymentStatus.user.toString() === req.user.id) {
      return res.json(paymentStatus);
    }

    res.status(404).json({ message: "Payment status not found" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/payment/withdraw
exports.initiateWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountHolderName, accountNumber, ifscCode, amount, campaignId } =
      req.body;

    // Check user's payment status
    let paymentStatus = await PaymentStatus.findOne({ user: userId });
    if (!paymentStatus || paymentStatus.funds < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    // Verify campaign ownership
    let campaign = await Campaign.findOne({ _id: campaignId, creator: userId });
    if (!campaign) {
      return res
        .status(404)
        .json({ message: "Campaign not found or unauthorized" });
    }

    // MOCKING PAYU WITHDRAWAL SUCCESS ✅
    const mockPayoutResponse = {
      status: "success",
      message: "Mock withdrawal successful",
      transactionId: `MOCK_TXN_${Date.now()}`,
    };

    if (mockPayoutResponse.status !== "success") {
      return res.status(400).json({ message: "Mock Withdrawal failed" });
    }

    // Deduct funds & update withdrawal details
    paymentStatus.funds -= amount;
    campaign.fundsWithdrawn += amount;

    const withdrawalRecord = {
      bankName: "Mock Bank",
      accountHolderName,
      accountNumber,
      ifscCode,
      amount,
      date: new Date(),
      campaignId,
      transactionId: mockPayoutResponse.transactionId,
      otpVerified: true, // Since it's mock, assuming OTP is always verified
    };

    paymentStatus.withdrawalDetails.push(withdrawalRecord);
    await paymentStatus.save();
    await campaign.save();

    res.status(200).json({
      success: true,
      message: "Mock Withdrawal initiated successfully",
      transactionId: mockPayoutResponse.transactionId,
      paymentStatus,
      campaign,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
