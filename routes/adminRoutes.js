const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const adminController = require("../controllers/adminControllers");
const router = express.Router();

// Campaign routes (Admin can verify, delete, and get all campaigns)
router.put("/campaigns/:campaignId/verify", authMiddleware, adminMiddleware, adminController.verifyCampaign);
router.delete("/campaigns/:campaignId", authMiddleware, adminMiddleware, adminController.deleteCampaign);
router.get("/campaigns", authMiddleware, adminMiddleware, adminController.getAllCampaigns); // ✅ Added

// User management (Admin can update status & get all users)
router.put("/users/:userId/status", authMiddleware, adminMiddleware, adminController.updateUserStatus);
router.get("/users", authMiddleware, adminMiddleware, adminController.getAllUsers); // ✅ Added

// Reports management (Admin can view, resolve, and delete reports)
router.get("/reports", authMiddleware, adminMiddleware, adminController.getAllReports);
router.put("/reports/:reportId/resolve", authMiddleware, adminMiddleware, adminController.resolveReport);
router.delete("/reports/:reportId", authMiddleware, adminMiddleware, adminController.deleteReport);

module.exports = router;
