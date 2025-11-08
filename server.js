const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const { getNewDecks } = require('./cards');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const gameStates = {};
const disconnectTimers = {};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Helper function to get active (non-disconnected) players ---
function getActivePlayers(roomCode) {
  if (!gameStates[roomCode]) return [];
  return gameStates[roomCode].players.filter(p => p.id !== null);
}

// Helper to get active, non-spectating players
function getActiveParticipants(roomCode) {
  if (!gameStates[roomCode]) return [];
  return gameStates[roomCode].players.filter(p => p.id !== null && !p.isSpectating);
}

// --- THIS IS THE FIXED FUNCTION ---
function startNextRound(roomCode) {
  const state = gameStates[roomCode];
  if (!state) return;

  // 1. Activate any spectating players
  state.players.forEach(p => {
    if (p.isSpectating) {
      p.isSpectating = false;
      console.log(`Player ${p.name} is now active.`);
    }
  });

  const allActiveParticipants = getActiveParticipants(roomCode);
  if (allActiveParticipants.length === 0) {
    if (state.players.length === 0) delete gameStates[roomCode];
    return;
  }
  
  // 2. Find out who the *current* judge is
  let currentJudgePlayerId = null;
  if (state.players[state.currentJudgeIndex]) {
     currentJudgePlayerId = state.players[state.currentJudgeIndex].playerId;
  } else {
    // Failsafe if judge was removed
    currentJudgePlayerId = allActiveParticipants[0].playerId;
  }
  
  // 3. Find out who the *next* judge will be
  const currentActiveIndex = allActiveParticipants.findIndex(p => p.playerId === currentJudgePlayerId);
  const nextActiveIndex = (currentActiveIndex + 1) % allActiveParticipants.length;
  
  // --- THIS IS THE FIX ---
  // 4. Check if the *next* judge is the host (index 0)
  // This means a full rotation is about to complete.
  if (nextActiveIndex === 0) {
    state.roundsPlayed += 1;
    console.log(`Full rotation complete. Rounds played: ${state.roundsPlayed}/${state.turnLimit}`);
    
    // 5. Check if the game is over
    if (state.roundsPlayed >= state.turnLimit) {
      console.log(`Game ${roomCode} ending.`);
      state.gamePhase = 'game-over';
      io.to(roomCode).emit('gameUpdate', state);
      return; // Stop the game
    }
  }
  // --- END FIX ---

  // 6. Assign the new judge and continue the round
  const nextJudgePlayerId = allActiveParticipants[nextActiveIndex].playerId;
  state.currentJudgeIndex = state.players.findIndex(p => p.playerId === nextJudgePlayerId);
  
  if (state.greenDeck.length === 0) state.greenDeck = getNewDecks().greenDeck;
  state.currentGreenCard = state.greenDeck.pop();
  state.playedRedCards = {};
  state.turnPhase = 'playing';
  state.gamePhase = 'in-game';
  state.lastWinner = null;

  state.players.forEach(player => {
    if (player.id !== null && !player.isSpectating) {
      while (player.hand.length < 7) {
        if (state.redDeck.length === 0) state.redDeck = getNewDecks().redDeck;
        player.hand.push(state.redDeck.pop());
      }
    }
  });

  io.to(roomCode).emit('gameUpdate', state);
}
// --- END FIXED FUNCTION ---


