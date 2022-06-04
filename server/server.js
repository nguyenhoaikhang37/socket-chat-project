import express from "express";
import http from "http";
import cors from "cors";
import {Server} from "socket.io";

import router from "./router.js";
import {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
} from "./users.js";


const PORT = process.env.PORT || 4000

const app = express()
const server = http.createServer(app)
const io = new Server(server, {cors: {origin: '*'}})

// Middleware
app.use(cors())

io.on('connect', (socket) => {
    socket.on('join', ({name, room}, callback) => {
        const {error, user} = addUser({id: socket.id, name, room});

        if (error) return callback(error);

        socket.join(user.room);

        socket.emit('message', {user: 'admin', text: `${user.name}, welcome to room ${user.room}.`});
        socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name} has joined!`});

        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('message', {user: user.name, text: message});

        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', {user: 'Admin', text: `${user.name} has left.`});
            io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});
        }
    })
});

app.use(router)

// Khoa Pham
io.on("connection", (socket) => {
    console.log('Co nguoi ket noi', socket.id)

    socket.on("Client-send-data", (data) => {
        console.log('📌', data)
        io.sockets.emit("Server-send-data", data + " tu server")
    })

    socket.on("disconnect", () => {
        console.log(`${socket.id} da roi khoi phong`)
    })
})

server.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`)
})
