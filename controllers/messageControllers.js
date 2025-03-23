const Campaign = require("../models/Campaign");
const User = require("../models/User");

// Send & Reply to Messages
exports.sendMessage = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { content, receiverId } = req.body;
    const senderId = req.user.id;

    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    // Fetch sender details
    const sender = await User.findById(senderId);
    if (!sender) return res.status(404).json({ message: "Sender not found" });

    // Create message
    const message = {
      sender: senderId,
      senderName: sender.name,
      receiver: receiverId,
      content,
      timestamp: new Date(),
    };

    // Save message in the campaign
    campaign.messages.push(message);
    await campaign.save();

    // Emit real-time message event
    global.io.to(receiverId).emit("newMessage", message);

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Reply to a Message
exports.replyToMessage = async (req, res) => {
  try {
    const { campaignId, messageId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    // Find campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    // Find the original message
    const originalMessage = campaign.messages.id(messageId);
    if (!originalMessage) return res.status(404).json({ message: "Message not found" });

    // Fetch sender details
    const sender = await User.findById(senderId);
    if (!sender) return res.status(404).json({ message: "Sender not found" });

    // Create reply message
    const replyMessage = {
      sender: senderId,
      senderName: sender.name,
      receiver: originalMessage.sender, // Replying to the sender of the original message
      content,
      timestamp: new Date(),
    };

    // Save reply in the campaign
    campaign.messages.push(replyMessage);
    await campaign.save();

    // Emit real-time reply event
    global.io.to(originalMessage.sender.toString()).emit("newMessage", replyMessage);

    res.status(201).json({ success: true, replyMessage });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// Get Messages for a Campaign
exports.getMessages = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user.id;

    // Find campaign and populate messages.sender with the name field
    const campaign = await Campaign.findById(campaignId).populate(
      "messages.sender",
      "name"
    );
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Determine if the requester is the campaign creator
    const isCreator = campaign.creator.toString() === userId;
    // Filter messages: either sent by the user or received by the user
    const userMessages = campaign.messages.filter((msg) => {
      // If msg.sender is populated, it is an object; otherwise it is an ObjectId
      const senderId = msg.sender._id ? msg.sender._id.toString() : msg.sender.toString();
      return senderId === userId || msg.receiver.toString() === userId;
    });

    if (!isCreator && userMessages.length === 0) {
      return res.status(403).json({ message: "Unauthorized to view messages" });
    }

    const messages = isCreator ? campaign.messages : userMessages;

    // Map messages to include senderName from the populated sender object.
    const messagesWithSenderName = messages.map((msg) => ({
      _id: msg._id,
      sender: msg.sender._id ? msg.sender._id : msg.sender,
      senderName: msg.sender.name || msg.senderName,
      receiver: msg.receiver,
      content: msg.content,
      timestamp: msg.timestamp,
      formattedDate: msg.formattedDate,
      formattedTime: msg.formattedTime,
    }));

    res.status(200).json({ success: true, messages: messagesWithSenderName });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};
