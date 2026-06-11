/* Brush tool — soft round brush with hardness, opacity, flow, smoothing */
(function () {
    class BrushTool extends window.PSTool {
        constructor() {
            super({
                id: 'brush', name: 'Pennello', shortcut: 'B',
                cursor: 'crosshair',
                icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 3c-1 0-2 .5-3 1.5l-9 9-2 5 5-2 9-9c1-1 1.5-2 1.5-3S21 3 20 3zM4 17c-1 1-1 3 0 4s3 1 4 0l3-3-4-4-3 3z"/></svg>`,
            });
            this._stroking = false;
            this._last = null;
            this._before = null;
        }
        onActivate(editor) { super.onActivate(editor); document.getElementById('overlay-canvas').style.cursor = 'crosshair'; }
        onPointerDown(p, editor) {
            const layer = editor.activeDoc.getActiveLayer();
            if (!layer || layer.locked) return;
            this._stroking = true;
            this._before = layer.snapshot();
            this._last = { x: p.x, y: p.y };
            this._stamp(layer, p.x, p.y, editor);
        }
        onPointerMove(p, editor) {
            if (!this._stroking) return;
            const layer = editor.activeDoc.getActiveLayer();
            if (!layer) return;
            const dx = p.x - this._last.x;
            const dy = p.y - this._last.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const step = Math.max(1, editor.brushSize * 0.15);
            const steps = Math.ceil(dist / step);
            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                this._stamp(layer, this._last.x + dx * t, this._last.y + dy * t, editor);
            }
            this._last = { x: p.x, y: p.y };
            editor.requestRedraw();
        }
        onPointerUp(p, editor) {
            if (!this._stroking) return;
            this._stroking = false;
            const layer = editor.activeDoc.getActiveLayer();
            if (layer && this._before) {
                const after = layer.snapshot();
                editor.pushPaintHistory(layer, this._before, after, 'Pennello');
            }
            this._before = null;
            this._last = null;
        }
        _stamp(layer, x, y, editor) {
            const ctx = layer.ctx;
            const r = editor.brushSize / 2;
            ctx.save();
            ctx.globalAlpha = editor.brushOpacity;
            const grad = ctx.createRadialGradient(x, y, r * editor.brushHardness, x, y, r);
            const fg = editor.fgColor;
            grad.addColorStop(0, fg);
            grad.addColorStop(1, fg + '00');
            ctx.fillStyle = editor.brushHardness >= 1 ? fg : grad;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        drawOverlay(ctx, editor) {
            // cursor circle preview could be drawn here; skipped to avoid pointer jitter
        }
        renderOptions(container, editor) {
            container.innerHTML = `
                <div class="ob-group">
                    <span class="ob-brush-preview" id="brush-preview" style="color:${editor.fgColor}">
                        <span class="dot"></span>
                        <span class="ob-brush-size" id="brush-size-label">${editor.brushSize} px</span>
                    </span>
                </div>
                <div class="ob-group">
                    <span class="ob-label">Modo:</span>
                    <select class="ob-select">
                        <option>Normale</option>
                        <option>Dissolvi</option>
                        <option>Moltiplica</option>
                        <option>Scolora</option>
                        <option>Sovrapponi</option>
                    </select>
                </div>
                <div class="ob-group">
                    <span class="ob-label">Opacità:</span>
                    <input type="number" class="ob-input ob-input-num" id="brush-opacity" value="${Math.round(editor.brushOpacity * 100)}" min="0" max="100">%
                </div>
                <div class="ob-group">
                    <span class="ob-label">Flusso:</span>
                    <input type="number" class="ob-input ob-input-num" id="brush-flow" value="${Math.round(editor.brushFlow * 100)}" min="0" max="100">%
                </div>
                <div class="ob-group">
                    <span class="ob-label">Lisciatura:</span>
                    <input type="number" class="ob-input ob-input-num" id="brush-smooth" value="${editor.brushSmoothing}" min="0" max="100">%
                </div>
                <div class="ob-group">
                    <span class="ob-label">Durezza:</span>
                    <input type="number" class="ob-input ob-input-num" id="brush-hardness" value="${Math.round(editor.brushHardness * 100)}" min="0" max="100">%
                </div>
                <div class="ob-group">
                    <span class="ob-label">Dim:</span>
                    <input type="number" class="ob-input ob-input-num" id="brush-size" value="${editor.brushSize}" min="1" max="2000">
                </div>
            `;
            container.querySelector('#brush-opacity').addEventListener('input', e => editor.brushOpacity = (parseInt(e.target.value, 10) || 0) / 100);
            container.querySelector('#brush-flow').addEventListener('input', e => editor.brushFlow = (parseInt(e.target.value, 10) || 0) / 100);
            container.querySelector('#brush-smooth').addEventListener('input', e => editor.brushSmoothing = parseInt(e.target.value, 10) || 0);
            container.querySelector('#brush-hardness').addEventListener('input', e => editor.brushHardness = (parseInt(e.target.value, 10) || 0) / 100);
            const sz = container.querySelector('#brush-size');
            sz.addEventListener('input', e => {
                editor.brushSize = parseInt(e.target.value, 10) || 1;
                window.PSBus.emit('brush:size', editor.brushSize);
            });
            window.PSBus.on('brush:size', s => {
                if (sz) sz.value = s;
                const lbl = container.querySelector('#brush-size-label');
                if (lbl) lbl.textContent = s + ' px';
            });
            window.PSBus.on('color:fg', c => {
                const p = container.querySelector('#brush-preview');
                if (p) p.style.color = c;
            });
        }
    }
    window.PSTools.BrushTool = BrushTool;
})();
