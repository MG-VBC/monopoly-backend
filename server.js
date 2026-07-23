import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WINNERS_FILE = path.join(__dirname, 'game', 'winners.json');

const loadWinners = () => {
    try {
        if (fs.existsSync(WINNERS_FILE)) {
            const data = fs.readFileSync(WINNERS_FILE, 'utf8');
            return data ? JSON.parse(data) : {};
        }
    } catch (err) {
        console.error("Failed to load winners file", err);
    }
    return {};
};

const saveWinner = (winnerName) => {
    try {
        const db = loadWinners();
        if (db[winnerName]) {
            db[winnerName].wins += 1;
            db[winnerName].lastWin = new Date().toISOString();
            db[winnerName].pendingShield = true;
        } else {
            db[winnerName] = { wins: 1, lastWin: new Date().toISOString(), pendingShield: true };
        }
        fs.writeFileSync(WINNERS_FILE, JSON.stringify(db, null, 2), 'utf8');
        console.log(`Saved winner: ${winnerName}`);
    } catch (err) {
        console.error("Failed to save winners file", err);
    }
};

const checkAndConsumeShield = (playerName) => {
    try {
        const db = loadWinners();
        if (db[playerName] && db[playerName].pendingShield) {
            db[playerName].pendingShield = false;
            fs.writeFileSync(WINNERS_FILE, JSON.stringify(db, null, 2), 'utf8');
            return true;
        }
    } catch (err) {
        console.error("Failed to check and consume shield", err);
    }
    return false;
};

const cleanPreviousWinnersOfMatch = (roomState) => {
    try {
        const db = loadWinners();
        let changed = false;
        if (roomState && roomState.players) {
            Object.values(roomState.players).forEach(p => {
                if (db[p.name] && !db[p.name].pendingShield) {
                    delete db[p.name];
                    changed = true;
                }
            });
        }
        if (changed) {
            fs.writeFileSync(WINNERS_FILE, JSON.stringify(db, null, 2), 'utf8');
        }
    } catch (err) {
        console.error("Failed to clean previous winners", err);
    }
};
import {
    rollDice,
    movePlayer,
    handlePlayerLanding,
    buildHouse,
    drawCard,
    sellProperty,
    sellHouse,
    mortgageProperty,
    unmortgageProperty,
    calculateRent,
    executeTrade,
    checkStateMonopoly
} from './game/logic.js';
import { boardData, GAME_CONFIG } from './game/properties.js';

const app = express();
app.use(cors());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get('/room/:roomCode/pawns', (req, res) => {
    const roomCode = req.params.roomCode.toUpperCase();
    const roomState = gameState[roomCode];
    if (roomState) {
        const takenPawns = Object.values(roomState.players).map(p => p.pawn);
        res.status(200).json({ takenPawns });
    } else {
        res.status(200).json({ takenPawns: [] });
    }
});

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGIN || "*",
        methods: ["GET", "POST"]
    }
});

// Store room and player states
const gameState = {};
const auctionTimers = {};
const disconnectTimers = {};

