const express = require("express");
const helmet = require("helmet"); 
const connectDB = require("./config/db");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
require("dotenv").config();

const app = express();
connectDB();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

global.io = io;

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  // Join user room
  socket.on("joinRoom", (userId) => {
    socket.join(userId);
  });

  // Handle Disconnect
  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});

app.post("/successRedirect/:campaignId/:txnid/:amount/:donorEmail/:donorName", (req, res) => {
  const { campaignId, txnid, amount, donorEmail, donorName } = req.params;

  // Construct redirect URL with GET parameters
  const queryParams = new URLSearchParams({
      campaignId: campaignId || "unknown",
      txnid: txnid || "unknown",
      amount: amount || "0",
      donorEmail: donorEmail || "unknown",
      donorName: donorName || "unknown",
  }).toString();

  res.redirect(`/successRedirect.html?${queryParams}`);
});

app.post("/failureRedirect/:campaignId", (req, res) => {
  const { campaignId } = req.params;

  const queryParams = new URLSearchParams({
      campaignId: campaignId || "unknown",
      txnid: txnid || "unknown",
  }).toString();

  res.redirect(`/failureRedirect.html?${queryParams}`);
});


app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/campaigns", require("./routes/campaignRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/comments", require("./routes/commentRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/report", require("./routes/reportRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
