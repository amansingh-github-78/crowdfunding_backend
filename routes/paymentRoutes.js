const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentControllers");
const authMiddleware = require("../middleware/authMiddleware");

// Initiate PayU Payment
router.post("/initiate", authMiddleware, paymentController.initiatePayment);

// Handle PayU Success Webhook
router.post("/success", authMiddleware, paymentController.paymentSuccess);

// // Initiate withdrawal request (for campaigners) using PayU Payout API
router.post("/withdraw", authMiddleware, paymentController.initiateWithdrawal);

// Ignore Below Routes
// Get PaymentStatus for logged-in user
// router.get("/", authMiddleware, paymentController.getPaymentStatus);

// Update donation details after a successful donation
// router.put("/donate", authMiddleware, paymentController.updateDonation);

// // Verify withdrawal OTP and finalize withdrawal
// router.put("/withdraw/verify", authMiddleware, paymentController.verifyWithdrawal);

module.exports = router;