class AIBot {
    constructor(engine) { this.engine = engine; }
    decideMove(color) {
        const canMove = this.engine.players.map((c, i) => {
            const dice = this.engine.state.dice;
            if (this.engine.state.turn !== color) return -1;
            const pos = this.engine.state.tokens[color][i];
            if (pos === -1 && dice === 6) return i;
            if (pos !== -1 && pos + dice <= 57) return i;
            return -1;
        }).filter(i => i !== -1);
        if (canMove.length === 0) return null;
        // Strategy: Prioritize moving tokens closest to home
        return canMove.reduce((prev, curr) => (this.engine.state.tokens[color][curr] > this.engine.state.tokens[color][prev]) ? curr : prev);
    }
}
if (typeof module !== 'undefined') module.exports = AIBot; else window.AIBot = AIBot;
