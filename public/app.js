const socket = io();

// --- Get All Screen Elements ---
const screens = {
  splash: document.getElementById('splash-screen'),
  home: document.getElementById('home-screen'),
  lobby: document.getElementById('lobby-screen'),
  game: document.getElementById('game-screen'),
  'game-over': document.getElementById('game-over-screen')
};

// --- Get All Interactive Elements ---
const splashScreen = document.getElementById('splash-screen');
const playerNameInput = document.getElementById('player-name');
const createGameBtn = document.getElementById('create-game-btn');
const roomCodeInput = document.getElementById('room-code-input');
const joinGameBtn = document.getElementById('join-game-btn');
const errorMessage = document.getElementById('error-message');
const joinStatusMessage = document.getElementById('join-status-message');

const rejoinBlock = document.getElementById('rejoin-block');
const rejoinGameBtn = document.getElementById('rejoin-game-btn');

const roomCodeDisplay = document.getElementById('room-code-display');
const playerList = document.getElementById('player-list');
const startGameBtn = document.getElementById('start-game-btn');

const gameSettingsPanel = document.getElementById('game-settings');
const turnLimitDisplay = document.getElementById('turn-limit-display');
const turnMinusBtn = document.getElementById('turn-minus');
const turnPlusBtn = document.getElementById('turn-plus');

const scoreboard = document.getElementById('scoreboard');
const gameStatus = document.getElementById('game-status');
const roomCodeGame = document.getElementById('room-code-game');
const winnerAnnouncement = document.getElementById('winner-announcement');
const greenCard = document.getElementById('green-card');
const playedCardsArea = document.getElementById('played-cards-area');
const myHand = document.getElementById('my-hand');

const hostAdminPanel = document.getElementById('host-admin-panel');
const forceContinueBtn = document.getElementById('force-continue-btn');
const skipRoundBtn = document.getElementById('skip-round-btn');

const finalWinnerDisplay = document.getElementById('final-winner-display');
const finalScoresList = document.getElementById('final-scores-list');
const playAgainBtn = document.getElementById('play-again-btn');

const approvalModal = document.getElementById('approval-modal');
const approvalPlayerName = document.getElementById('approval-player-name');
const approveJoinBtn = document.getElementById('approve-join-btn');
const denyJoinBtn = document.getElementById('deny-join-btn');

// --- Audio Elements ---
const muteBtn = document.getElementById('mute-btn');
const audio = {
  splash: document.getElementById('music-splash'),
  lobby: document.getElementById('music-lobby'),
  playing: document.getElementById('music-playing'),
  judging: document.getElementById('music-judging'),
  winner: document.getElementById('music-winner'),
  winnerReveal: document.getElementById('winner-reveal')
};
let currentMusic = null;
let isMuted = false;
let hasInteracted = false;

// --- Global State Variables ---
let myPlayerId = ''; 
let myRoomCode = '';
let iAmHost = false;
let pendingRequestSocketId = null;

// --- Utility Functions ---

function showScreen(screenName) {
  for (let key in screens) {
    screens[key].classList.remove('active');
    screens[key].classList.add('hidden');
  }
  screens[screenName].classList.remove('hidden');
  screens[screenName].classList.add('active');
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
  joinStatusMessage.classList.add('hidden');
  localStorage.removeItem('playerId');
  localStorage.removeItem('roomCode');
  rejoinBlock.classList.add('hidden');
}

// --- Audio Player ---
async function primeAudio() {
  if (hasInteracted) return true;
  console.log('Priming audio...');
  
  const primePromises = Object.values(audio).map(a => {
    return a.play()
      .then(() => a.pause())
      .catch((e) => {
        console.warn("Audio prime failed for one track. This is okay.", e.name);
      });
  });
  
  await Promise.all(primePromises);
  
  console.log('Audio primed.');
  hasInteracted = true;
  return true;
}

