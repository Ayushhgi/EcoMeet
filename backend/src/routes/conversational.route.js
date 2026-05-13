import express from 'express'
import { getConversation, getConversationalId } from '../controllers/conversation.controller.js'
import { protectRoute } from '../middleware/auth.middleware.js'

const router = express.Router()
router.use(protectRoute) //this will apply this middleware to all the routes
router.get('/:id2',getConversationalId)
router.get('/conversation/:id',getConversation)

export default router
