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

// ✅ Move `upload.array("images", 10)` BEFORE `authMiddleware`
router.post(
  "/",
  upload.array("images", 10), // Process files first
  authMiddleware, // Authenticate after files are processed
  (req, res, next) => {
    console.log("Incoming Request Fields:", req.body);
    console.log("Incoming Files:", req.files);
    next();
  },
  campaignController.createCampaign
);

router.put("/:id", upload.array("images", 10), authMiddleware, campaignController.updateCampaign);

router.get("/", campaignController.getCampaigns);
router.get("/:id", campaignController.getCampaignById);
router.delete("/:id", authMiddleware, campaignController.deleteCampaign);
router.get("/user/mycampaigns", authMiddleware, campaignController.getUserCampaigns);

module.exports = router;
