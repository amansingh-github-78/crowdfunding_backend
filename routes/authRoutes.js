const express = require("express");
const router = express.Router();
const authController = require("../controllers/authControllers");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const extractTempToken = require("../middleware/extractTempToken");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Update user profile & profile pic (profileImage field)
// Use upload.single("profileImage") so the key "profileImage" in form-data will contain the file
router.put("/profile",authMiddleware,upload.single("profileImage"), authController.updateUserProfile
);

// Initiate OTP-based registration: Send OTP
router.post("/register", authController.registerUser);

// Verify OTP and create user
router.post("/verifyOtp", extractTempToken, authController.verifyOtp);

// Login User
router.post("/login", authController.loginUser);

// Get User Data (Protected)
router.get("/user", authMiddleware, authController.getUser);

// Forgot Password
router.post("/forgotPassword", authController.forgotPassword);

// Reset Password
router.post("/resetPassword", authController.resetPassword);

module.exports = router;