// Helper to log game events
const logEvent = (room, text) => {
    if (gameState[room]) {
        if (!gameState[room].log) {
            gameState[room].log = [];
        }
        gameState[room].log.push({
            id: Math.random().toString(36).substr(2, 9),
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
        if (gameState[room].log.length > 40) {
            gameState[room].log.shift();
        }
    }
};

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    const triggerStockMarket = (room, playerId, player) => {
        const roomState = gameState[room];
        if (roomState) {
            roomState.stockGame = {
                playerId: playerId,
                playerName: player.name,
                pawn: player.pawn,
                betAmount: 100,
                direction: null,
                stock: 'TECH 💻',
                status: 'betting'
            };
        }
    };

    socket.on('join_room', (data) => {
        let room = "";
        let playerName = "";
        let startingMoney = 1500;
        let pawn = "🛺";

        if (typeof data === 'object' && data !== null) {
            room = data.room;
            playerName = data.playerName;
            startingMoney = parseInt(data.startingMoney) || 1500;
            pawn = data.pawn || "🛺";
        } else {
            room = data;
        }

        if (!room) return;

        // Verify if room exists and check rules
        if (gameState[room]) {
            if (gameState[room].gameStarted) {
                const isReconnecting = Object.values(gameState[room].players).some(p => p.name === playerName);
                if (!isReconnecting) {
                    socket.emit('error_msg', "This match is already in progress!");
                    return;
                }
            } else {
                const isAlreadyJoined = Object.values(gameState[room].players).some(p => p.name === playerName);
                if (!isAlreadyJoined) {
                    const pawnTaken = Object.values(gameState[room].players).some(p => p.pawn === pawn);
                    if (pawnTaken) {
                        socket.emit('error_msg', `The pawn avatar ${pawn} is already chosen by another player in this room. Please select a different pawn.`);
                        return;
                    }
                }
            }
        }

        socket.join(room);

        // First player joining this room becomes host and establishes settings
        const startCash = Math.min(3000, Math.max(1000, parseInt(startingMoney) || 1500));
        if (!gameState[room]) {
            gameState[room] = {
                roomCode: room, // Persistent room code!
                players: {},
                ownedProperties: {},
                currentTurn: null,
                turnOrder: [],
                log: [],
                boardData,
                startingMoney: startCash,
                hasRolled: false,
                host: socket.id,
                vacationJackpot: 0,
                trades: [],
                gameStarted: false,
                kickVotes: {},
                kickedPlayers: [],  // Track kicked/timed-out names -> spectator only
                exitedPlayers: {}   // Track voluntarily exited players -> saved state for full rejoin
            };
        }

        // Check if player name is banned/kicked in this room (Spectator route)
        const isKicked = gameState[room] && gameState[room].kickedPlayers && gameState[room].kickedPlayers.includes(playerName);
        if (isKicked) {
            socket.join(room);
            logEvent(room, `👁️ ${playerName} joined the boardroom as a spectator.`);
            io.to(room).emit('update_game', gameState[room]);
            console.log(`Player ${socket.id} (${playerName}) joined room ${room} as spectator`);
            return;
        }

        // Check if player voluntarily exited and is now rejoining (Full player restore)
        const exitedState = gameState[room] && gameState[room].exitedPlayers && gameState[room].exitedPlayers[playerName];
        if (exitedState) {
            socket.join(room);

            // Clear disconnect timer if any
            if (disconnectTimers[exitedState.id]) {
                clearTimeout(disconnectTimers[exitedState.id]);
                delete disconnectTimers[exitedState.id];
            }

            // Restore player state under new socket ID
            gameState[room].players[socket.id] = {
                ...exitedState,
                id: socket.id,
                connected: true,
                disconnectsAt: null,
                exited: false
            };

            // Re-insert into turn order if not there
            if (!gameState[room].turnOrder.includes(socket.id)) {
                // Find old ID position and replace, or push to end
                const oldIdx = gameState[room].turnOrder.indexOf(exitedState.id);
                if (oldIdx !== -1) {
                    gameState[room].turnOrder[oldIdx] = socket.id;
                } else {
                    gameState[room].turnOrder.push(socket.id);
                }
            }

            // Remap currentTurn
            if (gameState[room].currentTurn === exitedState.id) {
                gameState[room].currentTurn = socket.id;
            }

            // Remap host
            if (gameState[room].host === exitedState.id) {
                gameState[room].host = socket.id;
            }

            // Remap owned properties
            for (const propId in gameState[room].ownedProperties) {
                if (gameState[room].ownedProperties[propId].owner === exitedState.id) {
                    gameState[room].ownedProperties[propId].owner = socket.id;
                }
            }

            // Remap trades
            if (Array.isArray(gameState[room].trades)) {
                gameState[room].trades.forEach(t => {
                    if (t.senderId === exitedState.id) t.senderId = socket.id;
                    if (t.targetId === exitedState.id) t.targetId = socket.id;
                });
            }

            // Remove from exited list now that they've rejoined
            delete gameState[room].exitedPlayers[playerName];

            logEvent(room, `🔄 ${playerName} returned to the boardroom from their exit!`);
            io.to(room).emit('update_game', gameState[room]);
            return;
        }

        // Check if there is an existing player in this room with the same playerName (Reconnection)
        let existingPlayerId = null;
        if (gameState[room]) {
            existingPlayerId = Object.keys(gameState[room].players).find(
                (id) => gameState[room].players[id].name === playerName
            );
        }

        if (existingPlayerId && gameState[room] && gameState[room].players[existingPlayerId]) {
            // Reconnection path!
            const oldPlayerState = gameState[room].players[existingPlayerId];
            
            // Map state to the new socket id
            gameState[room].players[socket.id] = {
                ...oldPlayerState,
                id: socket.id,
                connected: true,
                disconnectsAt: null
            };
            
            // Delete old socket id entry
            if (existingPlayerId !== socket.id) {
                delete gameState[room].players[existingPlayerId];
            }

            // Clear disconnect timer
            if (disconnectTimers[existingPlayerId]) {
                clearTimeout(disconnectTimers[existingPlayerId]);
                delete disconnectTimers[existingPlayerId];
            }

            // Update references
            // 1. turnOrder
            const turnIdx = gameState[room].turnOrder.indexOf(existingPlayerId);
            if (turnIdx !== -1) {
                gameState[room].turnOrder[turnIdx] = socket.id;
            }

            // 2. currentTurn
            if (gameState[room].currentTurn === existingPlayerId) {
                gameState[room].currentTurn = socket.id;
            }

            // 3. host
            if (gameState[room].host === existingPlayerId) {
                gameState[room].host = socket.id;
            }

            // 4. ownedProperties owners
            for (const propId in gameState[room].ownedProperties) {
                if (gameState[room].ownedProperties[propId].owner === existingPlayerId) {
                    gameState[room].ownedProperties[propId].owner = socket.id;
                }
            }

            // 5. kickVotes
            if (gameState[room].kickVotes) {
                if (gameState[room].kickVotes[existingPlayerId]) {
                    gameState[room].kickVotes[socket.id] = gameState[room].kickVotes[existingPlayerId];
                    delete gameState[room].kickVotes[existingPlayerId];
                }
                for (const targetId in gameState[room].kickVotes) {
                    if (Array.isArray(gameState[room].kickVotes[targetId])) {
                        gameState[room].kickVotes[targetId] = gameState[room].kickVotes[targetId].map(id => id === existingPlayerId ? socket.id : id);
                    }
                }
            }

            // 6. trades
            if (Array.isArray(gameState[room].trades)) {
                gameState[room].trades.forEach(t => {
                    if (t.senderId === existingPlayerId) t.senderId = socket.id;
                    if (t.targetId === existingPlayerId) t.targetId = socket.id;
                });
            }

            logEvent(room, `🔌 ${playerName} reconnected to the board.`);
            io.to(room).emit('update_game', gameState[room]);

        } else if (!gameState[room].players[socket.id]) {
            // New player path!
            if (gameState[room].turnOrder.length >= 6) {
                socket.emit('error_msg', 'Room is full! Maximum 6 players allowed.');
                return;
            }
            const pName = playerName || `Player ${gameState[room].turnOrder.length + 1}`;

            // Check consumable winners database to award Rent Shield for one game only
            let shields = 0;
            const hasShield = checkAndConsumeShield(pName);
            if (hasShield) {
                shields = 1;
                logEvent(room, `🛡️ Last winner ${pName} starts with 1 Rent Shield!`);
            }

            gameState[room].players[socket.id] = {
                id: socket.id,
                name: pName,
                position: 0,
                money: gameState[room].startingMoney,
                inJail: false,
                jailTurns: 0,
                skipNextTurn: false,
                color: getPlayerColor(gameState[room].turnOrder.length),
                pawn: pawn,
                rentShields: shields,
                doublesStreak: 0,
                rentCollected: 0,
                connected: true
            };
            gameState[room].turnOrder.push(socket.id);
            logEvent(room, `${pName} (${pawn}) joined the board.`);
            io.to(room).emit('update_game', gameState[room]);
        }

        console.log(`Player ${socket.id} (${playerName}) joined room ${room} with starting money ${gameState[room].startingMoney}`);
    });

    socket.on('start_game', (room) => {
        const roomState = gameState[room];
        if (roomState && roomState.host === socket.id && !roomState.gameStarted) {
            if (roomState.turnOrder.length < 2) {
                socket.emit('error_msg', "Need at least 2 players to start the game!");
                return;
            }

            // Randomize player order
            const shuffleArray = (array) => {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
            };
            shuffleArray(roomState.turnOrder);

            roomState.gameStarted = true;
            roomState.currentTurn = roomState.turnOrder[0];

            // Re-assign colors based on new turn order
            roomState.turnOrder.forEach((playerId, index) => {
                if (roomState.players[playerId]) {
                    roomState.players[playerId].color = getPlayerColor(index);
                }
            });

            logEvent(room, `🏁 GAME LAUNCHED! Host started the boardroom match.`);
            logEvent(room, `🎲 Play order: ${roomState.turnOrder.map(id => roomState.players[id]?.name || 'Unknown').join(' ➔ ')}`);

            io.to(room).emit('game_launched');
            io.to(room).emit('update_game', roomState);
        }
    });

    socket.on('roll_dice', (room) => {
        const roomState = gameState[room];
        if (roomState && roomState.players[socket.id]) {
            if (roomState.auctionState) {
                socket.emit('error_msg', "Cannot roll dice during an active auction!");
                return;
            }
            if (roomState.currentTurn !== socket.id) {
                socket.emit('error_msg', "It's not your turn!");
                return;
            }

            if (roomState.hasRolled) {
                socket.emit('error_msg', "You have already rolled this turn!");
                return;
            }

            const player = roomState.players[socket.id];

            // Handle player trapped in jail
            if (player.inJail) {
                roomState.hasRolled = true;
                const diceResult = rollDice();
                logEvent(room, `${player.name} rolled for Jail escape: [${diceResult.d1}] and [${diceResult.d2}].`);

                if (diceResult.d1 === diceResult.d2) {
                    player.inJail = false;
                    player.jailTurns = 0;
                    logEvent(room, `🎉 Doubles! ${player.name} escaped Jail for free!`);

                    // Move the player out of jail
                    const movement = movePlayer(player.position, diceResult.total, player);
                    player.position = movement.newPosition;

                    const landingResult = handlePlayerLanding(socket.id, player.position, roomState);
                    let creditorId = null;
                    if (landingResult.action === 'rent_paid') {
                        creditorId = landingResult.ownerId;
                        io.to(room).emit('rent_transaction', {
                            tenantId: socket.id,
                            landlordId: landingResult.ownerId,
                            amount: landingResult.rent
                        });
                    } else if (landingResult.action === 'tax') {
                        creditorId = 'bank';
                        io.to(room).emit('tax_paid', {
                            playerId: socket.id,
                            playerName: player.name,
                            playerPawn: player.pawn,
                            amount: landingResult.amount,
                            taxName: roomState.boardData[player.position]?.name || 'Tax',
                            vacationJackpot: roomState.vacationJackpot || 0
                        });
                    }

                    if (landingResult.action === 'draw_card') {
                        const card = drawCard(socket.id, roomState, landingResult.type);
                        logEvent(room, `${player.name} drew card: ${card.text}`);
                        if (card.amount < 0) {
                            creditorId = 'bank';
                        }
                        io.to(room).emit('card_drawn', { player: socket.id, card });
                    } else if (landingResult.action === 'stock_market') {
                        triggerStockMarket(room, socket.id, player);
                    } else if (landingResult.message) {
                        logEvent(room, landingResult.message);
                    }

                    io.to(room).emit('dice_rolled', {
                        player: socket.id,
                        diceResult,
                        landingResult
                    });

                    // Doubles jail escape grants an extra turn; reset streak
                    player.doublesStreak = 0;
                    roomState.hasRolled = false;
                    logEvent(room, `🎲 Doubles! ${player.name} escaped Jail and gets to roll again!`);

                    io.to(room).emit('update_game', roomState);
                    checkBankruptcy(room, socket.id, creditorId);
                } else {
                    player.jailTurns = (player.jailTurns || 0) + 1;
                    logEvent(room, `❌ No doubles. ${player.name} remains in jail (Turn ${player.jailTurns}/3).`);

                    if (player.jailTurns >= 3) {
                        player.money -= GAME_CONFIG.JAIL_BAIL_FINE;
                        player.inJail = false;
                        player.jailTurns = 0;
                        logEvent(room, `${player.name} paid ₹${GAME_CONFIG.JAIL_BAIL_FINE} fine to get out after 3 failed turns in Jail.`);

                        // Move player
                        const movement = movePlayer(player.position, diceResult.total, player);
                        player.position = movement.newPosition;

                        const landingResult = handlePlayerLanding(socket.id, player.position, roomState);
                        let creditorId = 'bank';
                        if (landingResult.action === 'rent_paid') {
                            creditorId = landingResult.ownerId;
                            io.to(room).emit('rent_transaction', {
                                tenantId: socket.id,
                                landlordId: landingResult.ownerId,
                                amount: landingResult.rent
                            });
                        } else if (landingResult.action === 'tax') {
                            creditorId = 'bank';
                            io.to(room).emit('tax_paid', {
                                playerId: socket.id,
                                playerName: player.name,
                                playerPawn: player.pawn,
                                amount: landingResult.amount,
                                taxName: roomState.boardData[player.position]?.name || 'Tax',
                                vacationJackpot: roomState.vacationJackpot || 0
                            });
                        }

                        if (landingResult.action === 'draw_card') {
                            const card = drawCard(socket.id, roomState, landingResult.type);
                            logEvent(room, `${player.name} drew card: ${card.text}`);
                            if (card.amount < 0) {
                                creditorId = 'bank';
                            }
                            io.to(room).emit('card_drawn', { player: socket.id, card });
                        } else if (landingResult.action === 'stock_market') {
                            triggerStockMarket(room, socket.id, player);
                        } else if (landingResult.message) {
                            logEvent(room, landingResult.message);
                        }

                        io.to(room).emit('dice_rolled', {
                            player: socket.id,
                            diceResult,
                            landingResult
                        });

                        io.to(room).emit('update_game', roomState);
                        checkBankruptcy(room, socket.id, creditorId);
                    } else {
                        // Failed escape, stays on Jail tile
                        io.to(room).emit('dice_rolled', {
                            player: socket.id,
                            diceResult,
                            failedJailEscape: true
                        });
                        io.to(room).emit('update_game', roomState);
                    }
                }
                return;
            }

            // Normal movement roll
            const diceResult = rollDice();
            const isDoubles = diceResult.d1 === diceResult.d2;

            // Track consecutive doubles streak
            if (isDoubles) {
                player.doublesStreak = (player.doublesStreak || 0) + 1;
            } else {
                player.doublesStreak = 0;
            }

            // Three consecutive doubles → sent to Jail!
            if (player.doublesStreak >= 3) {
                player.doublesStreak = 0;
                player.position = 10;
                player.inJail = true;
                player.jailTurns = 0;
                player.jailVisits = (player.jailVisits || 0) + 1;
                roomState.hasRolled = true;
                logEvent(room, `${player.name} rolled: ${diceResult.total} ([${diceResult.d1}] + [${diceResult.d2}]).`);
                logEvent(room, `🚨 3 doubles in a row! ${player.name} is sent straight to Jail!`);
                io.to(room).emit('dice_rolled', { player: socket.id, diceResult, landingResult: { action: 'jail', message: '3 doubles in a row — Sent to Jail!' } });
                io.to(room).emit('update_game', roomState);
                return;
            }

            roomState.hasRolled = true;
            logEvent(room, `${player.name} rolled: ${diceResult.total} ([${diceResult.d1}] + [${diceResult.d2}]).`);

            const movement = movePlayer(player.position, diceResult.total, player);
            player.position = movement.newPosition;

            if (movement.passedGo) {
                logEvent(room, `${player.name} passed START and collected ₹${GAME_CONFIG.PASS_GO_REWARD}.`);
            }

            const landingResult = handlePlayerLanding(socket.id, player.position, roomState);
            let creditorId = null;
            if (landingResult.action === 'rent_paid') {
                creditorId = landingResult.ownerId;
                io.to(room).emit('rent_transaction', {
                    tenantId: socket.id,
                    landlordId: landingResult.ownerId,
                    amount: landingResult.rent
                });
            } else if (landingResult.action === 'tax') {
                creditorId = 'bank';
                io.to(room).emit('tax_paid', {
                    playerId: socket.id,
                    playerName: player.name,
                    playerPawn: player.pawn,
                    amount: landingResult.amount,
                    taxName: roomState.boardData[player.position]?.name || 'Tax',
                    vacationJackpot: roomState.vacationJackpot || 0
                });
            }

            if (landingResult.action === 'draw_card') {
                const card = drawCard(socket.id, roomState, landingResult.type);
                logEvent(room, `${player.name} drew card: ${card.text}`);
                if (card.amount < 0) {
                    creditorId = 'bank';
                }
                io.to(room).emit('card_drawn', {
                    player: socket.id,
                    card
                });
            } else if (landingResult.action === 'stock_market') {
                triggerStockMarket(room, socket.id, player);
            } else if (landingResult.message) {
                logEvent(room, landingResult.message);
            }

            io.to(room).emit('dice_rolled', {
                player: socket.id,
                diceResult,
                landingResult
            });

            // Grant extra turn on doubles (unless player was sent to jail by landing)
            if (isDoubles && !player.inJail && landingResult.action !== 'jail') {
                roomState.hasRolled = false;
                logEvent(room, `🎲 Doubles! ${player.name} gets to roll again!`);
            }

            io.to(room).emit('update_game', roomState);
            checkBankruptcy(room, socket.id, creditorId);
        }
    });

    socket.on('buy_property', (room) => {
        const roomState = gameState[room];
        if (roomState && roomState.players[socket.id]) {
            if (roomState.auctionState) {
                socket.emit('error_msg', "Cannot buy property during an active auction!");
                return;
            }
            if (roomState.currentTurn !== socket.id) return;
            if (!roomState.hasRolled) {
                socket.emit('error_msg', 'You must roll the dice before buying a property!');
                return;
            }

            const player = roomState.players[socket.id];
            const tile = boardData[player.position];

            if (!tile || (tile.type !== 'property' && tile.type !== 'airport' && tile.type !== 'utility')) return;
            if (roomState.ownedProperties[tile.id]) return;

            if (player.money >= tile.price) {
                player.money -= tile.price;

                const ownedPropsBackup = { ...roomState.ownedProperties };
                const wasAlreadyMonopoly = checkStateMonopoly(socket.id, tile.state, { ...roomState, ownedProperties: ownedPropsBackup });

                roomState.ownedProperties[tile.id] = {
                    owner: socket.id,
                    houses: 0,
                    mortgaged: false
                };

                const isNowMonopoly = checkStateMonopoly(socket.id, tile.state, roomState);

                logEvent(room, `${player.name} bought ${tile.name} for ₹${tile.price}.`);

                io.to(room).emit('property_purchased', {
                    playerName: player.name,
                    playerPawn: player.pawn,
                    propertyName: tile.name,
                    propertyPrice: tile.price,
                    propertyIcon: tile.icon,
                    propertyColor: tile.color,
                    propertyState: tile.state
                });

                if (isNowMonopoly && !wasAlreadyMonopoly && tile.type === 'property') {
                    logEvent(room, `🏢 MONOPOLY ACHIEVED! ${player.name} now owns all of ${tile.state}!`);
                    io.to(room).emit('monopoly_achieved', {
                        playerName: player.name,
                        playerPawn: player.pawn,
                        stateName: tile.state
                    });
                }

                io.to(room).emit('update_game', roomState);
            } else {
                socket.emit('error_msg', "Insufficient funds!");
            }
        }
    });

    socket.on('build_house', (data) => {
        let room = "";
        let propertyId = null;
        if (typeof data === 'object') {
            room = data.room;
            propertyId = data.propertyId;
        }

        const roomState = gameState[room];
        if (roomState && roomState.players[socket.id]) {
            if (roomState.currentTurn !== socket.id) {
                socket.emit('error_msg', "You can only perform property upgrades/actions during your own active turn!");
                return;
            }
            if (roomState.auctionState) {
                socket.emit('error_msg', "Cannot build upgrades during an active auction!");
                return;
            }
            const result = buildHouse(socket.id, propertyId, roomState);
            if (result.success) {
                logEvent(room, `${roomState.players[socket.id].name} upgraded ${boardData[propertyId].name}. ${result.message}`);
                io.to(room).emit('update_game', roomState);
            } else {
                socket.emit('error_msg', result.message);
            }
        }
    });

    socket.on('sell_property', (data) => {
        let room = "";
        let propertyId = null;
        if (typeof data === 'object') {
            room = data.room;
            propertyId = data.propertyId;
        }

        const roomState = gameState[room];
        if (roomState && roomState.players[socket.id]) {
            if (roomState.currentTurn !== socket.id) {
                socket.emit('error_msg', "You can only perform property upgrades/actions during your own active turn!");
                return;
            }
            if (roomState.auctionState) {
                socket.emit('error_msg', "Cannot sell property during an active auction!");
                return;
            }
            const result = sellProperty(socket.id, propertyId, roomState);
            if (result.success) {
                logEvent(room, `${roomState.players[socket.id].name} sold ${boardData[propertyId].name}. ${result.message}`);
                io.to(room).emit('update_game', roomState);
            } else {
                socket.emit('error_msg', result.message);
            }
        }
    });

    socket.on('sell_house', (data) => {
        let room = "";
        let propertyId = null;
        if (typeof data === 'object') {
            room = data.room;
            propertyId = data.propertyId;
        }

        const roomState = gameState[room];
        if (roomState && roomState.players[socket.id]) {
            if (roomState.currentTurn !== socket.id) {
                socket.emit('error_msg', "You can only perform property upgrades/actions during your own active turn!");
                return;
            }
            if (roomState.auctionState) {
                socket.emit('error_msg', "Cannot sell upgrades during an active auction!");
                return;
            }
            const result = sellHouse(socket.id, propertyId, roomState);
            if (result.success) {
                logEvent(room, `${roomState.players[socket.id].name} sold house/upgrade on ${boardData[propertyId].name}. ${result.message}`);
                io.to(room).emit('update_game', roomState);
            } else {
                socket.emit('error_msg', result.message);
            }
        }
    });

    socket.on('mortgage_property', (data) => {
        let room = "";
        let propertyId = null;
        if (typeof data === 'object') {
            room = data.room;
            propertyId = data.propertyId;
        }

        const roomState = gameState[room];
        if (roomState && roomState.players[socket.id]) {
            if (roomState.currentTurn !== socket.id) {
                socket.emit('error_msg', "You can only perform property upgrades/actions during your own active turn!");
                return;
            }
            if (roomState.auctionState) {
                socket.emit('error_msg', "Cannot mortgage property during an active auction!");
                return;
            }
            const result = mortgageProperty(socket.id, propertyId, roomState);
            if (result.success) {
                logEvent(room, `${roomState.players[socket.id].name} mortgaged ${boardData[propertyId].name}. ${result.message}`);
                io.to(room).emit('update_game', roomState);
            } else {
                socket.emit('error_msg', result.message);
            }
        }
    });

    socket.on('unmortgage_property', (data) => {
        let room = "";
        let propertyId = null;
        if (typeof data === 'object') {
            room = data.room;
            propertyId = data.propertyId;
        }

        const roomState = gameState[room];
        if (roomState && roomState.players[socket.id]) {
            if (roomState.currentTurn !== socket.id) {
                socket.emit('error_msg', "You can only perform property upgrades/actions during your own active turn!");
                return;
            }
            if (roomState.auctionState) {
                socket.emit('error_msg', "Cannot unmortgage property during an active auction!");
                return;
            }
            const result = unmortgageProperty(socket.id, propertyId, roomState);
            if (result.success) {
                logEvent(room, `${roomState.players[socket.id].name} unmortgaged ${boardData[propertyId].name}. ${result.message}`);
                io.to(room).emit('update_game', roomState);
            } else {
                socket.emit('error_msg', result.message);
            }
        }
    });

    socket.on('pay_bail', (room) => {
        const roomState = gameState[room];
        if (roomState && roomState.players[socket.id]) {
            if (roomState.auctionState) {
                socket.emit('error_msg', "Cannot pay bail during an active auction!");
                return;
            }
            if (roomState.currentTurn !== socket.id) {
                socket.emit('error_msg', "You can only pay bail on your own turn!");
                return;
            }
            const player = roomState.players[socket.id];
            if (player.inJail && player.money >= GAME_CONFIG.JAIL_BAIL_FINE) {
                player.money -= GAME_CONFIG.JAIL_BAIL_FINE;
                player.inJail = false;
                player.jailTurns = 0;
                logEvent(room, `${player.name} paid ₹${GAME_CONFIG.JAIL_BAIL_FINE} bail fine to escape Jail!`);
                io.to(room).emit('update_game', roomState);
                checkBankruptcy(room, socket.id, 'bank');
            } else {
                socket.emit('error_msg', "Cannot pay bail! Insufficient funds.");
            }
        }
    });

    socket.on('end_turn', (room) => {
        const roomState = gameState[room];
        if (roomState && roomState.currentTurn === socket.id) {
            if (roomState.auctionState) {
                socket.emit('error_msg', "Cannot end turn during an active auction!");
                return;
            }
            if (!roomState.hasRolled) {
                socket.emit('error_msg', "You must roll the dice before ending your turn!");
                return;
            }

            roomState.hasRolled = false;
            // Reset doubles streak when the turn ends
            if (roomState.players[socket.id]) {
                roomState.players[socket.id].doublesStreak = 0;
            }

            // Determine next index and check if that player has skipNextTurn active
            let currentIndex = roomState.turnOrder.indexOf(socket.id);
            if (currentIndex === -1) currentIndex = 0;

            let nextIndex = (currentIndex + 1) % roomState.turnOrder.length;
            let nextPlayerId = roomState.turnOrder[nextIndex];
            let nextPlayer = roomState.players[nextPlayerId];

            let attempts = 0;
            // Safely loop to skip missing or vacationing players (prevent null reference crashes)
            while ((!nextPlayer || nextPlayer.skipNextTurn) && attempts < roomState.turnOrder.length) {
                if (nextPlayer && nextPlayer.skipNextTurn) {
                    logEvent(room, `🌴 ${nextPlayer.name} is enjoying their Vacation and skips this round!`);
                    nextPlayer.skipNextTurn = false; // Reset the flag
                }
                nextIndex = (nextIndex + 1) % roomState.turnOrder.length;
                nextPlayerId = roomState.turnOrder[nextIndex];
                nextPlayer = roomState.players[nextPlayerId];
                attempts++;
            }

            if (nextPlayer) {
                roomState.currentTurn = nextPlayerId;
                logEvent(room, `It is now ${nextPlayer.name}'s turn.`);
            } else {
                roomState.currentTurn = roomState.turnOrder[0] || null;
            }
            io.to(room).emit('update_game', roomState);
        }
    });

    socket.on('propose_trade', (data) => {
        const { room, targetPlayerId, offer } = data;
        const roomState = gameState[room];
        if (roomState && roomState.players[socket.id] && roomState.players[targetPlayerId]) {
            if (roomState.auctionState) {
                socket.emit('error_msg', "Cannot propose trade during an active auction!");
                return;
            }
            if (roomState.players[socket.id].isBankrupt) {
                socket.emit('error_msg', "Bankrupt players cannot propose trades!");
                return;
            }
            if (roomState.players[targetPlayerId].isBankrupt) {
                socket.emit('error_msg', "Cannot trade with a bankrupt player!");
                return;
            }
            const sender = roomState.players[socket.id];
            const receiver = roomState.players[targetPlayerId];

            // Sanitize cash parameters in trade offers/requests to prevent NaN corruption
            const offerCash = parseInt(offer.offerCash) || 0;
            const requestCash = parseInt(offer.requestCash) || 0;
            offer.offerCash = isNaN(offerCash) ? 0 : Math.max(0, offerCash);
            offer.requestCash = isNaN(requestCash) ? 0 : Math.max(0, requestCash);

            const tradeId = `trade_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            if (!roomState.trades) roomState.trades = [];

            const newTrade = {
                id: tradeId,
                senderId: socket.id,
                senderName: sender.name,
                senderPawn: sender.pawn,
                targetId: targetPlayerId,
                targetName: receiver.name,
                targetPawn: receiver.pawn,
                offer,
                status: 'active'
            };

            roomState.trades.push(newTrade);

            io.to(targetPlayerId).emit('trade_proposed', {
                tradeId,
                senderId: socket.id,
                senderName: sender.name,
                senderPawn: sender.pawn,
                offer
            });
            io.to(room).emit('update_game', roomState);
        }
    });

    socket.on('accept_trade', (data) => {
        const { room, tradeId } = data;
        const roomState = gameState[room];
        if (roomState && roomState.trades) {
            if (roomState.auctionState) {
                socket.emit('error_msg', "Cannot accept trade during an active auction!");
                return;
            }
            const trade = roomState.trades.find(t => t.id === tradeId && t.status === 'active');
            if (trade) {
                if (trade.targetId !== socket.id) {
                    socket.emit('error_msg', "Only the intended recipient can accept this trade!");
                    return;
                }
                const result = executeTrade(trade.senderId, trade.targetId, trade.offer, roomState);
                if (result.success) {
                    trade.status = 'done';
                    logEvent(room, `🤝 TRADE COMPLETE! ${trade.senderName} and ${trade.targetName} swapped assets.`);

                    io.to(room).emit('trade_completed', {
                        playerAName: trade.senderName,
                        playerAPawn: trade.senderPawn,
                        playerBName: trade.targetName,
                        playerBPawn: trade.targetPawn,
                        offer: trade.offer
                    });
                    io.to(room).emit('update_game', roomState);
                } else {
                    socket.emit('error_msg', result.message);
                }
            }
        }
    });

    socket.on('reject_trade', (data) => {
        const { room, tradeId } = data;
        const roomState = gameState[room];
        if (roomState && roomState.trades) {
            const trade = roomState.trades.find(t => t.id === tradeId && t.status === 'active');
            if (trade) {
                trade.status = 'declined';
                logEvent(room, `❌ Trade offer declined between ${trade.senderName} and ${trade.targetName}.`);
                io.to(trade.senderId).emit('error_msg', `${trade.targetName} rejected your trade offer.`);
                io.to(room).emit('update_game', roomState);
            }
        }
    });

    socket.on('use_rent_shield', (room) => {
        const roomState = gameState[room];
        if (roomState && roomState.players[socket.id]) {
            if (roomState.auctionState) {
                socket.emit('error_msg', "Cannot use rent shield during an active auction!");
                return;
            }
            const player = roomState.players[socket.id];
            if (player.rentShields > 0) {
                player.rentShields--;
                logEvent(room, `🛡️ ${player.name} used a Rent Shield to waive rent!`);

                const tile = boardData[player.position];
                const ownedProp = roomState.ownedProperties[tile.id];
                if (ownedProp) {
                    const rent = calculateRent(tile.id, roomState);
                    // Refund tenant from the bank — do NOT deduct from landlord
                    player.money += rent;
                    logEvent(room, `🛡️ Rent of ₹${rent} refunded by the bank.`);
                }
                io.to(room).emit('update_game', roomState);
            }
        }
    });

    socket.on('submit_stock_bet', (data) => {
        const { room, stock, betAmount, direction } = data;
        const roomState = gameState[room];
        if (roomState && roomState.stockGame && roomState.stockGame.playerId === socket.id && roomState.stockGame.status === 'betting') {
            if (roomState.auctionState) {
                socket.emit('error_msg', "Cannot submit stock bet during an active auction!");
                return;
            }
            const player = roomState.players[socket.id];
            if (!player) return;
            if (betAmount <= 0) {
                socket.emit('error_msg', 'Bet amount must be greater than zero!');
                return;
            }
            if (betAmount > player.money) {
                socket.emit('error_msg', `Insufficient funds! You only have ₹${player.money}.`);
                return;
            }
            const outcome = Math.random() > 0.5 ? 'up' : 'down';

            roomState.stockGame.status = 'resolved';
            roomState.stockGame.outcome = outcome;
            roomState.stockGame.stock = stock;
            roomState.stockGame.betAmount = betAmount;
            roomState.stockGame.direction = direction;

            if (player) {
                if (direction === outcome) {
                    player.money += betAmount * 2;
                    logEvent(room, `📈 STOCK WIN! ${player.name} predicted ${stock} would go ${direction.toUpperCase()} and won ₹${betAmount * 2}!`);
                } else {
                    player.money -= betAmount;
                    logEvent(room, `📉 STOCK LOSS! ${player.name} predicted ${stock} would go ${direction.toUpperCase()} and lost ₹${betAmount}.`);
                }
            }

            io.to(room).emit('update_game', roomState);
            checkBankruptcy(room, socket.id, 'bank');

            setTimeout(() => {
                if (roomState.stockGame && roomState.stockGame.playerId === socket.id) {
                    roomState.stockGame = null;
                    io.to(room).emit('update_game', roomState);
                }
            }, 1500);
        }
    });

    socket.on('submit_bid', (data) => {
        const { room, bidAmount } = data;
        const roomState = gameState[room];
        if (roomState && roomState.auctionState) {
            const auction = roomState.auctionState;
            const player = roomState.players[socket.id];
            if (!player || player.isBankrupt) return;

            if (auction.passes && auction.passes.includes(socket.id)) {
                socket.emit('error_msg', "You have already passed this auction and cannot bid again!");
                return;
            }

            if (player.money < bidAmount) {
                socket.emit('error_msg', "Insufficient funds!");
                return;
            }
            if (bidAmount <= auction.highestBid) {
                socket.emit('error_msg', "Bid must exceed current highest bid!");
                return;
            }

            auction.highestBid = bidAmount;
            auction.highestBidder = socket.id;

            logEvent(room, `🔨 ${player.name} placed a bid of ₹${bidAmount}`);
            io.to(room).emit('bid_updated', {
                highestBid: auction.highestBid,
                highestBidder: socket.id,
                highestBidderName: player.name
            });
            io.to(room).emit('update_game', roomState);
        }
    });

    socket.on('declare_bankruptcy', (room) => {
        const roomState = gameState[room];
        if (roomState && roomState.players[socket.id]) {
            if (roomState.players[socket.id].isBankrupt) return;
            if (roomState.auctionState) {
                socket.emit('error_msg', "Cannot declare bankruptcy during an active auction!");
                return;
            }
            handleBankruptcy(room, socket.id, null);
        }
    });

    socket.on('pass_auction', (room) => {
        const roomState = gameState[room];
        if (roomState && roomState.auctionState) {
            const auction = roomState.auctionState;
            if (roomState.players[socket.id] && !roomState.players[socket.id].isBankrupt) {
                if (!auction.passes) auction.passes = [];
                if (!auction.passes.includes(socket.id)) {
                    auction.passes.push(socket.id);
                    logEvent(room, `🙋 ${roomState.players[socket.id].name} is not interested in the auction.`);
                    checkEarlyAuctionFinish(room, roomState);
                }
            }
        }
    });

    socket.on('vote_kick', (data) => {
        const { room, targetPlayerId } = data;
        const roomState = gameState[room];
        if (roomState && roomState.players[socket.id] && roomState.players[targetPlayerId]) {
            if (socket.id === targetPlayerId) {
                socket.emit('error_msg', "You cannot vote to kick yourself!");
                return;
            }

            if (!roomState.kickVotes) roomState.kickVotes = {};
            if (!roomState.kickVotes[targetPlayerId]) {
                roomState.kickVotes[targetPlayerId] = [];
            }

            if (roomState.kickVotes[targetPlayerId].includes(socket.id)) {
                socket.emit('error_msg', "You have already voted to kick this player!");
                return;
            }

            roomState.kickVotes[targetPlayerId].push(socket.id);
            const voteCount = roomState.kickVotes[targetPlayerId].length;

            const activePlayers = Object.keys(roomState.players);
            const threshold = Math.max(1, Math.ceil(activePlayers.length / 2));

            const targetName = roomState.players[targetPlayerId].name;
            logEvent(room, `🥾 KICK VOTE! ${roomState.players[socket.id].name} voted to kick ${targetName} (${voteCount}/${threshold} votes).`);
            io.to(room).emit('update_game', roomState);

            if (voteCount >= threshold) {
                logEvent(room, `🥾 KICKED! ${targetName} has been kicked by boardroom vote.`);
                io.to(targetPlayerId).emit('kicked');

                // Track in kickedPlayers to route them as spectators if they try to rejoin
                if (!roomState.kickedPlayers) roomState.kickedPlayers = [];
                if (!roomState.kickedPlayers.includes(targetName)) {
                    roomState.kickedPlayers.push(targetName);
                }

                removePlayerImmediately(room, targetPlayerId);
            }
        }
    });

    const removePlayerImmediately = (room, playerId) => {
        const roomState = gameState[room];
        if (!roomState) return;
        const player = roomState.players[playerId];
        if (!player) return;
        
        const playerName = player.name;
        
        // Add to kickedPlayers list (prevent active re-joins, allow spectating)
        if (!roomState.kickedPlayers) roomState.kickedPlayers = [];
        if (!roomState.kickedPlayers.includes(playerName)) {
            roomState.kickedPlayers.push(playerName);
        }

        // Clear property ownerships
        for (const propId in roomState.ownedProperties) {
            if (roomState.ownedProperties[propId].owner === playerId) {
                delete roomState.ownedProperties[propId];
            }
        }

        // Clean kick votes
        delete roomState.kickVotes?.[playerId];
        if (roomState.kickVotes) {
            for (const targetId in roomState.kickVotes) {
                if (Array.isArray(roomState.kickVotes[targetId])) {
                    roomState.kickVotes[targetId] = roomState.kickVotes[targetId].filter(id => id !== playerId);
                }
            }
        }

        // Remove player
        roomState.turnOrder = roomState.turnOrder.filter(id => id !== playerId);
        delete roomState.players[playerId];

        if (roomState.auctionState) {
            const auction = roomState.auctionState;
            if (auction.passes) {
                auction.passes = auction.passes.filter(id => id !== playerId);
            }
            if (auction.highestBidder === playerId) {
                auction.highestBidder = null;
            }
            if (checkEarlyAuctionFinish(room, roomState)) {
                return;
            }
        }

        logEvent(room, `${playerName} left the board.`);

        if (roomState.turnOrder.length === 0) {
            delete gameState[room];
            if (auctionTimers[room]) {
                clearTimeout(auctionTimers[room]);
                delete auctionTimers[room];
            }
        } else {
            // Check if only 1 player remains in the active game
            const activePlayers = Object.keys(roomState.players);
            if (roomState.gameStarted && activePlayers.length === 1) {
                const winnerId = activePlayers[0];
                const winner = roomState.players[winnerId];
                if (winner) {
                    roomState.winner = winnerId;
                    roomState.lastWinnerName = winner.name;
                    logEvent(room, `🏆 MATCH OVER! Everyone else left. ${winner.name} won!`);
                    
                    cleanPreviousWinnersOfMatch(roomState);
                    saveWinner(winner.name);
                    
                    io.to(room).emit('game_over', { winnerId, winnerName: winner.name });
                }
            } else {
                if (roomState.currentTurn === playerId) {
                    roomState.hasRolled = false;
                    roomState.currentTurn = roomState.turnOrder[0];
                    const nextPlayer = roomState.players[roomState.currentTurn];
                    if (nextPlayer) {
                        nextPlayer.doublesStreak = 0;
                        logEvent(room, `It is now ${nextPlayer.name}'s turn.`);
                    }
                }
            }
            io.to(room).emit('update_game', roomState);
        }
    };

    // Voluntary exit: pause player state, allow full rejoin later
    socket.on('exit_game', (room) => {
        const roomState = gameState[room];
        if (!roomState || !roomState.players[socket.id]) return;

        const player = roomState.players[socket.id];
        const playerName = player.name;

        // Save full player state under their name key
        if (!roomState.exitedPlayers) roomState.exitedPlayers = {};
        roomState.exitedPlayers[playerName] = {
            ...player,
            exited: true
        };

        // Remove from active turn order & players map
        roomState.turnOrder = roomState.turnOrder.filter(id => id !== socket.id);
        delete roomState.players[socket.id];

        // Keep their property ownerships intact under old socket ID so they can reclaim on rejoin
        // (remap happens in join_room exitedState block)

        logEvent(room, `🚪 ${playerName} exited the boardroom. They can rejoin to continue.`);

        // Handle turn progression if it was their turn
        if (roomState.currentTurn === socket.id) {
            roomState.hasRolled = false;
            if (roomState.turnOrder.length > 0) {
                roomState.currentTurn = roomState.turnOrder[0];
                const nextPlayer = roomState.players[roomState.currentTurn];
                if (nextPlayer) logEvent(room, `It is now ${nextPlayer.name}'s turn.`);
            }
        }

        // Check if only 1 active player remains
        const activePlayers = Object.keys(roomState.players);
        if (roomState.gameStarted && activePlayers.length === 1) {
            const winnerId = activePlayers[0];
            const winner = roomState.players[winnerId];
            if (winner) {
                roomState.winner = winnerId;
                roomState.lastWinnerName = winner.name;
                logEvent(room, `🏆 MATCH OVER! Everyone else left. ${winner.name} won!`);
                cleanPreviousWinnersOfMatch(roomState);
                saveWinner(winner.name);
                io.to(room).emit('game_over', { winnerId, winnerName: winner.name });
                return;
            }
        } else if (activePlayers.length === 0) {
            delete gameState[room];
        }

        // Guard: room may have been deleted above
        if (gameState[room]) {
            io.to(room).emit('update_game', roomState);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        for (const room in gameState) {
            const roomState = gameState[room];
            if (roomState.players[socket.id]) {
                const playerName = roomState.players[socket.id].name;
                
                // If game hasn't started yet, remove player immediately
                if (!roomState.gameStarted) {
                    removePlayerImmediately(room, socket.id);
                } else {
                    // Game is in progress, give them 60 seconds reconnection window
                    roomState.players[socket.id].connected = false;
                    roomState.players[socket.id].disconnectsAt = Date.now() + 60000;

                    // Clear stock market if this disconnected player was the active bettor
                    if (roomState.stockGame && roomState.stockGame.playerId === socket.id) {
                        roomState.stockGame = null;
                        logEvent(room, `📉 Stock market cancelled — ${playerName} disconnected.`);
                    }
                    
                    logEvent(room, `⚠️ ${playerName} disconnected. Reconnection window: 60s.`);
                    io.to(room).emit('update_game', roomState);
                    
                    const disconnectPlayerId = socket.id;
                    const disconnectRoom = room;
                    
                    const timeout = setTimeout(() => {
                        const rState = gameState[disconnectRoom];
                        if (rState && rState.players[disconnectPlayerId] && !rState.players[disconnectPlayerId].connected) {
                            logEvent(disconnectRoom, `⏰ Reconnection window expired. Kicking ${playerName} from the boardroom.`);
                            removePlayerImmediately(disconnectRoom, disconnectPlayerId);
                        }
                    }, 60000);
                    
                    disconnectTimers[disconnectPlayerId] = timeout;
                }
            }
        }
    });
});

