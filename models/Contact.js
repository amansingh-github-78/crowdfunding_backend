const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    reason: { type: String, required: true, enum: ["Inquiry", "Feedback", "Complaint", "Issue", "Other"] },
    name: { type: String, required: true },
    email: { type: String, required: true },
    contact: { type: String, default: "9999999999" }, // Optional
    message: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", ContactSchema);
