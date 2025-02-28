const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const app = express();
connectDB();

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
