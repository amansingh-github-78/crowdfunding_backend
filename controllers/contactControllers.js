const Contact = require("../models/Contact");
const User = require("../models/User");
const nodemailer = require("nodemailer");

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  

// Submit Contact Form
exports.submitContactForm = async (req, res) => {
  try {
    const { reason, message, contact } = req.body;

    const contactor = await User.findById(req.user.id);
    if (!contactor) {
      return res.status(404).json({ message: "Contactor not found" });
    }
    const { name, email } = contactor;

    if (!reason || !message) {
      return res
        .status(400)
        .json({ message: "Reason and message are required" });
    }

    // Save in the database
    const newContact = new Contact({ reason, name, email, contact, message });
    await newContact.save();

    // Send email notification to admin
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL, // Admin email address
      subject: `New Contact Form Submission - ${reason}`,
      text: `Name: ${name}\nEmail: ${email}\nContact: ${
        contact || "N/A"
      }\n\nMessage:\n${message}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "Contact form submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get All Contact Messages (Admin Only)
// exports.getAllContacts = async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const contacts = await Contact.find().sort({ createdAt: -1 });
//     res.status(200).json(contacts);
//   } catch (error) {
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };
