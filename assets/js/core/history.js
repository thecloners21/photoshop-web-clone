/* History manager: snapshot-based undo/redo (per-layer ImageData + structural diffs) */
(function () {
    const MAX_STATES = 50;

    class HistoryManager {
        constructor() {
            this.states = [];
            this.cursor = -1;
        }

        push(action) {
            // Trim future states if we redid then made a new action
            if (this.cursor < this.states.length - 1) {
                this.states = this.states.slice(0, this.cursor + 1);
            }
            this.states.push(action);
            if (this.states.length > MAX_STATES) {
                this.states.shift();
            } else {
                this.cursor++;
            }
            window.PSBus.emit('history:changed', { states: this.states, cursor: this.cursor });
        }

        undo() {
            if (this.cursor < 0) return null;
            const action = this.states[this.cursor];
            this.cursor--;
            window.PSBus.emit('history:changed', { states: this.states, cursor: this.cursor });
            return action;
        }

        redo() {
            if (this.cursor >= this.states.length - 1) return null;
            this.cursor++;
            window.PSBus.emit('history:changed', { states: this.states, cursor: this.cursor });
            return this.states[this.cursor];
        }

        canUndo() { return this.cursor >= 0; }
        canRedo() { return this.cursor < this.states.length - 1; }

        clear() {
            this.states = [];
            this.cursor = -1;
            window.PSBus.emit('history:changed', { states: this.states, cursor: this.cursor });
        }

        jumpTo(index) {
            this.cursor = Math.max(-1, Math.min(this.states.length - 1, index));
            window.PSBus.emit('history:changed', { states: this.states, cursor: this.cursor });
        }
    }

    window.PSHistory = HistoryManager;
})();