const checkEarlyAuctionFinish = (room, roomState) => {
    const auction = roomState.auctionState;
    if (!auction) return false;

    const activeBidders = Object.keys(roomState.players).filter(id => !roomState.players[id].isBankrupt);
    if (activeBidders.length === 0) {
        if (auctionTimers[room]) {
            clearTimeout(auctionTimers[room]);
            delete auctionTimers[room];
        }
        finishCurrentAuction(room);
        return true;
    }

    if (!auction.passes) auction.passes = [];

    const allPassed = auction.passes.length >= activeBidders.length;

    let allOthersPassed = false;
    if (auction.highestBidder) {
        const others = activeBidders.filter(id => id !== auction.highestBidder);
        const othersWhoPassed = others.filter(id => auction.passes.includes(id));
        if (othersWhoPassed.length === others.length) {
            allOthersPassed = true;
        }
    }

    if (allPassed || allOthersPassed) {
        logEvent(room, `⚡ Auction ended early: ${allPassed ? 'All players passed' : 'No other active bidders remaining'}.`);
        if (auctionTimers[room]) {
            clearTimeout(auctionTimers[room]);
            delete auctionTimers[room];
        }
        finishCurrentAuction(room);
        return true;
    }

    io.to(room).emit('update_game', roomState);
    return false;
};

