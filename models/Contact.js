const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    reason: { type: String, required: true, enum: ["Support", "Feedback", "Business Inquiry", "Other"] },
    name: { type: String, required: true },
    email: { type: String, required: true },
    contact: { type: String }, // Optional
    message: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", ContactSchema);
