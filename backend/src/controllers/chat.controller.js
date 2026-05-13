import {Message} from '../models/Message.js'



export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;

    const newMessage = await Message.create({
      senderId: req.user._id,
      receiverId: req.params.id,
      text,
    });

    res.status(201).json(newMessage);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const userToChatId = req.params.id;

    const messages = await Message.find({
      $or: [
        {
          senderId: myId,
          receiverId: userToChatId,
        },
        {
          senderId: userToChatId,
          receiverId: myId,
        },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};