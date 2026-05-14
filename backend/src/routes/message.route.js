import express from "express";

import {
  getMessages,
  sendMessage,
} from "../controllers/message.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/:conversationId", getMessages);

router.post("/send", sendMessage);

export default router;