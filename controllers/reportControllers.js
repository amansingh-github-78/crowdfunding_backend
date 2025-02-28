const Report = require("../models/Report");
const User = require("../models/User");

// Create a new report
exports.createReport = async (req, res) => {
  try {
    const { type, reason, details } = req.body;

    const reporter = await User.findById(req.user.id);
    if (!reporter) {
      return res.status(404).json({ message: "Reporter not found" });
    }
    const { name, email } = reporter;

    const newReport = new Report({
      type,
      reason,
      details,
      email,
      name
    });

    await newReport.save();
    res
      .status(201)
      .json({ success: true, message: "Report submitted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