const checkBankruptcy = (room, playerId, creditorId) => {
    const roomState = gameState[room];
    if (!roomState) return;
    const player = roomState.players[playerId];
    if (player && player.money <= -1500) {
        handleBankruptcy(room, playerId, creditorId);
    }
};

const handleBankruptcy = (room, playerId, creditorId) => {
    const roomState = gameState[room];
    if (!roomState) return;
    const player = roomState.players[playerId];
    if (!player || player.isBankrupt) return;

    logEvent(room, `🚨 BANKRUPTCY! ${player.name} (${player.pawn}) goes bankrupt at ₹${player.money}!`);

    const playerProperties = Object.keys(roomState.ownedProperties)
        .filter(propId => roomState.ownedProperties[propId].owner === playerId)
        .map(Number);

    player.isBankrupt = true;
    roomState.turnOrder = roomState.turnOrder.filter(id => id !== playerId);

    if (playerProperties.length > 0) {
        // Calculate dynamic starting bid based on player's money state
        let dynamicStartingBid = 0;
        if (player.money < 0) {
            dynamicStartingBid = Math.abs(player.money);
        } else {
            dynamicStartingBid = playerProperties.reduce((sum, propId) => sum + (boardData[propId]?.price || 0), 0);
        }

        roomState.auctionState = {
            bankruptPlayerId: playerId,
            creditorId: creditorId,
            propertiesToAuction: playerProperties,
            currentPropIdx: 0,
            baseStartingBid: dynamicStartingBid, // Store calculated minimum bid
            highestBid: Math.min(100, dynamicStartingBid), // Lower starting bid to ensure it is bid-able
            highestBidder: null,
            bids: {},
            endsAt: Date.now() + 30000 // Ends in 30 seconds
        };
        startNextAuction(room);
    } else {
        if (creditorId && creditorId !== 'bank' && roomState.players[creditorId] && player.money < 0) {
            const debtAmount = Math.abs(player.money);
            roomState.players[creditorId].money += debtAmount;
            logEvent(room, `💸 Bank paid creditor ${roomState.players[creditorId].name} ₹${debtAmount} directly as ${player.name} went bankrupt with no assets.`);
        }
        finalizeBankruptcy(room, playerId);
    }
};

