const express = require("express");
const paymentControllers = require("../controllers/paymentControllers");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Payment Processing Route
router.post("/process", authMiddleware, paymentControllers.processPayment);

// ✅ Route to Receive PayU Response
router.post("/success", paymentControllers.handlePaymentSuccess);

// getting payment status info
router.get("/paymentStatus", authMiddleware, paymentControllers.getPaymentStatus);

// Initiate withdrawal request (for campaigners) using Razorpay Payout API (Mock)
router.post("/withdraw", authMiddleware, paymentControllers.initiateWithdrawal);

module.exports = router;
