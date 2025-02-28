const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  content: { type: String, required: true },
  reply: String,
  timestamp: { type: Date, default: Date.now },
});

const DonationDetailSchema = new mongoose.Schema({
  name: String,
  amount: Number,
});

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderName: {type: String, required: true},
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Virtuals for MessageSchema to format timestamp
MessageSchema.virtual("formattedDate").get(function () {
  return this.timestamp.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
});

MessageSchema.virtual("formattedTime").get(function () {
  return this.timestamp.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).replace(/\./g, "");
});

// Virtuals for CommentSchema to format time
CommentSchema.virtual("formattedDate").get(function () {
  return this.timestamp.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
});

CommentSchema.virtual("formattedTime").get(function () {
  return this.timestamp.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).replace(/\./g, "");
});

const CampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    story: { type: String, required: true },
    goal: { type: Number, required: true },
    verified: { 
      type: String,
      enum: ["Yes","No","Denied"],
      default: "No"},
    images: [
      {
        public_id: { type: String },
        url: { type: String },
      },
    ],
    videos: { type: [String] }, // array of video links (strings)
    raisedFunds: { type: Number, default: 0 },
    updates: { type: [String], default: [] },
    backers: { type: Number, default: 0 },
    comments: { type: [CommentSchema], default: [] },
    messages: { type: [MessageSchema], default: [] },
    fundsWithdrawn: { type: Number, default: 0 },
    donationDetails: { type: [DonationDetailSchema], default: [] },
    engagementAnalysis: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "low",
    },
    // Associate the campaign with its creator (user)
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Ensure virtuals are included when converting to JSON or Objects
MessageSchema.set("toJSON", { virtuals: true });
MessageSchema.set("toObject", { virtuals: true });
CommentSchema.set("toJSON", { virtuals: true });
CommentSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Campaign", CampaignSchema);
