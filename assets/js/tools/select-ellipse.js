/* Elliptical Marquee selection tool */
(function () {
    class SelectEllipseTool extends window.PSTool {
        constructor() {
            super({
                id: 'select-ellipse', name: 'Selezione ellittica', shortcut: 'M',
                cursor: 'crosshair', group: 'select',
                icon: `<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9" ry="6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-dasharray="3 2"/></svg>`,
            });
            this._start = null;
            this._current = null;
        }
        onPointerDown(p, editor) { this._start = { x: p.x, y: p.y }; this._current = { x: p.x, y: p.y }; }
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
            const after = w > 1 && h > 1 ? { x, y, w, h, shape: 'ellipse' } : null;
            editor.activeDoc.setSelection(after);
            editor.activeDoc.history.push({ type: 'selection', before, after, label: 'Selezione ellittica' });
            this._start = null; this._current = null;
            editor.requestRedraw();
        }
        drawOverlay(ctx) {
            if (!this._start || !this._current) return;
            const x = Math.min(this._start.x, this._current.x);
            const y = Math.min(this._start.y, this._current.y);
            const w = Math.abs(this._current.x - this._start.x);
            const h = Math.abs(this._current.y - this._start.y);
            ctx.save();
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineDashOffset = -2;
            ctx.strokeStyle = '#fff';
            ctx.stroke();
            ctx.restore();
        }
        renderOptions(container) {
            container.innerHTML = `
                <div class="ob-group">
                    <span class="ob-label">Sfuma:</span>
                    <input type="number" class="ob-input ob-input-num" value="0" min="0" max="250">
                    <span class="ob-label">px</span>
                    <label class="ob-check"><input type="checkbox" checked> Anti-alias</label>
                </div>
            `;
        }
    }
    window.PSTools.SelectEllipseTool = SelectEllipseTool;
})();
