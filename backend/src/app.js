import express from 'express';
import { createServer } from 'node:http'; 
// import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import { connectToSocket } from './controllers/socketManager.js';
import userRoutes from './routes/user.route.js';


const app = express();
const server = createServer(app); 
const io = connectToSocket(server);

const dbUrl =
  'mongodb+srv://goyalayush2424:6nxrnG3eY86EVomT@cluster0.6s3bm.mongodb.net/';

app.get('/home', (req, res) => {
  return res.json({ hello: 'world' });
});


app.use(cors());
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb",extended:true}));


app.use('/user', userRoutes)


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
