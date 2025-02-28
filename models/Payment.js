const mongoose = require("mongoose");

const DonationSchema = new mongoose.Schema({
  transactionId: { type: String },
  paymentId: { type: String },
  receipt: { type: String },
  amount: { type: Number },
  date: { type: Date, default: Date.now },
});

const WithdrawalSchema = new mongoose.Schema({
  bankName: { type: String },
  accountHolderName: { type: String },
  accountNumber: { type: String },
  ifscCode: { type: String },
  otpVerified: { type: Boolean, default: false },
  amount: { type: Number },
  campaignId : { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
  date: { type: Date, default: Date.now },
});

const PaymentStatusSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    donationDetails: { type: [DonationSchema], default: [] },
    funds: { type: Number, default: 0 },
    withdrawalDetails: { type: [WithdrawalSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentStatus", PaymentStatusSchema);
