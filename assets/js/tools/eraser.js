/* Eraser tool */
(function () {
    class EraserTool extends window.PSTool {
        constructor() {
            super({
                id: 'eraser', name: 'Gomma', shortcut: 'E',
                cursor: 'crosshair',
                icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16 3l5 5-10 10H6l-3-3 10-10 3-2zm-3 14h8v2h-10l-2-2 4 0z"/></svg>`,
            });
            this._erasing = false;
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
            this._erasing = true;
            this._before = layer.snapshot();
            this._last = { x: p.x, y: p.y };
            this._stamp(layer, p.x, p.y, editor);
            editor.requestRedraw();
        }
        onPointerMove(p, editor) {
            if (this._erasing) {
                const layer = editor.activeDoc.getActiveLayer();
                if (layer) {
                    const dx = p.x - this._last.x, dy = p.y - this._last.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const step = Math.max(1, editor.brushSize * 0.2);
                    const steps = Math.ceil(dist / step);
                    for (let i = 1; i <= steps; i++) {
                        const t = i / steps;
                        this._stamp(layer, this._last.x + dx * t, this._last.y + dy * t, editor);
                    }
                    this._last = { x: p.x, y: p.y };
                }
            }
            this._cursorPos = { x: p.x, y: p.y };
            editor.requestRedraw();
        }
        onPointerUp(p, editor) {
            if (!this._erasing) return;
            this._erasing = false;
            const layer = editor.activeDoc.getActiveLayer();
            if (layer && this._before) {
                editor.pushPaintHistory(layer, this._before, layer.snapshot(), 'Gomma');
            }
            this._before = null; this._last = null;
        }
        onPointerLeave(p, editor) { this._cursorPos = null; editor.requestRedraw(); }
        drawOverlay(ctx, editor) {
            if (!this._cursorPos) return;
            const r = editor.brushSize / 2;
            ctx.save();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000';
            ctx.beginPath(); ctx.arc(this._cursorPos.x, this._cursorPos.y, r, 0, Math.PI * 2); ctx.stroke();
            ctx.strokeStyle = '#fff';
            ctx.beginPath(); ctx.arc(this._cursorPos.x, this._cursorPos.y, Math.max(0, r - 1), 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }
        _stamp(layer, x, y, editor) {
            const ctx = layer.ctx;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.globalAlpha = editor.brushOpacity;
            ctx.beginPath();
            ctx.arc(x, y, editor.brushSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        renderOptions(container, editor) {
            container.innerHTML = `
                <div class="ob-group">
                    <span class="ob-label">Dim:</span>
                    <input type="range" class="ob-range" id="eraser-size-range" min="1" max="500" value="${editor.brushSize}">
                    <input type="number" class="ob-input ob-input-num" id="eraser-size" value="${editor.brushSize}" min="1" max="2000">
                    <span class="ob-label">px</span>
                </div>
                <div class="ob-group">
                    <span class="ob-label">Modo:</span>
                    <select class="ob-select"><option>Pennello</option><option>Matita</option><option>Quadrato</option></select>
                </div>
                <div class="ob-group">
                    <span class="ob-label">Opacità:</span>
                    <input type="number" class="ob-input ob-input-num" id="eraser-opacity" value="${Math.round(editor.brushOpacity * 100)}" min="0" max="100">%
                </div>
                <div class="ob-group">
                    <span class="ob-label">Flusso:</span>
                    <input type="number" class="ob-input ob-input-num" value="100">%
                </div>
            `;
            const sz = container.querySelector('#eraser-size');
            const rng = container.querySelector('#eraser-size-range');
            const set = (v) => {
                v = Math.max(1, Math.min(2000, parseInt(v, 10) || 1));
                editor.brushSize = v; sz.value = v; rng.value = Math.min(500, v);
                window.PSBus.emit('brush:size', v);
            };
            sz.addEventListener('input', e => set(e.target.value));
            rng.addEventListener('input', e => set(e.target.value));
            container.querySelector('#eraser-opacity').addEventListener('input', e => editor.brushOpacity = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)) / 100);
            window.PSBus.on('brush:size', s => { if (document.body.contains(sz)) { sz.value = s; rng.value = Math.min(500, s); } });
        }
    }
    window.PSTools.EraserTool = EraserTool;
})();
