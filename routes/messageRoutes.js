const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageControllers");
const authMiddleware = require("../middleware/authMiddleware");

// Send a message (Backer <-> Campaigner)
router.post("/:campaignId", authMiddleware, messageController.sendMessage);

// Get all messages for a campaign (For campaign creator)
router.get("/:campaignId", authMiddleware, messageController.getMessages);

module.exports = router;
