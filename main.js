const socket = io();
const engine = new LudoEngine();
const ai = new AIBot(engine);

let gameMode = 'offline'; let myColor = 'red'; let roomId = null;
const diceEl = document.getElementById('dice');

function showScreen(id, mode) {
    if (mode) gameMode = mode;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function initBoard() {
    const board = document.getElementById('ludo-board');
    board.innerHTML = '<div id="token-layer" class="token-layer"></div>';
    for (let r=0; r<15; r++) {
        for (let c=0; c<15; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (r<6 && c<6) cell.style.background = 'rgba(255, 71, 87, 0.2)';
            else if (r<6 && c>8) cell.style.background = 'rgba(46, 213, 115, 0.2)';
            else if (r>8 && c<6) cell.style.background = 'rgba(30, 144, 255, 0.2)';
            else if (r>8 && c>8) cell.style.background = 'rgba(255, 165, 2, 0.2)';
            if (r === 7 && c > 0 && c < 7) cell.style.background = 'var(--red)';
            if (c === 7 && r > 0 && r < 7) cell.style.background = 'var(--green)';
            if (r === 7 && c > 7 && c < 14) cell.style.background = 'var(--yellow)';
            if (c === 7 && r > 7 && r < 14) cell.style.background = 'var(--blue)';
            if (r === 7 && c === 7) cell.style.background = 'conic-gradient(var(--red) 0 90deg, var(--green) 90deg 180deg, var(--yellow) 180deg 270deg, var(--blue) 270deg 360deg)';
            board.appendChild(cell);
        }
    }
}

function renderTokens() {
    const layer = document.getElementById('token-layer');
    layer.innerHTML = '';
    const bSize = document.getElementById('ludo-board').offsetWidth;
    const cellSize = bSize / 15;

    engine.players.forEach(color => {
        engine.state.tokens[color].forEach((pos, idx) => {
            let r, c;
            if (pos === -1) {
                const base = {red:[0,0],green:[0,9],blue:[9,0],yellow:[9,9]};
                const off = [[1.5,1.5],[1.5,4.5],[4.5,1.5],[4.5,4.5]][idx];
                r = base[color][0]+off[0]; c = base[color][1]+off[1];
            } else {
                [r, c] = engine.paths[color][pos];
            }
            const token = document.createElement('div');
            token.className = `token ${color}`;
            token.style.left = `${c * cellSize + cellSize/2}px`;
            token.style.top = `${r * cellSize + cellSize/2}px`;
            if (engine.state.turn === color && engine.state.hasRolled) {
                token.classList.add('active-move');
                token.onclick = () => moveAction(idx);
            }
            layer.appendChild(token);
        });
    });
}

function rollAction() {
    if (engine.state.hasRolled || (gameMode === 'online' && engine.state.turn !== myColor)) return;
    diceEl.classList.add('rolling');
    document.getElementById('game-msg').textContent = "Rolling...";
    
    setTimeout(() => {
        const val = Math.floor(Math.random()*6)+1;
        engine.state.dice = val; 
        engine.state.hasRolled = true;
        diceEl.textContent = val; 
        diceEl.classList.remove('rolling');
        
        // Check if any move is possible
        const canMove = [];
        engine.state.tokens[engine.state.turn].forEach((pos, i) => {
            if (pos === -1) { if (val === 6) canMove.push(i); }
            else if (pos + val <= 57) canMove.push(i);
        });

        if (canMove.length === 0) {
            document.getElementById('game-msg').textContent = "No moves possible!";
            setTimeout(() => {
                engine.nextTurn();
                updateUI();
                if (gameMode === 'online') socket.emit('syncGame', { roomId, state: engine.state });
            }, 1000);
        } else {
            document.getElementById('game-msg').textContent = "Select a token to move";
            if (canMove.length === 1 && val !== 6) {
                setTimeout(() => moveAction(canMove[0]), 500);
            }
        }
        
        updateUI();
        if (gameMode === 'online') socket.emit('syncGame', { roomId, state: engine.state });
        if (gameMode === 'ai' && engine.state.turn !== 'red') autoAI();
    }, 600);
}

function moveAction(idx) {
    if (engine.moveToken(engine.state.turn, idx)) {
        updateUI();
        if (gameMode === 'online') socket.emit('syncGame', { roomId, state: engine.state });
        if (gameMode === 'ai' && engine.state.turn !== 'red') setTimeout(rollAction, 1000);
    }
}

function autoAI() {
    setTimeout(() => {
        if (!engine.state.hasRolled) rollAction();
        else { const move = ai.decideMove(engine.state.turn); if (move !== null) moveAction(move); else engine.nextTurn(); updateUI(); }
    }, 1000);
}

function startGame(players) {
    engine.reset(); showScreen('game-screen'); initBoard(); renderTokens(); updateUI();
}

function createRoom() {
    roomId = Math.random().toString(36).substring(7).toUpperCase();
    socket.emit('joinRoom', { roomId, name: 'Host', color: 'red' });
    myColor = 'red'; gameMode = 'online'; startGame();
    alert(`Room ID: ${roomId}`);
}

function joinRoom() {
    roomId = document.getElementById('room-code').value;
    if (!roomId) return;
    socket.emit('joinRoom', { roomId, name: 'Guest', color: 'blue' });
    myColor = 'blue'; gameMode = 'online'; startGame();
}

socket.on('updateState', (state) => { engine.state = state; renderTokens(); updateUI(); });

function updateUI() {
    const t = engine.state.turn.toUpperCase();
    document.getElementById('current-player').textContent = `${t}'S TURN`;
    document.getElementById('current-player').style.background = `var(--${engine.state.turn})`;
    
    if (!engine.state.hasRolled) {
        document.getElementById('game-msg').textContent = "Roll the dice!";
        diceEl.textContent = "?";
    }

    renderTokens();
    if (engine.state.winner) { alert(`${engine.state.winner.toUpperCase()} WINS!`); location.reload(); }
}

window.onresize = renderTokens;
initBoard();
