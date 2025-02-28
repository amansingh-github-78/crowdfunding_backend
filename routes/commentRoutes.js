const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const commentController = require("../controllers/commentControllers");

const router = express.Router();

// Get all comments for a campaign (Public Access)
router.get("/:campaignId", commentController.getComments);

// Add a comment to a campaign (Authenticated users only)
router.post("/:campaignId", authMiddleware, commentController.addComment);

// Reply to a comment (Only Campaign Creator can reply)
router.post("/:campaignId/reply/:commentId", authMiddleware, 
commentController.replyToComment);

module.exports = router;
