import express from "express";
import { addToHistory, getUserHistory, login, register } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/onboading").post(protectRoute,onboad);
router.route("/add_to_activity").post(addToHistory)
router.route("/get_all_activity").get(getUserHistory)

export default router;