async function playMusic(trackName) {
  Object.keys(audio).forEach(key => {
    if (key !== 'winnerReveal' && key !== trackName && !audio[key].paused) {
      audio[key].pause();
      audio[key].currentTime = 0;
    }
  });

  currentMusic = trackName;
  
  if (isMuted || !trackName) {
    return;
  }
  
  if (!hasInteracted) return; 
  if (!audio[trackName]) return; 
  if (!audio[trackName].paused) return;

  try {
    audio[trackName].currentTime = 0;
    await audio[trackName].play();
  } catch (err) {
    console.warn("Audio play failed.", err);
  }
}

async function playSoundEffect(soundName) {
  if (isMuted || !hasInteracted || !audio[soundName]) return;
  try {
    audio[soundName].currentTime = 0;
    await audio[soundName].play();
  } catch (err) {
    console.warn(`SFX ${soundName} failed to play.`, err);
  }
}


// --- Rejoin Logic ---
window.onload = () => {
  const savedPlayerId = localStorage.getItem('playerId');
  const savedRoomCode = localStorage.getItem('roomCode');

  if (savedPlayerId && savedRoomCode) {
    console.log('Found saved game data. Showing rejoin button.');
    myPlayerId = savedPlayerId;
    myRoomCode = savedRoomCode;
    rejoinBlock.classList.remove('hidden');
  }
  
  muteBtn.textContent = isMuted ? '🔇 Mute' : '🔊 Unmute';
  muteBtn.classList.toggle('muted', isMuted);
  
  showScreen('splash');
};


// --- Socket Event Listeners ---

socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
  const savedPlayerId = localStorage.getItem('playerId');
  const savedRoomCode = localStorage.getItem('roomCode');
  if (savedPlayerId && savedRoomCode && myPlayerId && myRoomCode) {
    console.log('Re-sending rejoin request on connect');
    socket.emit('rejoinGame', { playerId: myPlayerId, roomCode: myRoomCode });
  }
});

socket.on('gameCreated', (data) => {
  const { state, playerId } = data;
  myRoomCode = state.roomCode;
  myPlayerId = playerId;
  iAmHost = true;
  
  localStorage.setItem('playerId', myPlayerId);
  localStorage.setItem('roomCode', myRoomCode);

  updateLobbyUI(state);
  showScreen('lobby');
  playMusic('lobby');
});

socket.on('joinedGame', (data) => {
  const { state, playerId } = data;
  myRoomCode = state.roomCode;
  myPlayerId = playerId;
  iAmHost = false;
  
  localStorage.setItem('playerId', myPlayerId);
  localStorage.setItem('roomCode', myRoomCode);
  
  updateLobbyUI(state);
  showScreen('lobby');
  playMusic('lobby');
});

socket.on('waitingForHost', () => {
  joinStatusMessage.textContent = 'Waiting for host approval...';
  joinStatusMessage.classList.remove('hidden');
  errorMessage.classList.add('hidden');
});

socket.on('joinRequest', ({ name, id }) => {
  console.log(`Join request from ${name}`);
  pendingRequestSocketId = id;
  approvalPlayerName.textContent = name;
  approvalModal.classList.remove('hidden');
});

socket.on('youWereKicked', () => {
  showError('You were kicked from the game by the host.');
  showScreen('home');
  localStorage.removeItem('playerId');
  localStorage.removeItem('roomCode');
  playMusic(null);
});

socket.on('gameUpdate', (gameState) => {
  myRoomCode = gameState.roomCode;
  
  const me = gameState.players.find(p => p.playerId === myPlayerId);
  if (me) {
    iAmHost = me.isHost;
  }
  
  switch (gameState.gamePhase) {
    case 'lobby':
      updateLobbyUI(gameState);
      if (!screens.lobby.classList.contains('active')) {
        showScreen('lobby');
      }
      playMusic('lobby');
      break;
    case 'in-game':
      updateGameUI(gameState);
      if (!screens.game.classList.contains('active')) {
        showScreen('game');
      }
      if (gameState.turnPhase === 'playing') {
        playMusic('playing');
      } else if (gameState.turnPhase === 'judging') {
        playMusic('judging');
      } else if (gameState.turnPhase === 'winner') {
        playMusic(null); 
      }
      break;
    case 'game-over':
      updateGameOverUI(gameState);
      if (!screens['game-over'].classList.contains('active')) {
        showScreen('game-over');
      }
      playMusic('winner');
      break;
  }
});

