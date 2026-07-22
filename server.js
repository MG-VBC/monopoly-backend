import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { rollDice, movePlayer } from './game/logic.js';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Store room and player states
const gameState = {};

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('join_room', (room) => {
        socket.join(room);
        if (!gameState[room]) {
            gameState[room] = { players: {} };
        }

        // Initialize player
        gameState[room].players[socket.id] = {
            id: socket.id,
            position: 0,
            money: 1500
        };

        io.to(room).emit('update_game', gameState[room]);
        console.log(`Player ${socket.id} joined room ${room}`);
    });

    socket.on('roll_dice', (room) => {
        if (gameState[room] && gameState[room].players[socket.id]) {
            const diceValue = rollDice();
            const player = gameState[room].players[socket.id];

            player.position = movePlayer(player.position, diceValue);

            io.to(room).emit('dice_rolled', { player: socket.id, diceValue });
            io.to(room).emit('update_game', gameState[room]);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        // Cleanup logic would go here
    });
});

server.listen(3001, () => {
    console.log('Backend server running on port 3001');
});