const startNextAuction = (room) => {
    const roomState = gameState[room];
    if (!roomState) return;
    const auction = roomState.auctionState;
    if (!auction) return;

    logEvent(room, `🔨 Package auction started for ${auction.propertiesToAuction.length} properties! Min Bid: ₹${auction.highestBid}`);
    io.to(room).emit('auction_started', {
        properties: auction.propertiesToAuction,
        startingBid: auction.highestBid,
        bankruptPlayerId: auction.bankruptPlayerId,
        creditorId: auction.creditorId
    });

    if (auctionTimers[room]) {
        clearTimeout(auctionTimers[room]);
    }
    auctionTimers[room] = setTimeout(() => {
        finishCurrentAuction(room);
    }, 30000); // Changed to 30 seconds

    // CRITICAL: Emit update_game so the clients render the full-screen auction modal immediately
    io.to(room).emit('update_game', roomState);
};

const finishCurrentAuction = (room) => {
    const roomState = gameState[room];
    if (!roomState) return;
    const auction = roomState.auctionState;
    if (!auction) return;

    const player = roomState.players[auction.bankruptPlayerId];
    const creditorId = auction.creditorId;

    if (auction.highestBidder && roomState.players[auction.highestBidder]) {
        const winner = roomState.players[auction.highestBidder];
        winner.money -= auction.highestBid;

        // Transfer all properties to the winner
        auction.propertiesToAuction.forEach(propId => {
            if (!roomState.ownedProperties[propId]) {
                roomState.ownedProperties[propId] = {};
            }
            roomState.ownedProperties[propId].owner = auction.highestBidder;
            roomState.ownedProperties[propId].houses = 0;
            roomState.ownedProperties[propId].mortgaged = false;
        });

        // Pay the creditor player the highest bid
        if (creditorId && creditorId !== 'bank' && roomState.players[creditorId]) {
            roomState.players[creditorId].money += auction.highestBid;
            logEvent(room, `💸 Creditor ${roomState.players[creditorId].name} received ₹${auction.highestBid} from the auction.`);
        }

        logEvent(room, `🔨 ${winner.name} won the package auction of ${auction.propertiesToAuction.length} properties for ₹${auction.highestBid}!`);
    } else {
        // NO BODY BUYS IN THE AUCTION
        // Unlock all properties (remove them from ownedProperties)
        auction.propertiesToAuction.forEach(propId => {
            delete roomState.ownedProperties[propId];
        });

        // If bankrupt in negative money due to a player, pay the creditor player their negative money from Bank
        if (creditorId && creditorId !== 'bank' && roomState.players[creditorId] && player && player.money < 0) {
            const debtAmount = Math.abs(player.money);
            roomState.players[creditorId].money += debtAmount;
            logEvent(room, `💸 No bids! Properties unlocked. Bank paid creditor ${roomState.players[creditorId].name} ₹${debtAmount} directly.`);
        } else {
            // Voluntary bankruptcy, or no creditor player, or negative money is 0
            logEvent(room, `🔨 No bids! Package properties unlocked and reverted to Bank.`);
        }
    }

    finalizeBankruptcy(room, auction.bankruptPlayerId);
    io.to(room).emit('update_game', roomState);
};

