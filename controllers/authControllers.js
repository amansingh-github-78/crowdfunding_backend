const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
require("dotenv").config();

// Configured Cloudinary with credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc    Update user profile (and profile picture if provided)
// @access  Protected
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent email from being updated
    if (req.body.email) {
      delete req.body.email;
    }

    // Prevent password from being updated
    if (req.body.password) {
      delete req.body.password;
    }

    // If a new profile image file is provided
    if (req.file) {
      // Delete existing profile image from Cloudinary if it exists
      if (user.profileImage && user.profileImage.public_id) {
        await cloudinary.uploader.destroy(user.profileImage.public_id);
      }

      // Upload the new image file to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profilePics",
      });

      // Remove the temporary file from local storage
      fs.unlinkSync(req.file.path);

      // Update the profileImage field with the new image info
      req.body.profileImage = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    } else if (req.body.removeProfileImage === "true") {
      // If the client requests to remove the profile image
      if (user.profileImage && user.profileImage.public_id) {
        await cloudinary.uploader.destroy(user.profileImage.public_id);
      }
      req.body.profileImage = {}; // Clear the profile image field
    }

    // Update other user fields from req.body
    user = await User.findByIdAndUpdate(userId, req.body, { new: true }).select("-password");

    res.status(200).json({ success: true, message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Create a Nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Initiate Registration by sending OTP
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate a 6-digit OTP as a string
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create a temporary token that holds user details and the OTP
    // This token expires in 15 minutes
    const tempToken = jwt.sign({ name, email, password, otp }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // Send OTP email
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Registration",
      html: `<p>Your OTP code is <b>${otp}</b>. It is valid for 15 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "OTP sent to email",
      // Send back the temporary token so the client can use it later for OTP verification
      tempToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Verify OTP and create user
exports.verifyOtp = async (req, res) => {
    try {
      const { otp } = req.body; // OTP from client input
      const decoded = req.tempUserData; // Data attached by middleware
      console.log("otp is:", otp)
      console.log("decoded data is" , decoded)
      // Check if the provided OTP matches the one stored in the token
      if (decoded.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
      console.log("Otp and Decoded match")
  
      // Ensure user hasn't been created in the meantime
      const userExists = await User.findOne({ email: decoded.email });
      if (userExists) {
        return res.status(400).json({ message: "User already exists" });
      }
      console.log("User Doesn't exists")
  
      // Hash the provided password from the token data
      const hashedPassword = await bcrypt.hash(decoded.password, 10);
      console.log("Password hashed")

      // Create the new user in the database
      const newUser = await User.create({
        name: decoded.name,
        email: decoded.email,
        password: hashedPassword,
      });
      console.log("User created successfully")
  
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
        },
      });
      console.log("Success response is send")
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
      console.log("Error response is send")
    }
  };

// Login User remains unchanged
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get User Data (Protected)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Forgot Password remains unchanged
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    // Generate Reset Token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });

    // Send email
    const transporter = createTransporter();
    const resetLink = `http://192.168.1.10:5173/reset/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link is valid for 15 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Password reset link sent to your email." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Reset Password remains unchanged
exports.resetPassword = async (req, res) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }
    console.log(req.body)

    const { newPassword } = req.body;
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update user password
    user.password = hashedPassword;
    user.resetToken = null; // Remove reset token
    await user.save();

    res.json({ success: true, message: "Password reset successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
