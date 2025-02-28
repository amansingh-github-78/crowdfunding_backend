const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/campaignControllers");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

// Configuring multer for temporary local storage of images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Create campaign (authenticated + image upload)
router.post("/", authMiddleware, upload.array("images", 10), campaignController.createCampaign);

// Update campaign (authenticated + image upload if needed)
router.put("/:id", authMiddleware, upload.array("images", 10), campaignController.updateCampaign);

// Get all campaigns (public)
router.get("/", campaignController.getCampaigns);

// Get single campaign by id (public)
router.get("/:id", campaignController.getCampaignById);

// Delete campaign (authenticated)
router.delete("/:id", authMiddleware, campaignController.deleteCampaign);

// Get campaigns for the logged-in user
router.get("/user/mycampaigns", authMiddleware, campaignController.getUserCampaigns);

module.exports = router;