socket.on('error', (message) => {
  showError(message);
  showScreen('home');
});

// --- Button Click Handlers ---

splashScreen.onclick = async () => {
  if (hasInteracted) return; 
  
  splashScreen.querySelector('p').textContent = 'Unlocking audio...';
  
  await primeAudio();
  
  playMusic('splash'); 
  showScreen('home'); 
};

createGameBtn.onclick = () => {
  playMusic('lobby');
  
  localStorage.removeItem('playerId');
  localStorage.removeItem('roomCode');
  rejoinBlock.classList.add('hidden');

  const playerName = playerNameInput.value.trim();
  if (!playerName) return showError('Please enter your name');
  errorMessage.classList.add('hidden');
  joinStatusMessage.classList.add('hidden');
  socket.emit('createGame', { playerName });
};

joinGameBtn.onclick = () => {
  playMusic('lobby');

  localStorage.removeItem('playerId');
  localStorage.removeItem('roomCode');
  rejoinBlock.classList.add('hidden');

  const playerName = playerNameInput.value.trim();
  const roomCode = roomCodeInput.value.trim();
  if (!playerName || !roomCode) return showError('Please enter your name and a room code');
  errorMessage.classList.add('hidden');
  joinStatusMessage.classList.add('hidden');
  socket.emit('joinGame', { roomCode, playerName });
};

rejoinGameBtn.onclick = () => {
  console.log('Attempting to rejoin...');
  playMusic('lobby');
  joinStatusMessage.classList.add('hidden');
  if (myPlayerId && myRoomCode) {
    socket.emit('rejoinGame', { playerId: myPlayerId, roomCode: myRoomCode });
  } else {
    showError('Could not find game data. Please start over.');
  }
};

startGameBtn.onclick = () => {
  socket.emit('startGame', myRoomCode);
};

approveJoinBtn.onclick = () => {
  socket.emit('hostDecision', { 
    roomCode: myRoomCode, 
    requestSocketId: pendingRequestSocketId, 
    isApproved: true 
  });
  approvalModal.classList.add('hidden');
  pendingRequestSocketId = null;
};

denyJoinBtn.onclick = () => {
  socket.emit('hostDecision', { 
    roomCode: myRoomCode, 
    requestSocketId: pendingRequestSocketId, 
    isApproved: false 
  });
  approvalModal.classList.add('hidden');
  pendingRequestSocketId = null;
};

turnMinusBtn.onclick = () => {
  let limit = parseInt(turnLimitDisplay.textContent);
  if (limit > 1) {
    limit--;
    turnLimitDisplay.textContent = limit;
    socket.emit('hostUpdateSettings', { roomCode: myRoomCode, turnLimit: limit });
  }
};

turnPlusBtn.onclick = () => {
  let limit = parseInt(turnLimitDisplay.textContent);
  if (limit < 20) {
    limit++;
    turnLimitDisplay.textContent = limit;
    socket.emit('hostUpdateSettings', { roomCode: myRoomCode, turnLimit: limit });
  }
};

playAgainBtn.onclick = () => {
  socket.emit('hostPlayAgain', { roomCode: myRoomCode });
};

muteBtn.onclick = () => {
  if (!hasInteracted) {
    primeAudio();
  }
  
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? '🔇 Mute' : '🔊 Unmute';
  muteBtn.classList.toggle('muted', isMuted);
  
  if (isMuted) {
    Object.values(audio).forEach(a => {
      a.pause();
    });
  } else {
    if (currentMusic) {
      audio[currentMusic].play();
    }
  }
};

