class LudoEngine {
    constructor() {
        this.players = ['red', 'green', 'yellow', 'blue'];
        this.paths = this.generatePaths();
        this.safeSpots = [[6,1],[1,8],[8,13],[13,6],[6,13],[13,8],[8,1],[1,6]];
        this.reset();
    }

    reset() {
        this.state = {
            tokens: { red: [-1,-1,-1,-1], green: [-1,-1,-1,-1], yellow: [-1,-1,-1,-1], blue: [-1,-1,-1,-1] },
            turn: 'red',
            dice: 0,
            hasRolled: false,
            winner: null
        };
    }

    generatePaths() {
        const common = [[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]];
        const paths = {};
        this.players.forEach((c, i) => {
            const start = i * 13;
            const p = [];
            for (let j=0; j<51; j++) p.push(common[(start+j)%52]);
            const home = { red: [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]], green: [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]], yellow: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]], blue: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]] };
            paths[c] = [...p, ...home[c], [7,7]];
        });
        return paths;
    }

    moveToken(color, idx) {
        const d = this.state.dice;
        let pos = this.state.tokens[color][idx];
        if (pos === -1) { if (d === 6) this.state.tokens[color][idx] = 0; else return false; }
        else { if (pos+d > 57) return false; this.state.tokens[color][idx] += d; }
        
        const newPos = this.state.tokens[color][idx];
        if (newPos < 51) {
            const abs = this.paths[color][newPos];
            if (!this.safeSpots.some(s => s[0] === abs[0] && s[1] === abs[1])) {
                this.players.forEach(o => { if (o !== color) this.state.tokens[o].forEach((p, i) => { if (p >= 0 && p < 51) { const oAbs = this.paths[o][p]; if (oAbs[0] === abs[0] && oAbs[1] === abs[1]) this.state.tokens[o][i] = -1; } }); });
            }
        }
        if (this.state.tokens[color].every(p => p === 57)) this.state.winner = color;
        if (d !== 6) this.nextTurn(); else this.state.hasRolled = false;
        return true;
    }

    nextTurn() { const idx = this.players.indexOf(this.state.turn); this.state.turn = this.players[(idx+1)%4]; this.state.dice = 0; this.state.hasRolled = false; }
}
if (typeof module !== 'undefined') module.exports = LudoEngine; else window.LudoEngine = LudoEngine;
