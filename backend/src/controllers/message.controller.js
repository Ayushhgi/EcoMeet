import { Message } from "../models/message.model.js";

// ================= GET MESSAGES =================

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({
      conversationId,
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);

  } catch (error) {
    console.log("Get Messages Error:", error);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// ================= SEND MESSAGE =================

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;

    const {
      conversationId,
      text,
      image,
    } = req.body;

    if (!text && !image) {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    const newMessage = await Message.create({
      conversationId,
      senderId,
      text,
      image,
    });

    res.status(201).json(newMessage);

  } catch (error) {
    console.log("Send Message Error:", error);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};