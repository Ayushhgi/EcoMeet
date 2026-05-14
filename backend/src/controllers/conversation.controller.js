import { Message } from '../models/message.model.js'
import { Conversation } from '../models/Conversational.js'

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
        message: 'Conversation not found'
      })
    }

    return res.status(200).json({
      roomId: conversation._id
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      message: 'Internal Server Error'
    })
  }
}

export const getConversation = async (req, res) => {
  try {
    const { id } = req.params

    const conversation = await Conversation.findById(id).populate(
      'members',
      'fullName profilePic'
    )

    // conversation not found
    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      })
    }

    // check if logged in user belongs to this conversation
    const isMember = conversation.members.some(
      member => member._id.toString() === req.user._id.toString()
    )

    if (!isMember) {
      return res.status(403).json({
        message: 'Unauthorized'
      })
    }

    return res.status(200).json(conversation)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      message: 'Internal Server Error'
    })
  }
}

// ================= GET MESSAGES =================

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params

    const messages = await Message.find({
      conversationId
    }).sort({ createdAt: 1 })

    res.status(200).json(messages)
  } catch (error) {
    console.log('Get Messages Error', error)

    res.status(500).json({
      message: 'Internal Server Error'
    })
  }
}

// ================= SEND MESSAGE =================

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id

    const { conversationId, text, image } = req.body

    const newMessage = await Message.create({
      conversationId,
      senderId,
      text,
      image
    })

    res.status(201).json(newMessage)
  } catch (error) {
    console.log('Send Message Error', error)

    res.status(500).json({
      message: 'Internal Server Error'
    })
  }
}
