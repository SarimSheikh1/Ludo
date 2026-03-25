const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
app.use(express.static('public'));

const gameRooms = new Map();

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ roomId, name, color }) => {
        socket.join(roomId);
        if (!gameRooms.has(roomId)) {
            gameRooms.set(roomId, { id: roomId, players: [], state: null });
        }
        const room = gameRooms.get(roomId);
        if (room.players.length < 4) {
            room.players.push({ id: socket.id, name, color, ready: false });
            io.to(roomId).emit('playerJoined', room.players);
        }
    });

    socket.on('syncGame', ({ roomId, state }) => {
        const room = gameRooms.get(roomId);
        if (room) {
            room.state = state;
            socket.to(roomId).emit('updateState', state);
        }
    });

    socket.on('disconnect', () => {
        for (const [roomId, room] of gameRooms.entries()) {
            room.players = room.players.filter(p => p.id !== socket.id);
            if (room.players.length === 0) gameRooms.delete(roomId);
            else io.to(roomId).emit('playerLeft', room.players);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => console.log(`Server: http://localhost:${PORT}`));
