/* Pencil tool — hard-edged 1px+ */
(function () {
    class PencilTool extends window.PSTool {
        constructor() {
            super({
                id: 'pencil', name: 'Matita', shortcut: 'B',
                cursor: 'crosshair', group: 'brush',
                icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 17l11-11 4 4L7 21H3v-4zm15-12l2-2 2 2-2 2-2-2z"/></svg>`,
            });
            this._stroking = false;
            this._last = null;
            this._before = null;
            this._cursorPos = null;
        }
        onActivate(editor) { super.onActivate(editor); document.getElementById('overlay-canvas').style.cursor = 'none'; }
        onDeactivate() { this._cursorPos = null; document.getElementById('overlay-canvas').style.cursor = 'crosshair'; }
        onPointerDown(p, editor) {
            const layer = editor.activeDoc.getActiveLayer();
            if (!layer) return;
            if (layer.locked) { window.PSBus.emit('status:flash', 'Livello bloccato'); return; }
            this._stroking = true;
            this._before = layer.snapshot();
            this._last = { x: p.x, y: p.y };
            this._line(layer, p.x, p.y, p.x, p.y, editor);
            editor.requestRedraw();
        }
        onPointerMove(p, editor) {
            if (this._stroking) {
                const layer = editor.activeDoc.getActiveLayer();
                if (layer) {
                    this._line(layer, this._last.x, this._last.y, p.x, p.y, editor);
                    this._last = { x: p.x, y: p.y };
                }
            }
            this._cursorPos = { x: p.x, y: p.y };
            editor.requestRedraw();
        }
        onPointerUp(p, editor) {
            if (!this._stroking) return;
            this._stroking = false;
            const layer = editor.activeDoc.getActiveLayer();
            if (layer && this._before) {
                editor.pushPaintHistory(layer, this._before, layer.snapshot(), 'Matita');
            }
            this._before = null; this._last = null;
        }
        onPointerLeave(p, editor) { this._cursorPos = null; editor.requestRedraw(); }
        drawOverlay(ctx, editor) {
            if (!this._cursorPos) return;
            const r = Math.max(0.5, editor.brushSize / 2);
            ctx.save();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000';
            ctx.strokeRect(this._cursorPos.x - r, this._cursorPos.y - r, r * 2, r * 2);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(this._cursorPos.x - r + 1, this._cursorPos.y - r + 1, r * 2 - 2, r * 2 - 2);
            ctx.restore();
        }
        _line(layer, x0, y0, x1, y1, editor) {
            const ctx = layer.ctx;
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.strokeStyle = editor.fgColor;
            ctx.lineWidth = Math.max(1, editor.brushSize);
            ctx.lineCap = 'square';
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
            ctx.restore();
        }
        renderOptions(container, editor) {
            container.innerHTML = `
                <div class="ob-group">
                    <span class="ob-label">Dim:</span>
                    <input type="range" class="ob-range" id="pencil-size-range" min="1" max="100" value="${editor.brushSize}">
                    <input type="number" class="ob-input ob-input-num" id="pencil-size" value="${editor.brushSize}" min="1" max="500">
                    <span class="ob-label">px</span>
                </div>
                <div class="ob-group">
                    <span class="ob-label">Opacità:</span>
                    <input type="number" class="ob-input ob-input-num" value="100">%
                </div>
                <div class="ob-group">
                    <label class="ob-check"><input type="checkbox"> Cancella automaticamente</label>
                </div>
            `;
            const sz = container.querySelector('#pencil-size');
            const rng = container.querySelector('#pencil-size-range');
            const set = (v) => {
                v = Math.max(1, Math.min(500, parseInt(v, 10) || 1));
                editor.brushSize = v; sz.value = v; rng.value = Math.min(100, v);
                window.PSBus.emit('brush:size', v);
            };
            sz.addEventListener('input', e => set(e.target.value));
            rng.addEventListener('input', e => set(e.target.value));
            window.PSBus.on('brush:size', s => { if (document.body.contains(sz)) { sz.value = s; rng.value = Math.min(100, s); } });
        }
    }
    window.PSTools.PencilTool = PencilTool;
})();
