import { User } from '../models/user.model.js'
import httpstatus from 'http-status'
import jwt from 'jsonwebtoken'
import { Meeting } from '../models/meeting.model.js'

async function login (req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'All fields are required backend' })
    }

    const user = await User.findOne({ email })
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' })

    const isPasswordCorrect = await user.matchPassword(password)

    if (!isPasswordCorrect)
      return res.status(401).json({ message: 'Invalid email or password' })

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: '7d'
    })

    res.cookie('jwt', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'none',
      secure: true
    })

    res.status(200).json({ success: true, user })
  } catch (error) {
    console.log('Error in login controller', error.message)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

async function register (req, res) {
  try {
    const { fullName, email, password } = req.body

    if (!fullName || !email || !password) {
      return res.status(httpstatus.BAD_REQUEST).json({
        message: 'All fields are required'
      })
    }

    if (password.length < 6) {
      return res.status(httpstatus.BAD_REQUEST).json({
        message: 'Password must be at least 6 characters'
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      return res.status(httpstatus.BAD_REQUEST).json({
        message: 'Invalid email format'
      })
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(httpstatus.CONFLICT).json({
        message: 'Email already exists'
      })
    }

    const idx = Math.floor(Math.random() * 100) + 1

    // const randomAvatar =
    //    `https://randomuser.me/api/portraits/thumb/men/${idx}.jpg`;

    const newUser = await User.create({
      fullName,
      email,
      password
    })

    const token = jwt.sign(
      // we have provided it three parameters - paylode , secret key , expireIn
      { userId: newUser._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: '7d'
      }
    )

    res.cookie('jwt', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'none',
      secure: true
    })

    return res.status(httpstatus.CREATED).json({
      success: true,
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic
      }
    })
  } catch (error) {
    console.log('Error in signup controller', error)

    return res.status(httpstatus.INTERNAL_SERVER_ERROR).json({
      message: 'Internal Server Error'
    })
  }
}

async function logout (req, res) {
  res.clearCookie('jwt')
  res.status(200).json({ success: true, message: 'Logout successful' })
}

const getUserHistory = async (req, res) => {
  const { token } = req.query

  try {
    const user = await User.findOne({ token: token })
    const meetings = await Meeting.find({ user_id: user.username })
    res.json(meetings)
  } catch (e) {
    res.json({ message: `Something went wrong ${e}` })
  }
}

const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body

  try {
    const user = await User.findOne({ token: token })

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meeting_code
    })

    await newMeeting.save()
    res.status(httpstatus.CREATED).json({ message: 'Added code to history' })
  } catch (e) {
    res.json({ message: `Something went wrong ${e}` })
  }
}

async function onboard (req, res) {
  try {
    const userId = req.user._id

    const { fullName, bio, nativeLanguage, learningLanguage, location } =
      req.body

    if (
      !fullName ||
      !bio ||
      !nativeLanguage ||
      !learningLanguage ||
      !location
    ) {
      return res.status(400).json({
        message: 'All fields are required',
        missingFields: [
          !fullName && 'fullName',
          !bio && 'bio',
          !nativeLanguage && 'nativeLanguage',
          !learningLanguage && 'learningLanguage',
          !location && 'location'
        ].filter(Boolean)
      })
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true
      },
      { new: true } //this return a req object
    )

    if (!updatedUser) return res.status(404).json({ message: 'User not found' })

    res.status(200).json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Onboarding error:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

export { register, onboard, login, logout, getUserHistory, addToHistory }
