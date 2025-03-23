const User = require("../models/User");

// Middleware to check if the user is an admin
const adminMiddleware = async (req, res, next) => {
  try {
    // Ensure req.user exists (from authMiddleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized. User not found." });
    }

    // Find the user in the database using the authenticated ID
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the user's email matches the admin email in .env
    if (user.admin !== "Yes") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    next(); // Proceed if the user is an admin
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = adminMiddleware;
