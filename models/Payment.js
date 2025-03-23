const mongoose = require("mongoose");

const DonationSchema = new mongoose.Schema({
  campaignId : { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
  campaign: {type: String},
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
  amount: { type: Number },
  transactionId: { type: String },
  campaignId : { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
  campaign: {type: String},
  date: { type: Date, default: Date.now },
});

const PaymentStatusSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User"},
    name: { type: String, required: true },
    email: { type: String, required: true },
    donationDetails: { type: [DonationSchema], default: [] },
    funds: { type: Number, default: 0 },
    withdrawalDetails: { type: [WithdrawalSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentStatus", PaymentStatusSchema);
