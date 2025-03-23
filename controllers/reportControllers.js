const Report = require("../models/Report");
const User = require("../models/User");
const Campaign = require("../models/Campaign");

// Create a new report
exports.createReport = async (req, res) => {
  try {
    const { type, reason, details, campaignId } = req.body;

    // Find the reporter's details
    const reporter = await User.findById(req.user.id);
    if (!reporter) {
      return res.status(404).json({ message: "Reporter not found" });
    }

    let reportedEntity;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (type === "campaign") {

      reportedEntity = campaign.title; 

    } else if (type === "user") {
      const reportedUser = await User.findById(campaign.creator._id);
      if (!reportedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      reportedEntity = reportedUser.email; // Reported user's email
    } else {
      return res.status(400).json({ message: "Invalid report type" });
    }

    // Create and save the new report
    const newReport = new Report({
      type,
      reason,
      details,
      reportedEntity,
      reporterEmail: reporter.email,
      reporterName: reporter.name,
    });

    await newReport.save();
    res.status(201).json({ success: true, message: "Report submitted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
