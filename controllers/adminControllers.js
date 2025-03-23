const User = require("../models/User");
const Campaign = require("../models/Campaign");
const Report = require("../models/Report");
const nodemailer = require("nodemailer");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc    Update campaign verification status
// @access  Admin
exports.verifyCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { verified, verificationDenyReason } = req.body;

    if (!["Yes", "Denied"].includes(verified)) {
      return res.status(400).json({ message: "Invalid verification status" });
    }

    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { verified, verificationDenyReason },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    res.status(200).json({
      success: true,
      message: `Campaign verification updated to ${verified}`,
      campaign,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a campaign and notify creator via email
// @access  Admin
exports.deleteCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res
        .status(400)
        .json({ message: "Reason for deletion is required" });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const user = await User.findById(campaign.creator._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const creatorEmail = user.email;
    const campaignTitle = campaign.title;

    // Delete each image from Cloudinary
    if (campaign.images && campaign.images.length > 0) {
      for (const img of campaign.images) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    }

    await Campaign.findByIdAndDelete(campaignId);

    // Send notification email
    const createTransporter = () => {
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    };

    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: creatorEmail,
      subject: "Campaign Deletion Notice",
      html: `<p>Dear ${user.name},</p>
             <p>Your campaign <strong>"${campaignTitle}"</strong> has been deleted by Admin.</p>
             <p><strong>Reason:</strong> ${reason}</p>
             <p>If you have any questions, please contact support.</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Campaign deleted and creator notified via email",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update user status (Admin Only)
// @access  Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!["active", "blocked", "banned"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all reports
// @access  Admin
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find();
    res.status(200).json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Resolve a report
// @access  Admin
exports.resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findByIdAndUpdate(
      reportId,
      { status: "Resolved" },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json({
      success: true,
      message: "Report marked as resolved",
      report,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a report
// @access  Admin
exports.deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findByIdAndDelete(reportId);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all users
// @access  Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all campaigns
// @access  Admin
exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().populate("title", "status");
    res.status(200).json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
