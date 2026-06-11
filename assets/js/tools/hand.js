/* Hand (pan) tool */
(function () {
    class HandTool extends window.PSTool {
        constructor() {
            super({
                id: 'hand', name: 'Mano', shortcut: 'H',
                cursor: 'grab',
                icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 11V6a2 2 0 1 1 4 0v4h1V4a2 2 0 1 1 4 0v6h1V5a2 2 0 1 1 4 0v8c0 4-3 8-7 8s-7-3-7-7v-3z"/></svg>`,
            });
            this._drag = null;
        }
        onActivate() { document.getElementById('overlay-canvas').style.cursor = 'grab'; }
        onPointerDown(p, editor) {
            const sc = document.getElementById('viewport-scroll');
            this._drag = { x: p.event.clientX, y: p.event.clientY, sl: sc.scrollLeft, st: sc.scrollTop };
            document.getElementById('overlay-canvas').style.cursor = 'grabbing';
        }
        onPointerMove(p, editor) {
            if (!this._drag) return;
            const sc = document.getElementById('viewport-scroll');
            sc.scrollLeft = this._drag.sl - (p.event.clientX - this._drag.x);
            sc.scrollTop = this._drag.st - (p.event.clientY - this._drag.y);
        }
        onPointerUp() {
            this._drag = null;
            document.getElementById('overlay-canvas').style.cursor = 'grab';
        }
        renderOptions(container) {
            container.innerHTML = `
                <div class="ob-group">
                    <button class="ob-btn" id="hand-fit">Adatta a schermo</button>
                    <button class="ob-btn" id="hand-100">Pixel effettivi</button>
                    <button class="ob-btn" id="hand-fill">Riempi schermo</button>
                </div>
            `;
        }
    }
    window.PSTools.HandTool = HandTool;
})();
