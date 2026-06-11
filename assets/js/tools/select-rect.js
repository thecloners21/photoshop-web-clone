/* Rectangular Marquee selection tool */
(function () {
    class SelectRectTool extends window.PSTool {
        constructor() {
            super({
                id: 'select-rect', name: 'Selezione rettangolare', shortcut: 'M',
                cursor: 'crosshair',
                group: 'select',
                icon: `<svg viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2" fill="none" d="M3 5h18v14H3z"/></svg>`,
            });
            this._start = null;
            this._current = null;
        }
        onPointerDown(p, editor) {
            this._start = { x: p.x, y: p.y };
            this._current = { x: p.x, y: p.y };
        }
        onPointerMove(p, editor) {
            if (!this._start) return;
            this._current = { x: p.x, y: p.y };
            editor.requestRedraw();
        }
        onPointerUp(p, editor) {
            if (!this._start || !this._current) return;
            const x = Math.min(this._start.x, this._current.x);
            const y = Math.min(this._start.y, this._current.y);
            const w = Math.abs(this._current.x - this._start.x);
            const h = Math.abs(this._current.y - this._start.y);
            const before = editor.activeDoc.selection;
            const after = w > 1 && h > 1 ? { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) } : null;
            editor.activeDoc.setSelection(after);
            editor.activeDoc.history.push({ type: 'selection', before, after, label: 'Selezione rettangolare' });
            this._start = null;
            this._current = null;
            editor.requestRedraw();
        }
        drawOverlay(ctx, editor) {
            if (!this._start || !this._current) return;
            const x = Math.min(this._start.x, this._current.x);
            const y = Math.min(this._start.y, this._current.y);
            const w = Math.abs(this._current.x - this._start.x);
            const h = Math.abs(this._current.y - this._start.y);
            ctx.save();
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(x + 0.5, y + 0.5, w, h);
            ctx.lineDashOffset = -2;
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(x + 0.5, y + 0.5, w, h);
            ctx.restore();
        }
        renderOptions(container, editor) {
            container.innerHTML = `
                <div class="ob-group">
                    <button class="ob-toggle active" title="Nuova selezione">▢</button>
                    <button class="ob-toggle" title="Aggiungi alla selezione">+▢</button>
                    <button class="ob-toggle" title="Sottrai dalla selezione">−▢</button>
                    <button class="ob-toggle" title="Interseca">×▢</button>
                </div>
                <div class="ob-group">
                    <span class="ob-label">Sfuma:</span>
                    <input type="number" class="ob-input ob-input-num" value="0" min="0" max="250">
                    <span class="ob-label">px</span>
                </div>
                <div class="ob-group">
                    <label class="ob-check"><input type="checkbox" checked> Anti-alias</label>
                </div>
                <div class="ob-group">
                    <span class="ob-label">Stile:</span>
                    <select class="ob-select">
                        <option>Normale</option>
                        <option>Proporzioni fisse</option>
                        <option>Dimensioni fisse</option>
                    </select>
                </div>
            `;
        }
    }
    window.PSTools.SelectRectTool = SelectRectTool;
})();