skipRoundBtn.onclick = () => {
  if (confirm('Are you sure you want to skip to the next round?')) {
    socket.emit('hostSkipRound', { roomCode: myRoomCode });
  }
};

forceContinueBtn.onclick = () => {
  if (confirm('Are you sure you want to force the game to the judging phase?')) {
    socket.emit('hostForceContinue', { roomCode: myRoomCode });
  }
};


function createKickButton(playerIdToKick) {
  const kickBtn = document.createElement('button');
  kickBtn.className = 'kick-player-btn';
  kickBtn.innerHTML = '&times;';
  kickBtn.onclick = (e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to kick this player?')) {
      socket.emit('hostKickPlayer', { roomCode: myRoomCode, playerIdToKick: playerIdToKick });
    }
  };
  return kickBtn;
}


// --- UI Rendering Functions ---

function updateLobbyUI(gameState) {
  roomCodeDisplay.textContent = gameState.roomCode;
  playerList.innerHTML = '';
  
  turnLimitDisplay.textContent = gameState.turnLimit;
  
  if (iAmHost) {
    startGameBtn.classList.remove('hidden');
    gameSettingsPanel.classList.remove('hidden');
  } else {
    startGameBtn.classList.add('hidden');
    gameSettingsPanel.classList.add('hidden');
  }

  gameState.players.forEach(player => {
    const li = document.createElement('li');
    let text = `${player.name} (Score: ${player.score})${player.isHost ? ' - 👑 Host' : ''}`;
    
    if (player.id === null) {
      li.classList.add('disconnected');
      text += ' (disconnected)';
    }
    if (player.isSpectating) {
      li.classList.add('spectating');
      text += ' (spectating)';
    }
    
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    li.appendChild(textSpan);
    
    if (iAmHost && player.playerId !== myPlayerId) {
      li.appendChild(createKickButton(player.playerId));
    }
    
    playerList.appendChild(li);
  });
}

