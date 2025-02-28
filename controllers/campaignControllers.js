const Campaign = require("../models/Campaign");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc    Create a new campaign
// @access  Private
exports.createCampaign = async (req, res) => {
  try {
    const { title, category, description, story, goal, videos } = req.body;
    let imagesData = [];

    // If files exist, upload them to Cloudinary
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "campaigns" })
      );
      const uploadResults = await Promise.all(uploadPromises);

      // Build an array of objects with public_id and url
      imagesData = uploadResults.map((result) => ({
        public_id: result.public_id,
        url: result.secure_url,
      }));

      // Remove files from local storage after upload
      req.files.forEach((file) => fs.unlinkSync(file.path));
    }

    // Create campaignData using imagesData (instead of an array of strings)
    const campaignData = {
      title,
      category,
      description,
      story,
      goal,
      images: imagesData,
      videos: videos ? JSON.parse(videos) : [],
      creator: req.user.id, // from auth middleware
    };

    const newCampaign = await Campaign.create(campaignData);

    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      campaign: newCampaign,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update an existing campaign
// @access  Private (only campaign creator)
exports.updateCampaign = async (req, res) => {
  try {
    const campaignId = req.params.id;
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Only allow campaign creator to update
    if (campaign.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // If new images are provided, remove the old ones from Cloudinary and upload new images
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      if (campaign.images && campaign.images.length > 0) {
        for (const img of campaign.images) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }

      // Upload new images
      let newImages = [];
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "campaigns" })
      );
      const uploadResults = await Promise.all(uploadPromises);

      // Build new images array with public_id and url
      newImages = uploadResults.map((result) => ({
        public_id: result.public_id,
        url: result.secure_url,
      }));

      // Remove uploaded files from local storage
      req.files.forEach((file) => fs.unlinkSync(file.path));

      // Set new images in request body
      req.body.images = newImages;
    }

    // Update campaign document with other fields (if provided)
    const updatedCampaign = await Campaign.findByIdAndUpdate(
      campaignId,
      req.body,
      { new: true }
    );
    res.json({
      success: true,
      message: "Campaign updated",
      campaign: updatedCampaign,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all campaigns
// @access  Public
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().populate("creator", "name email");
    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get a single campaign by ID
// @access  Public
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate(
      "creator",
      "name email"
    );
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    res.json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get campaigns for the logged-in user
// @access  Private
exports.getUserCampaigns = async (req, res) => {
    try {
      const userId = req.user.id;
      const campaigns = await Campaign.find({ creator: userId }).sort({ createdAt: -1 });
      res.json({ success: true, campaigns });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };
  

// @desc    Delete a campaign
// @access  Private (only campaign creator)
exports.deleteCampaign = async (req, res) => {
    try {
      const campaignId = req.params.id;
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
  
      if (campaign.creator.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
  
      // Delete each image from Cloudinary
      if (campaign.images && campaign.images.length > 0) {
        for (const img of campaign.images) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }
  
      // Delete the campaign document
      await campaign.deleteOne();
  
      res.json({ success: true, message: "Campaign deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };
  
