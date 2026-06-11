/* Move tool */
(function () {
    class MoveTool extends window.PSTool {
        constructor() {
            super({
                id: 'move', name: 'Sposta', shortcut: 'V',
                cursor: 'move',
                icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l4 4h-3v5h5V8l4 4-4 4v-3h-5v5h3l-4 4-4-4h3v-5H6v3l-4-4 4-4v3h5V6H8l4-4z"/></svg>`,
            });
            this._drag = null;
        }
        onPointerDown(p, editor) {
            const layer = editor.activeDoc.getActiveLayer();
            if (!layer || layer.locked) return;
            this._drag = { x: p.x, y: p.y, startX: layer.x, startY: layer.y, layer };
        }
        onPointerMove(p, editor) {
            if (!this._drag) return;
            const dx = p.x - this._drag.x;
            const dy = p.y - this._drag.y;
            this._drag.layer.x = Math.round(this._drag.startX + dx);
            this._drag.layer.y = Math.round(this._drag.startY + dy);
            editor.requestRedraw();
        }
        onPointerUp(p, editor) { this._drag = null; }
        renderOptions(container, editor) {
            container.innerHTML = `
                <div class="ob-group">
                    <label class="ob-check" title="Selezione automatica"><input type="checkbox" id="move-autoselect"> Selezione automatica</label>
                    <select class="ob-select" id="move-autoselect-target">
                        <option value="layer">Livello</option>
                        <option value="group">Gruppo</option>
                    </select>
                </div>
                <div class="ob-group">
                    <label class="ob-check"><input type="checkbox" id="move-show-controls"> Mostra controlli trasformazione</label>
                </div>
                <div class="ob-group">
                    <button class="ob-btn" id="move-align-l" title="Allinea a sinistra">⇤</button>
                    <button class="ob-btn" id="move-align-c">⇔</button>
                    <button class="ob-btn" id="move-align-r">⇥</button>
                </div>
            `;
        }
    }
    window.PSTools = window.PSTools || {};
    window.PSTools.MoveTool = MoveTool;
})();
