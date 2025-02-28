const PaymentStatus = require("../models/Payment");
const User = require("../models/User");
const Campaign = require("../models/Campaign");
const axios = require("axios");
const crypto = require("crypto");

const PAYU_KEY = process.env.PAYU_KEY;
const PAYU_SALT = process.env.PAYU_SALT;
const PAYU_BASE_URL = process.env.PAYU_BASE_URL;

// Helper function to generate PayU hash
const generatePayUHash = (params) => {
  const hashString = `${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|${PAYU_SALT}`;
  return crypto.createHash("sha512").update(hashString).digest("hex");
};

// POST /api/payment/initiate
exports.initiatePayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const txnid = `txn_${Date.now()}`;
    const paymentData = {
      key: PAYU_KEY,
      txnid,
      amount,
      productinfo: "Donation",
      firstname: user.name,
      email: user.email,
      phone: user.phone,
      surl: `${process.env.BASE_URL}/api/payment/success`,
      furl: `${process.env.BASE_URL}/api/payment/failure`,
      hash: generatePayUHash({ txnid, amount, productinfo: "Donation", firstname: user.name, email: user.email })
    };
    
    res.status(200).json({ success: true, paymentData });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// POST /api/payment/success
exports.paymentSuccess = async (req, res) => {
  try {
    const { txnid, amount, campaignId } = req.body;
    const donorId = req.user.id;

    const user1 = await User.findById(donorId);
    if (!user1) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find and update payment status
    let donorPaymentStatus = await PaymentStatus.findOne({ user: donorId });
    if (!donorPaymentStatus) {
      donorPaymentStatus = await PaymentStatus.create({
        user: donorId,
        name: user1.name,
        email: user1.email,
        funds: 0,
        donationDetails: [],
        withdrawalDetails: [],
      });
    }
    donorPaymentStatus.donationDetails.push({ transactionId: txnid, amount, date: new Date() });
    await donorPaymentStatus.save();

    const campaign = await Campaign.findById(campaignId).populate("creator");
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const user2 = await User.findById(campaign.creator._id);
    if (!user2) {
      return res.status(404).json({ message: "User not found" });
    }

    let creatorPaymentStatus = await PaymentStatus.findOne({ user: campaign.creator._id });
    if (!creatorPaymentStatus) {
      creatorPaymentStatus = await PaymentStatus.create({
        user: campaign.creator._id,
        name: user2.name,
        email: user2.email,
        funds: 0,
        donationDetails: [],
        withdrawalDetails: [],
      });
    }
    creatorPaymentStatus.funds += amount;
    await creatorPaymentStatus.save();

    // Update campaign donation details
    campaign.donationDetails.push({
      name: user1.name,
      amount,
    });

    campaign.raisedFunds += amount;
    campaign.backers += 1;
    await campaign.save();

    res.status(200).json({ success: true, message: "Payment successful", campaign });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// POST /api/payment/withdraw
exports.initiateWithdrawal = async (req, res) => {
    try {
      const userId = req.user.id;
      const { accountHolderName, accountNumber, ifscCode, amount, campaignId } = req.body;
      
      // Check user's payment status
      let paymentStatus = await PaymentStatus.findOne({ user: userId });
      if (!paymentStatus || paymentStatus.funds < amount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }
  
      // Verify campaign ownership
      let campaign = await Campaign.findOne({ _id: campaignId, creator: userId });
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found or unauthorized" });
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
  

// previous code dummy testing without payU

// const PaymentStatus = require("../models/Payment");
// const User = require("../models/User");
// const Campaign = require("../models/Campaign");

// // GET /api/payment
// exports.getPaymentStatus = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     let paymentStatus = await PaymentStatus.findOne({ user: userId });
//     res.status(200).json({ success: true, paymentStatus });
//   } catch (error) {
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

// // PUT /api/payment/donate
// exports.updateDonation = async (req, res) => {
//   try {
//     const donorId = req.user.id;
//     const { transactionId, paymentId, receipt, amount, campaignId } = req.body;

//     if (!campaignId) {
//       return res.status(400).json({ message: "Campaign ID is required" });
//     }

//     // Find the campaign
//     const campaign = await Campaign.findById(campaignId).populate("creator");
//     if (!campaign) {
//       return res.status(404).json({ message: "Campaign not found" });
//     }

//     const campaignCreatorId = campaign.creator._id;

//     const user = await User.findById(req.user.id).select("-password");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Find or create PaymentStatus for the donor
//     let donorPaymentStatus = await PaymentStatus.findOne({ user: donorId });
//     if (!donorPaymentStatus) {
//       donorPaymentStatus = await PaymentStatus.create({
//         user: donorId,
//         name: user.name,
//         email: user.email,
//         funds: 0,
//         donationDetails: [],
//         withdrawalDetails: [],
//       });
//     }

//     // Record the donation in the donor's PaymentStatus
//     const donationRecord = {
//       transactionId,
//       paymentId,
//       receipt,
//       amount,
//       date: new Date(),
//     };
//     donorPaymentStatus.donationDetails.push(donationRecord);
//     await donorPaymentStatus.save();

//     // Find or create PaymentStatus for the campaign creator
//     let creatorPaymentStatus = await PaymentStatus.findOne({
//       user: campaignCreatorId,
//     });
//     if (!creatorPaymentStatus) {
//       creatorPaymentStatus = await PaymentStatus.create({
//         user: campaignCreatorId,
//         name: campaign.creator.name,
//         email: campaign.creator.email,
//         funds: 0,
//         donationDetails: [],
//         withdrawalDetails: [],
//       });
//     }

//     // Add the donated amount to the campaign creator's funds
//     creatorPaymentStatus.funds += amount;
//     await creatorPaymentStatus.save();

//     // Update campaign donation details
//     campaign.donationDetails.push({
//       name: user.name,
//       amount,
//     });
//     campaign.raisedFunds += amount;
//     campaign.backers += 1;
//     await campaign.save();

//     res.status(200).json({
//       success: true,
//       message: "Donation successfully recorded",
//       donorPaymentStatus,
//       creatorPaymentStatus,
//       campaign,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

// // POST /api/payment/withdraw
// exports.initiateWithdrawal = async (req, res) => {
//     try {
//       const userId = req.user.id;
//       const {
//         bankName,
//         accountHolderName,
//         accountNumber,
//         ifscCode,
//         amount,
//         campaignId,
//       } = req.body;
  
//       // Find payment status of the requester (campaign creator)
//       let paymentStatus = await PaymentStatus.findOne({ user: userId });
//       if (!paymentStatus) {
//         return res.status(404).json({ message: "Payment status not found" });
//       }
  
//       if (paymentStatus.funds < amount) {
//         return res.status(400).json({ message: "Insufficient funds" });
//       }
  
//       // Find campaign associated with the user
//       let campaign = await Campaign.findOne({ _id: campaignId, creator: userId });
//       if (!campaign) {
//         return res
//           .status(404)
//           .json({ message: "Campaign not found or unauthorized" });
//       }
  
//       // Check if a withdrawal record already exists for the campaign
//       let existingWithdrawal = paymentStatus.withdrawalDetails.find(
//         (record) => record.campaignId.toString() === campaignId
//       );
  
//       if (existingWithdrawal) {
//           existingWithdrawal.bankName = bankName,
//           existingWithdrawal.accountHolderName = accountHolderName,
//           existingWithdrawal.accountNumber = accountNumber,
//           existingWithdrawal.ifscCode = ifscCode,
//           existingWithdrawal.otpVerified = false,
//           existingWithdrawal.amount = amount
//       } else {
//         // Create new withdrawal record
//         const withdrawalRecord = {
//           bankName,
//           accountHolderName,
//           accountNumber,
//           ifscCode,
//           otpVerified: false,
//           amount,
//           date: new Date(),
//           campaignId,
//         };
        
//         paymentStatus.withdrawalDetails.push(withdrawalRecord);
//       }
      
//       await paymentStatus.save();
  
//       res.status(200).json({
//         success: true,
//         message: "Withdrawal initiated, OTP sent",
//       });
//     } catch (error) {
//       res.status(500).json({ message: "Server Error", error: error.message });
//     }
//   };
  
// // PUT /api/payment/withdraw/verify
// exports.verifyWithdrawal = async (req, res) => {
//     try {
//       const userId = req.user.id;
//       const { otp } = req.body;
  
//       // OTP simulation dummy
//       if (otp !== "123456") {
//         return res.status(400).json({ message: "Invalid OTP" });
//       }
  
//       let paymentStatus = await PaymentStatus.findOne({ user: userId });
//       if (!paymentStatus) {
//         return res.status(404).json({ message: "Payment status not found" });
//       }
  
//       // Find the related campaign
//       let campaign = await Campaign.findOne({creator: userId });
//       if (!campaign) {
//         return res.status(404).json({ message: "Campaign not found or unauthorized" });
//       }
  
//       // Find the correct withdrawal record for the campaign
//       let withdrawalRecord = paymentStatus.withdrawalDetails.find(
//         (record) => record.campaignId.toString() === campaign.id
//       );
  
//       if (!withdrawalRecord) {
//         return res.status(404).json({ message: "Withdrawal record not found" });
//       }
  
//       if (withdrawalRecord.otpVerified) {
//         return res.status(400).json({ message: "Withdrawal already verified" });
//       }
  
//       // Ensure withdrawal amount is a valid number
//     //   const withdrawalAmount = Number(withdrawalRecord.amount);
//     //   if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
//     //     return res.status(400).json({ message: "Invalid withdrawal amount" });
//     //   }
  
//       // Mark withdrawal as verified
//       withdrawalRecord.otpVerified = true;
  
//       // Deduct the withdrawn amount from paymentStatus and campaign
//       paymentStatus.funds -= withdrawalRecord.amount;
//       campaign.fundsWithdrawn += withdrawalRecord.amount;
  
//       await paymentStatus.save();
//       await campaign.save();
  
//       res.status(200).json({
//         success: true,
//         message: "Withdrawal verified and processed successfully",
//         paymentStatus,
//         campaign,
//       });
//     } catch (error) {
//       res.status(500).json({ message: "Server Error", error: error.message });
//     }
//   };
  