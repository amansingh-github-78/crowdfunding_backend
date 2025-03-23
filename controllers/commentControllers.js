const Campaign = require("../models/Campaign");
const User = require("../models/User");

// Get all comments for a campaign (Public Access)
exports.getComments = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    res.json({ success: true, comments: campaign.comments });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message || error });
  }
};


// Add a comment to a campaign (Authenticated users only)
exports.addComment = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });

    const commenter = await User.findById(req.user.id);
    if (!commenter) {
      return res.status(404).json({ message: "Please Login First to comment..." });
    }

    const newComment = {
      name: commenter.name,
      content: req.body.content,
      timestamp: new Date(),
    };

    campaign.comments.push(newComment);
    await campaign.save();
    res
      .status(201)
      .json({ message: "Comment added successfully", comment: newComment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Reply to a comment (Only Campaign Creator can reply)
exports.replyToComment = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    if (campaign.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the campaign creator can reply to comments" });
    }

    const comment = campaign.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    comment.reply = req.body.reply;
    campaign.markModified("comments"); // Ensuring Mongoose detects changes
    await campaign.save();

    // Fetch updated campaign
    const updatedCampaign = await Campaign.findById(req.params.campaignId);

    res.json({ message: "Reply added successfully", comments: updatedCampaign.comments });
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ message: "Server error", error: error.message || error });
  }
};

