const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactControllers");
const authMiddleware = require("../middleware/authMiddleware");

// Submit Contact Form
router.post("/", authMiddleware, contactController.submitContactForm);

// ignore below route
// Get All Contact Messages (Admin Only)
// router.get("/", authMiddleware, contactController.getAllContacts);

module.exports = router;
