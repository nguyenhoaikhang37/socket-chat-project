import express from 'express';
import http from 'http';
import cors from 'cors';
import {Server} from 'socket.io';

import router from './router.js';
import {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
} from './users.js';


const PORT = process.env.PORT || 4000

const app = express()
const server = http.createServer(app)
const io = new Server(server, {cors: {origin: '*'}})

// Middleware
app.use(cors())

// io.on('connect', (socket) => {
//     socket.on('join', ({name, room}, callback) => {
//         const {error, user} = addUser({id: socket.id, name, room});
//
//         if (error) return callback(error);
//
//         socket.join(user.room);
//
//         socket.emit('message', {user: 'admin', text: `${user.name}, welcome to room ${user.room}.`});
//         socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name} has joined!`});
//
//         io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});
//
//         callback();
//     });
//
//     socket.on('sendMessage', (message, callback) => {
//         const user = getUser(socket.id);
//
//         io.to(user.room).emit('message', {user: user.name, text: message});
//
//         callback();
//     });
//
//     socket.on('disconnect', () => {
//         const user = removeUser(socket.id);
//
//         if (user) {
//             io.to(user.room).emit('message', {user: 'Admin', text: `${user.name} has left.`});
//             io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});
//         }
//     })
// });

app.use(router)

// Khoa Pham

const mangUsers = []
let name;

io.on('connection', (socket) => {
    console.log('Co nguoi ket noi', socket.id)

    socket.on('client-send-name', ({name}) => {
        if (mangUsers.indexOf(name) === -1) {
            socket.name = name
            mangUsers.push({name, id: socket.id})
            io.sockets.emit('server-send-dsUser', mangUsers)
            socket.broadcast.emit('server-send-message', {
                message: `${name} đã vào phòng!`, createdAt: new Date()
            })
        }
    })

    socket.on('client-send-message', ({message, createdAt}) => {
        io.sockets.emit('server-send-message', {message, createdAt, name: socket.name})
    })

    socket.on('disconnect', () => {
        const userIndex = mangUsers.findIndex(el => el.id === socket.id)
        socket.broadcast.emit('server-send-message', {
            message: `${mangUsers[userIndex]?.name} đã rời khỏi phòng!`, createdAt: new Date()
        })
        mangUsers.splice(userIndex, 1)
        io.sockets.emit('server-send-dsUser', mangUsers)
    })
})


server.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`)
})
