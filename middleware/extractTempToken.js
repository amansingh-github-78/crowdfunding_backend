const jwt = require("jsonwebtoken");
require("dotenv").config();

const extractTempToken = (req, res, next) => {
  // Expect the temporary token in the custom header "verifyToken"
  const tempToken = req.header("verifyToken");
  
  if (!tempToken) {
    return res.status(400).json({ message: "Temporary token is required in header" });
  }
  
  try {
    // Verify the token using your JWT secret
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    // Attach the decoded token to the request for use in the controller
    req.tempUserData = decoded;
    next();
  } catch (error) {
    return res.status(400).json({ message: "Invalid or expired temporary token" });
  }
};

module.exports = extractTempToken;