function updateGameUI(gameState) {
  const me = gameState.players.find(p => p.playerId === myPlayerId);
  if (!me) return; 

  if (!gameState.players[gameState.currentJudgeIndex]) {
    console.warn("Judge index is out of bounds, waiting for next update.");
    return; 
  }

  const judge = gameState.players[gameState.currentJudgeIndex];
  const iAmJudge = (judge.playerId === myPlayerId);

  // 1. Render Scoreboard
  scoreboard.innerHTML = '';
  gameState.players.forEach(p => {
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'player-score';
    
    if (p.playerId === judge.playerId) scoreDiv.classList.add('judge');
    if (p.id === null) scoreDiv.classList.add('disconnected');
    if (p.isSpectating) scoreDiv.classList.add('spectating');
    
    scoreDiv.innerHTML = `<span class="score-name">${p.name}</span><span class="score-value">${p.score}</span>`;
    
    if (iAmHost && p.playerId !== myPlayerId) {
      scoreDiv.appendChild(createKickButton(p.playerId));
    }
    
    scoreboard.appendChild(scoreDiv);
  });

  // 2. Render Green Card
  greenCard.textContent = gameState.currentGreenCard;

  // 3. Render Room Code
  roomCodeGame.textContent = 'Code: ' + gameState.roomCode;
  roomCodeGame.classList.remove('hidden');

  // 4. Render Winner Announcement
  if (gameState.turnPhase !== 'winner') {
    winnerAnnouncement.classList.add('hidden');
    winnerAnnouncement.style.animation = 'none';
  }

  // 5. Render My Hand (Anti-flicker logic)
  const myPlayedCard = gameState.playedRedCards[myPlayerId];
  
  let newHandSignature = me.hand.join(',');
  if (iAmJudge) newHandSignature = 'judge';
  if (myPlayedCard) newHandSignature = 'played:' + gameState.turnPhase;
  if (me.isSpectating) newHandSignature = 'spectating';

  if (myHand.dataset.signature !== newHandSignature) {
    myHand.dataset.signature = newHandSignature;
    myHand.innerHTML = ''; 

    if (iAmJudge) {
      myHand.innerHTML = '<h3 class="hand-status">You are the Judge!</h3>';
    } else if (me.isSpectating) {
      myHand.innerHTML = '<h3 class="hand-status">You are spectating. You will join the next round!</h3>';
    } else if (myPlayedCard) {
      if (gameState.turnPhase === 'playing') {
        myHand.innerHTML = '<h3 class="hand-status">You played! Waiting for others...</h3>';
      } else { 
        myHand.innerHTML = '<h3 class="hand-status">Your cards are being judged!</h3>';
      }
    } else {
      me.hand.forEach((cardText, index) => {
        const cardDiv = createRedCard(cardText);
        cardDiv.style.setProperty('--delay-index', index);
        
        if (gameState.turnPhase === 'playing') {
          cardDiv.classList.add('playable');
          
          cardDiv.onclick = () => {
            socket.emit('playRedCard', { roomCode: myRoomCode, cardText: cardText });
            myHand.dataset.signature = 'played:playing';
            myHand.innerHTML = '<h3 class="hand-status">You played! Waiting for others...</h3>';
          };
        }
        myHand.appendChild(cardDiv);
      });
    }
  }
  
  // 6. Render Played Cards Area (Anti-flicker logic)
  const activeParticipants = gameState.players.filter(p => p.id !== null && !p.isSpectating);
  const toPlayCount = activeParticipants.filter(p => p.playerId !== judge.playerId).length;
  const playedCount = Object.keys(gameState.playedRedCards).length;
  
  let newPlayedSignature = '';
  if (gameState.turnPhase === 'playing') {
    newPlayedSignature = 'playing:' + playedCount;
  } else {
    const winnerName = (gameState.lastWinner && gameState.turnPhase === 'winner')? gameState.lastWinner.name : '';
    newPlayedSignature = gameState.turnPhase + ':' + Object.values(gameState.playedRedCards).sort().join(',') + winnerName;
  }

  if (playedCardsArea.dataset.signature !== newPlayedSignature) {
    playedCardsArea.dataset.signature = newPlayedSignature;
    playedCardsArea.innerHTML = '';

    if (gameState.turnPhase === 'playing') {
      gameStatus.textContent = `Playing... (${playedCount} / ${toPlayCount} played)`;
      for (let i = 0; i < playedCount; i++) {
        const cardDiv = createRedCard('?');
        cardDiv.classList.add('placeholder');
        playedCardsArea.appendChild(cardDiv);
      }
    } else if (gameState.turnPhase === 'judging') { 
      if (iAmJudge) {
        gameStatus.textContent = 'Pick the winning card!';
      } else {
        gameStatus.textContent = `Waiting for ${judge.name} to judge...`;
      }
      
      for (const playerId in gameState.playedRedCards) {
        const cardText = gameState.playedRedCards[playerId];
        const cardDiv = createRedCard(cardText);
        
        if (iAmJudge) {
          cardDiv.classList.add('judging');
          cardDiv.onclick = () => {
            if (document.querySelector('#played-cards-area .card.clicked')) return;
            cardDiv.classList.add('clicked');
            socket.emit('judgeSelectWinner', { roomCode: myRoomCode, winningCardText: cardText });
          };
        }
        playedCardsArea.appendChild(cardDiv);
      }
    } else if (gameState.turnPhase === 'winner') {
      gameStatus.textContent = 'The judge has chosen...';
      
      for (const playerId in gameState.playedRedCards) {
        const cardText = gameState.playedRedCards[playerId];
        const cardDiv = createRedCard(cardText);
        cardDiv.dataset.cardText = cardText;
        playedCardsArea.appendChild(cardDiv);
      }
      
      setTimeout(() => {
        gameStatus.textContent = 'And the winner is...';
        
        const cardsOnTable = playedCardsArea.querySelectorAll('.card');
        
        cardsOnTable.forEach(card => {
          if (card.dataset.cardText === gameState.lastWinner.redCard) {
            card.classList.add('is-winner');
          } else {
            card.classList.add('is-loser');
          }
        });
        
        playSoundEffect('winnerReveal');

        winnerAnnouncement.innerHTML = `
          <h4>${gameState.lastWinner.name} wins the round!</h4>
          <p><strong>${gameState.lastWinner.greenCard}</strong> + <em>${gameState.lastWinner.redCard}</em></p>
        `;
        winnerAnnouncement.classList.remove('hidden');
        winnerAnnouncement.style.animation = 'fadeIn 0.5s ease-out 2.5s forwards';

      }, 1000); 
    }
  }
  
  // 7. Show/Hide Host Admin Panel
  if (iAmHost && gameState.gameStarted) {
    hostAdminPanel.classList.remove('hidden');
    
    if (gameState.turnPhase === 'playing' && playedCount > 0 && playedCount < toPlayCount) {
      forceContinueBtn.classList.remove('hidden');
    } else {
      forceContinueBtn.classList.add('hidden');
    }
    
    if (gameState.turnPhase === 'judging' || gameState.turnPhase === 'winner') {
      skipRoundBtn.classList.remove('hidden');
    } else {
      skipRoundBtn.classList.add('hidden');
    }
  } else {
    hostAdminPanel.classList.add('hidden');
  }
}

