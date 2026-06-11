/* Simple event bus used across the app */
(function () {
    class EventBus {
        constructor() { this._handlers = new Map(); }
        on(event, fn) {
            if (!this._handlers.has(event)) this._handlers.set(event, new Set());
            this._handlers.get(event).add(fn);
            return () => this.off(event, fn);
        }
        off(event, fn) {
            const set = this._handlers.get(event);
            if (set) set.delete(fn);
        }
        emit(event, payload) {
            const set = this._handlers.get(event);
            if (!set) return;
            for (const fn of set) {
                try { fn(payload); } catch (e) { console.error('[event-bus]', event, e); }
            }
        }
    }
    window.PSBus = new EventBus();
})();
