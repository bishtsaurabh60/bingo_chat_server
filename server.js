import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from "./routes/messageRoutes.js";
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';

dotenv.config();
connectDB();
const app = express();

app.use(cookieParser());
app.use(express.json()); // to accept json data
app.use(express.urlencoded({ extended: true })); // to accept form data
app.use(cors());

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

app.all('*', function (req, res) {
    res.status(404);
    if (req.accepts('html')) res.send('404 error this page could not be found');
    else if (req.accepts('json')) res.json({ message: "404 error this page could not be found" });
    else {
        res.type('txt').send("404 error this page could not be found");
    }
});

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

const io = new Server(httpServer, {
    pingTimeout: 60000,
    cors: {
        origin: (origin, callback) => {
            if (
              ["https://bingo-chat.onrender.com/"].indexOf(origin) !== -1
            ) {
              callback(null, true);
            } else {
              callback(new Error("Not allowed by CORS"));
            }
        },
        credentials:true,
    },
});

io.on('connection', (socket) => {
    console.log('connected to socket.io', socket.id);

    // frontend send the data and join a room and it will take the user data
    socket.on('setup', (userData) => {
        socket.join(userData._id);
        socket.emit('connected');
    });

    // joinChat this will take room id from frontend
    socket.on('join chat', (room) => {
        socket.join(room);
        console.log('user has joined a room : '+ room);
    });

    socket.on('new message', (newMessageReceived) => {
        let chat = newMessageReceived.chat;

        if (!chat.users) return console.log('chat.users not define');

        chat.users.forEach(user => {
            if (user._id === newMessageReceived.sender._id) return;

            // inside the user's room
            socket.in(user._id).emit('message received', newMessageReceived);
        });
    });

    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

    socket.off('setup', () => {
        console.log('User Disconnected');
        socket.leave(userData._id);
    })

});

httpServer.listen(PORT, () =>
  console.log(`the server is listening at ${PORT}`)
);