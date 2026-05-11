import express from 'express'
import {
  addToHistory,
  onboard,
  getUserHistory,
  login,
  register,
  logout
} from '../controllers/auth.controller.js'
import { protectRoute } from '../middleware/auth.middleware.js'

const router = express.Router()

//TODO: Forget password
//TODO: Welcome emails

router.route('/register').post(register)
router.route('/login').post(login)
router.route('/logout').post(logout)
router.route('/onboarding').post(protectRoute, onboard)
router.route('/add_to_activity').post(addToHistory)
router.route('/get_all_activity').get(getUserHistory)
router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});


export default router
