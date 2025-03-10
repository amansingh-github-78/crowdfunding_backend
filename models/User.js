const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contact: { type: Number },
    bio: { type: String },
    admin: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    status: {
      type: String,
      enum: ["active", "blocked", "banned"],
      default: "active",
    },
    profileImage: {
      public_id: { type: String, default: null },
      url: { type: String, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

