import express from 'express';
import { createServer } from 'node:http'; 
import "dotenv/config";
import dotenv from "dotenv";
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from "cookie-parser";
import { connectToSocket } from './controllers/socketChatManager.js';
import {connectToVideoMeetSocket} from './controllers/socketManager.js'
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import conversationRoutes from './routes/conversational.route.js'
import messageRoutes from './routes/message.route.js'
import { Server } from "socket.io";



const app = express();
const server = createServer(app); 


const io = new Server(server,{
    cors:{
        origin:"https://ecomeet-ed87.onrender.com",
        methods:["GET","POST"],
        credentials:true
    },
    transports:["websocket"]
});

connectToSocket(io);
connectToVideoMeetSocket(io);

dotenv.config({ path: "./.env" });

const dbUrl =process.env.MONGODB_URL;

app.get('/home', (req, res) => {
  return res.json({ hello: 'world' });
});

app.use(
  cors({
    origin: 'https://ecomeet-ed87.onrender.com',
    credentials: true, //allow frontend to send the cookie
  })
);


app.use(cookieParser());
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb",extended:true}));


app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/conversation-room',conversationRoutes);
app.use("/api/message", messageRoutes);


app.set("port", (process.env.PORT || 9002));
const start = async () => {

  server.listen(app.get("port"), () => {
    console.log('server is listening to the port 9002');
  });

  main()
    .then(() => {
      console.log('connected to DB');
    })
    .catch(err => {
      console.log(err);
    });
    
  async function main() {
    await mongoose.connect(dbUrl);
  }
};
start();
