const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["campaign", "user"], required: true },
    reason: { type: String, required: true },
    details: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "resolved"],
      default: "active",
    },
    createdAt: { type: Date, default: Date.now },
  }
);

module.exports = mongoose.model("Report", ReportSchema);
