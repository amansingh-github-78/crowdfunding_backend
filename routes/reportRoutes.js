const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportControllers");
const authMiddleware = require("../middleware/authMiddleware");

// Create a new report (Any authenticated user)
router.post("/create", authMiddleware, reportController.createReport);

module.exports = router;