// --- THIS IS THE NEW, FIXED FUNCTION ---
function updateGameOverUI(gameState) {
  // 1. Sort players by score
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  
  if (sortedPlayers.length === 0) return; // Safety check

  // 2. Find the highest score
  const highestScore = sortedPlayers[0].score;
  
  // 3. Find all players with that score
  const winners = sortedPlayers.filter(p => p.score === highestScore);

  // 4. Set the winner display text
  if (winners.length > 1) {
    // It's a tie!
    const winnerNames = winners.map(p => p.name);
    let winnerText = '';
    if (winnerNames.length === 2) {
      winnerText = winnerNames.join(' and ');
    } else {
      // For 3+ players, adds an Oxford comma
      winnerText = winnerNames.slice(0, -1).join(', ') + ', and ' + winnerNames[winnerNames.length - 1];
    }
    finalWinnerDisplay.textContent = `🏆 It's a tie between ${winnerText}! 🏆`;
  } else {
    // Single winner
    finalWinnerDisplay.textContent = `🏆 ${winners[0].name} wins! 🏆`;
  }
  
  // 5. Render the full scoreboard
  finalScoresList.innerHTML = '';
  sortedPlayers.forEach((player, index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}. ${player.name} - ${player.score} points`;
    
    // Highlight all winners in the list
    if (player.score === highestScore) {
       li.classList.add('winner-row');
    }

    finalScoresList.appendChild(li);
  });
  
  // 6. Show "Play Again" button for host
  if (iAmHost) {
    playAgainBtn.classList.remove('hidden');
  } else {
    playAgainBtn.classList.add('hidden');
  }
}
// --- END FIXED FUNCTION ---


function createRedCard(cardText) {
  const cardDiv = document.createElement('div');
  cardDiv.className = 'card red-card';
  cardDiv.innerHTML = `<span>${cardText}</span>`; 
  return cardDiv;
}


document.addEventListener('DOMContentLoaded', () => {
  // Select all audio elements on the page
  const allAudioElements = document.querySelectorAll('audio');
  const volumeSlider = document.getElementById('volume-slider');

  // If the slider element exists, run the code
  if (volumeSlider) {
    // Function to set the volume for ALL audio tags
    const setGlobalVolume = (volume) => {
      allAudioElements.forEach(audio => {
        audio.volume = volume;
      });
    };

    // Set the initial volume from the slider's default value (0.5)
    setGlobalVolume(volumeSlider.value);

    // Add an event listener to the slider
    volumeSlider.addEventListener('input', (event) => {
      const newVolume = event.target.value;
      setGlobalVolume(newVolume);
    });
  }
});

if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
  volumeSlider.disabled = true;
  volumeSlider.title = "Use your device buttons to adjust volume";
}
