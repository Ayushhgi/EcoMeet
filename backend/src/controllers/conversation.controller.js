import {Conversation} from '../models/Conversational.js'

export const getConversationalId = async (req, res) => {
  try {
    const id1 = req.user._id
    const { id2 } = req.params

    console.log(id1)
    console.log(id2)

    const conversation = await Conversation.findOne({
      members: { $all: [id1, id2] }
    })

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found"
      })
    }

    return res.status(200).json({
      roomId: conversation._id
    })

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      message: "Internal Server Error"
    })
  }
}

export const getConversation = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findById(id);

    // conversation not found
    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // check if logged in user belongs to this conversation
    const isMember = conversation.members.some(
      (member) =>
        member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    return res.status(200).json(conversation);

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};