io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('createGame', ({ playerName }) => {
    const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
    socket.join(roomCode); 
    
    const playerId = socket.id + Math.floor(Math.random() * 1000);

    gameStates[roomCode] = {
      roomCode: roomCode,
      players: [{ 
        id: socket.id,
        playerId: playerId,
        name: playerName, 
        score: 0, 
        isHost: true,
        isSpectating: false
      }],
      pendingPlayers: [],
      gameStarted: false,
      gamePhase: 'lobby',
      turnLimit: 3, 
      roundsPlayed: 0
    };
    
    socket.emit('gameCreated', { state: gameStates[roomCode], playerId: playerId });
  });

  socket.on('joinGame', ({ roomCode, playerName }) => {
    const state = gameStates[roomCode];
    if (!state) return socket.emit('error', 'Room not found');
    if (state.players.length >= 8) return socket.emit('error', 'Room is full');

    if (state.gameStarted) {
      const host = state.players.find(p => p.isHost && p.id !== null);
      if (host) {
        const pendingPlayer = { id: socket.id, name: playerName };
        state.pendingPlayers.push(pendingPlayer);
        io.to(host.id).emit('joinRequest', pendingPlayer);
        socket.emit('waitingForHost');
      } else {
        socket.emit('error', 'Host is disconnected, cannot join mid-game.');
      }
      return;
    }

    const playerId = socket.id + Math.floor(Math.random() * 1000);
    const newPlayer = { 
      id: socket.id, 
      playerId: playerId, 
      name: playerName, 
      score: 0, 
      isHost: false,
      isSpectating: false
    };
    state.players.push(newPlayer);
    socket.join(roomCode);

    socket.emit('joinedGame', { state: state, playerId: playerId });
    io.to(roomCode).emit('gameUpdate', state);
  });
  
  socket.on('hostUpdateSettings', ({ roomCode, turnLimit }) => {
    const state = gameStates[roomCode];
    if (!state) return;
    const player = state.players.find(p => p.id === socket.id);
    if (player && player.isHost) {
      state.turnLimit = turnLimit;
      io.to(roomCode).emit('gameUpdate', state);
    }
  });
  
  socket.on('hostPlayAgain', ({ roomCode }) => {
    const state = gameStates[roomCode];
    if (!state) return;
    const player = state.players.find(p => p.id === socket.id);
    if (player && player.isHost) {
      state.gameStarted = false;
      state.gamePhase = 'lobby';
      state.roundsPlayed = 0;
      state.playedRedCards = {};
      state.lastWinner = null;
      state.players.forEach(p => {
        p.score = 0;
        p.hand = [];
        p.isSpectating = false;
      });
      io.to(roomCode).emit('gameUpdate', state);
    }
  });

  socket.on('hostDecision', ({ roomCode, requestSocketId, isApproved }) => {
    const state = gameStates[roomCode];
    if (!state) return;
    
    const host = state.players.find(p => p.isHost);
    if (!host || host.id !== socket.id) return; 

    const playerIndex = state.pendingPlayers.findIndex(p => p.id === requestSocketId);
    if (playerIndex === -1) return;
    
    const pendingPlayer = state.pendingPlayers.splice(playerIndex, 1)[0];
    
    if (isApproved) {
      const playerId = pendingPlayer.id + Math.floor(Math.random() * 1000);
      const newPlayer = { 
        id: pendingPlayer.id, 
        playerId: playerId, 
        name: pendingPlayer.name, 
        score: 0, 
        isHost: false,
        isSpectating: true,
        hand: []
      };
      
      for (let i = 0; i < 7; i++) {
        if (state.redDeck.length === 0) state.redDeck = getNewDecks().redDeck;
        newPlayer.hand.push(state.redDeck.pop());
      }
      
      state.players.push(newPlayer);
      
      const newPlayerSocket = io.sockets.sockets.get(pendingPlayer.id);
      if (newPlayerSocket) {
        newPlayerSocket.join(roomCode);
        newPlayerSocket.emit('joinedGame', { state: state, playerId: playerId });
      }
      
      io.to(roomCode).emit('gameUpdate', state);

    } else {
      io.to(pendingPlayer.id).emit('error', 'The host denied your request to join.');
    }
  });

  socket.on('hostKickPlayer', ({ roomCode, playerIdToKick }) => {
    const state = gameStates[roomCode];
    if (!state) return;
    
    const host = state.players.find(p => p.isHost);
    if (!host || host.id !== socket.id) return; 
    if (host.playerId === playerIdToKick) return; 

    const pIndex = state.players.findIndex(p => p.playerId === playerIdToKick);
    if (pIndex === -1) return;

    const kickedPlayer = state.players[pIndex];
    
    if (kickedPlayer.id) {
      io.to(kickedPlayer.id).emit('youWereKicked');
      const kickedSocket = io.sockets.sockets.get(kickedPlayer.id);
      if (kickedSocket) kickedSocket.leave(roomCode);
    }

    if (disconnectTimers[kickedPlayer.playerId]) {
      clearTimeout(disconnectTimers[kickedPlayer.playerId]);
      delete disconnectTimers[kickedPlayer.playerId];
    }
    
    const wasJudgeOnKick = state.gameStarted && state.currentJudgeIndex === pIndex;
    state.players.splice(pIndex, 1);
    
    console.log(`Host kicked ${kickedPlayer.name}`);
    
    if (state.players.length === 0) {
      delete gameStates[roomCode];
      return;
    }
    
    if (kickedPlayer.isHost) {
        state.players[0].isHost = true;
    }

    if (state.gameStarted && wasJudgeOnKick) {
      startNextRound(roomCode);
    } else if (state.gameStarted && pIndex < state.currentJudgeIndex) {
      state.currentJudgeIndex -= 1; 
    }
    
    io.to(roomCode).emit('gameUpdate', state);
  });
  
  socket.on('hostForceContinue', ({ roomCode }) => {
    const state = gameStates[roomCode];
    if (!state) return;
    
    const host = state.players.find(p => p.isHost);
    if (!host || host.id !== socket.id) return; 

    if (state.gameStarted && state.turnPhase === 'playing') {
      state.turnPhase = 'judging';
      io.to(roomCode).emit('gameUpdate', state);
      console.log(`Host forced game to judging phase.`);
    }
  });

  socket.on('hostSkipRound', ({ roomCode }) => {
    const state = gameStates[roomCode];
    if (!state) return;

    const host = state.players.find(p => p.isHost);
    if (!host || host.id !== socket.id) return;

    if (state.gameStarted && (state.turnPhase === 'judging' || state.turnPhase === 'winner')) {
      console.log(`Host skipped round for room ${roomCode}`);
      startNextRound(roomCode); 
    }
  });

  socket.on('rejoinGame', ({ roomCode, playerId }) => {
    const state = gameStates[roomCode];
    if (!state) return socket.emit('error', 'Room not found. Starting over.');

    const player = state.players.find(p => p.playerId === playerId);
    if (!player) return socket.emit('error', 'Player not found. Starting over.');

    if (disconnectTimers[player.playerId]) {
      clearTimeout(disconnectTimers[player.playerId]);
      delete disconnectTimers[player.playerId];
      console.log(`Player ${player.name} cleared disconnect timer.`);
    }

    player.id = socket.id;
    socket.join(roomCode);

    socket.emit('gameUpdate', state);
    io.to(roomCode).emit('gameUpdate', state);
    console.log(`Player ${player.name} reconnected.`);
  });

  socket.on('startGame', (roomCode) => {
    const state = gameStates[roomCode];
    const player = state.players.find(p => p.id === socket.id);
    if (!state || !player || !player.isHost) {
      console.log('Start game rejected. Player not found or not host.');
      return; 
    }
    
    const { greenDeck, redDeck } = getNewDecks(); 

    state.gameStarted = true;
    state.gamePhase = 'in-game';
    state.roundsPlayed = 0; // Correctly 0
    state.greenDeck = greenDeck;
    state.redDeck = redDeck; 
    state.currentJudgeIndex = 0;
    state.currentGreenCard = state.greenDeck.pop();
    state.playedRedCards = {}; 
    state.turnPhase = 'playing';
    
    state.players.forEach(p => {
      p.hand = [];
      p.isSpectating = false;
      p.score = 0;
      for (let i = 0; i < 7; i++) {
        if (state.redDeck.length === 0) {
          state.redDeck = getNewDecks().redDeck;
        }
        p.hand.push(state.redDeck.pop());
      }
    });

    io.to(roomCode).emit('gameUpdate', state);
  });

  socket.on('playRedCard', ({ roomCode, cardText }) => {
    const state = gameStates[roomCode];
    if (!state || state.turnPhase !== 'playing') return;

    const player = state.players.find(p => p.id === socket.id);
    if (!player || player.isSpectating) return;

    if (!state.players[state.currentJudgeIndex]) return;
    const judge = state.players[state.currentJudgeIndex];
    if (player.playerId === judge.playerId) return;
    
    if (state.playedRedCards[player.playerId]) return;

    state.playedRedCards[player.playerId] = cardText;
    player.hand = player.hand.filter(c => c !== cardText);

    const activeParticipants = getActiveParticipants(roomCode);
    const nonJudgePlayers = activeParticipants.filter(p => p.playerId !== judge.playerId);

    if (Object.keys(state.playedRedCards).length === nonJudgePlayers.length) {
      state.turnPhase = 'judging';
    }
    
    io.to(roomCode).emit('gameUpdate', state);
  });

  socket.on('judgeSelectWinner', ({ roomCode, winningCardText }) => {
    const state = gameStates[roomCode];
    if (!state.players[state.currentJudgeIndex]) return;
    const judge = state.players[state.currentJudgeIndex];
    
    if (!state || state.turnPhase !== 'judging' || socket.id !== judge.id) {
      return;
    }

    const winningPlayerId = Object.keys(state.playedRedCards).find(
      playerId => state.playedRedCards[playerId] === winningCardText
    );
    
    if (winningPlayerId) {
      const winningPlayer = state.players.find(p => p.playerId === winningPlayerId);
      if (winningPlayer) {
        winningPlayer.score += 1;
      
        state.turnPhase = 'winner';
        state.lastWinner = {
          name: winningPlayer.name,
          greenCard: state.currentGreenCard,
          redCard: winningCardText,
        };
        
        io.to(roomCode).emit('gameUpdate', state);

        setTimeout(() => {
          startNextRound(roomCode);
        }, 6500); 
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const roomCode in gameStates) {
      const state = gameStates[roomCode];
      if (!state) continue;

      const pendingIndex = state.pendingPlayers.findIndex(p => p.id === socket.id);
      if (pendingIndex > -1) {
        console.log('A pending player disconnected.');
        state.pendingPlayers.splice(pendingIndex, 1);
        break;
      }
      
      const player = state.players.find(p => p.id === socket.id);

      if (player) {
        console.log(`Player ${player.name} disconnected.`);
        const playerId = player.playerId;
        const wasHost = player.isHost;
        player.id = null; 

        if (state.gameStarted) {
          if (disconnectTimers[playerId]) {
            clearTimeout(disconnectTimers[playerId]);
          }

          disconnectTimers[playerId] = setTimeout(() => {
            console.log(`Cleanup timer expired for ${playerId}.`);
            delete disconnectTimers[playerId];

            const currentState = gameStates[roomCode];
            if (!currentState) return;
            
            const pIndex = currentState.players.findIndex(p => p.playerId === playerId);
            if (pIndex === -1) return;

            const playerToBoot = currentState.players[pIndex];

            if (playerToBoot.id === null) { 
              console.log(`Removing ${playerToBoot.name} from game.`);
              
              const wasJudgeOnDisconnect = currentState.gameStarted && currentState.currentJudgeIndex === pIndex;

              currentState.players.splice(pIndex, 1);

              if (currentState.players.length === 0) {
                console.log(`Room ${roomCode} is empty, deleting.`);
                delete gameStates[roomCode];
                return; 
              }
              
              if (wasHost && currentState.players.length > 0) {
                currentState.players[0].isHost = true;
              }

              if (currentState.gameStarted && wasJudgeOnDisconnect) {
                startNextRound(roomCode);
              } 
              else if (currentState.gameStarted && pIndex < currentState.currentJudgeIndex) {
                currentState.currentJudgeIndex -= 1; 
              }
              io.to(roomCode).emit('gameUpdate', currentState);
            } else {
              console.log(`Cleanup timer cancelled for ${playerToBoot.name} (reconnected).`);
            }
          }, 15000); 
          
          
          const activePlayers = getActivePlayers(roomCode);
          if (activePlayers.length === 0) {
            console.log('All players disconnected. Waiting for cleanup timer(s).');
          }

          if (!state.players[state.currentJudgeIndex]) {
            startNextRound(roomCode); 
          } else {
            const wasJudge = state.players[state.currentJudgeIndex].playerId === player.playerId;
            if (wasJudge) {
              console.log('The judge disconnected. Advancing round.');
              startNextRound(roomCode);
            } else {
              const judge = state.players[state.currentJudgeIndex];
              const activeParticipants = getActiveParticipants(roomCode);
              const nonJudgePlayers = activeParticipants.filter(p => p.playerId !== judge.playerId);
              if (state.turnPhase === 'playing' && 
                  Object.keys(state.playedRedCards).length >= nonJudgePlayers.length) {
                state.turnPhase = 'judging';
              }
            }
          }
        } 
        else {
            if (wasHost && state.players.length > 0) {
                const newHost = state.players.find(p => p.id !== null);
                if (newHost) {
                    newHost.isHost = true;
                } else {
                    const pIndex = state.players.findIndex(p => p.playerId === playerId);
                    if (pIndex > -1) state.players.splice(pIndex, 1);
                    if (state.players.length === 0) delete gameStates[roomCode];
                    return; 
                }
            }
        }
        
        io.to(roomCode).emit('gameUpdate', state); 
        break; 
      }
    }
  }); 
}); 

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
