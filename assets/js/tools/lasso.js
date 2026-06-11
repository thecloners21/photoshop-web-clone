/* Lasso selection */
(function () {
    class LassoTool extends window.PSTool {
        constructor() {
            super({
                id: 'lasso', name: 'Lazo', shortcut: 'L',
                cursor: 'crosshair', group: 'select',
                icon: `<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.5" d="M5 5c4-2 10-2 13 1s2 9-2 11-12-1-12-7c0-4 5-7 9-5"/></svg>`,
            });
            this._pts = null;
        }
        onPointerDown(p) { this._pts = [{ x: p.x, y: p.y }]; }
        onPointerMove(p, editor) {
            if (!this._pts) return;
            this._pts.push({ x: p.x, y: p.y });
            editor.requestRedraw();
        }
        onPointerUp(p, editor) {
            if (!this._pts || this._pts.length < 3) { this._pts = null; return; }
            const xs = this._pts.map(p => p.x);
            const ys = this._pts.map(p => p.y);
            const min = { x: Math.min(...xs), y: Math.min(...ys) };
            const max = { x: Math.max(...xs), y: Math.max(...ys) };
            const before = editor.activeDoc.selection;
            const after = {
                x: min.x, y: min.y,
                w: max.x - min.x, h: max.y - min.y,
                shape: 'polygon',
                points: this._pts.slice()
            };
            editor.activeDoc.setSelection(after);
            editor.activeDoc.history.push({ type: 'selection', before, after, label: 'Lazo' });
            this._pts = null;
            editor.requestRedraw();
        }
        drawOverlay(ctx) {
            if (!this._pts || this._pts.length < 2) return;
            ctx.save();
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = '#000';
            ctx.beginPath();
            ctx.moveTo(this._pts[0].x, this._pts[0].y);
            for (let i = 1; i < this._pts.length; i++) ctx.lineTo(this._pts[i].x, this._pts[i].y);
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
                    <input type="number" class="ob-input ob-input-num" value="0">
                    <label class="ob-check"><input type="checkbox" checked> Anti-alias</label>
                </div>
            `;
        }
    }
    window.PSTools.LassoTool = LassoTool;
})();
