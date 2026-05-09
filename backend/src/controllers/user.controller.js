import { User } from '../models/user.model.js';
import httpstatus from 'http-status';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Meeting } from "../models/meeting.model.js";

async function login(req,res){
    const {username , password}=req.body;
    if(!username || !password){
        return res.status(400).json({msg:"please Provide"});
    }
    try {
        const user = await User.findOne({username});  //findOne return a disctonary and find return an array
        if(!user){
            return res.status(httpstatus.NOT_FOUND).json({msg:"user not found"})
        }
        let isPassword= await bcrypt.compare(password ,user.password) //this compare returns a promise hence it should always be separatedOut int another variable
        if(isPassword){
            let token = crypto.randomBytes(20).toString("hex");
            user.token=token;
            await user.save();
            return res.status(httpstatus.OK).json({token:token})
        }
        else{
          return res.status(httpstatus.UNAUTHORIZED).json({message:"Invalid username or Password"})
        }
    } catch (error) {
        return res.status(500).json({msg:`something went wrong${error}`});
    }
};


async function register (req,res){
  const { name, username, password } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ msg: 'error' });
  }

  try {
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(httpstatus.FOUND).json({ msg: 'user already exist' })
    }
    const hashedPassword = await bcrypt.hash(password,8);

    const newUser = new User({
        name:name,
        username:username,
        password:hashedPassword,
    });

    await newUser.save();

    res.status(httpstatus.CREATED).json({msg:'userCreated'});


  } catch (error) {
    res.json({msg:`something went wrong${error}`});
  };
};

const getUserHistory = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ token: token });
        const meetings = await Meeting.find({ user_id: user.username })
        res.json(meetings)
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` })
    }
}

const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    try {
        const user = await User.findOne({ token: token });

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        })

        await newMeeting.save();
        res.status(httpstatus.CREATED).json({ message: "Added code to history" })
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` })
    }
}



export { register, login,getUserHistory, addToHistory };