const finalizeBankruptcy = (room, bankruptPlayerId) => {
    const roomState = gameState[room];
    if (!roomState) return;
    const player = roomState.players[bankruptPlayerId];

    delete roomState.players[bankruptPlayerId];

    // Transfer host if host went bankrupt
    if (roomState.host === bankruptPlayerId) {
        const remainingIds = Object.keys(roomState.players);
        if (remainingIds.length > 0) {
            roomState.host = remainingIds[0];
            logEvent(room, `👑 Host privileges transferred to ${roomState.players[roomState.host].name}.`);
        }
    }

    const remainingPlayers = Object.keys(roomState.players);
    if (remainingPlayers.length === 1) {
        const winnerId = remainingPlayers[0];
        const winner = roomState.players[winnerId];
        if (winner) {
            roomState.winner = winnerId;
            roomState.lastWinnerName = winner.name;

            logEvent(room, `🏆 MATCH OVER! ${winner.name} won!`);

            cleanPreviousWinnersOfMatch(roomState);
            saveWinner(winner.name);
            io.to(room).emit('game_over', { winnerId, winnerName: winner.name });
        }
    } else if (remainingPlayers.length > 1) {
        if (roomState.currentTurn === bankruptPlayerId) {
            roomState.hasRolled = false;
            roomState.currentTurn = roomState.turnOrder[0];
            const nextPlayer = roomState.players[roomState.currentTurn];
            if (nextPlayer) {
                logEvent(room, `It is now ${nextPlayer.name}'s turn.`);
            }
        }
    } else {
        logEvent(room, `🏁 Game over! All players have gone bankrupt or left.`);
        roomState.winner = null;
        io.to(room).emit('game_over', { winnerId: null, winnerName: 'Nobody' });
    }

    delete roomState.auctionState;
    if (auctionTimers[room]) {
        clearTimeout(auctionTimers[room]);
        delete auctionTimers[room];
    }
    io.to(room).emit('update_game', roomState);
};

function getPlayerColor(index) {
    const colors = [
        '#3b82f6', // Blue
        '#10b981', // Green
        '#ef4444', // Red
        '#a855f7', // Purple
        '#f97316', // Orange
        '#14b8a6'  // Teal
    ];
    return colors[index % colors.length];
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});