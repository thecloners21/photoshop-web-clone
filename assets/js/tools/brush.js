/* Brush tool — soft round brush with hardness, opacity, flow, blend mode */
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
            this._cursorPos = null;
            this.blendMode = 'source-over';
        }
        onActivate(editor) {
            super.onActivate(editor);
            document.getElementById('overlay-canvas').style.cursor = 'none';
        }
        onDeactivate() {
            this._cursorPos = null;
            document.getElementById('overlay-canvas').style.cursor = 'crosshair';
        }
        onPointerDown(p, editor) {
            const layer = editor.activeDoc.getActiveLayer();
            if (!layer) return;
            if (layer.locked) { window.PSBus.emit('status:flash', 'Livello bloccato — sblocca dal pannello Livelli per dipingere'); return; }
            this._stroking = true;
            this._before = layer.snapshot();
            this._last = { x: p.x, y: p.y };
            this._stamp(layer, p.x, p.y, editor);
            editor.requestRedraw();
        }
        onPointerMove(p, editor) {
            if (this._stroking) {
                const layer = editor.activeDoc.getActiveLayer();
                if (layer) {
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
                editor.pushPaintHistory(layer, this._before, layer.snapshot(), 'Pennello');
            }
            this._before = null;
            this._last = null;
        }
        onPointerLeave(p, editor) {
            this._cursorPos = null;
            editor.requestRedraw();
        }
        drawOverlay(ctx, editor) {
            if (!this._cursorPos) return;
            const r = editor.brushSize / 2;
            ctx.save();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000';
            ctx.beginPath();
            ctx.arc(this._cursorPos.x, this._cursorPos.y, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this._cursorPos.x, this._cursorPos.y, Math.max(0, r - 1), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        _stamp(layer, x, y, editor) {
            const ctx = layer.ctx;
            const r = editor.brushSize / 2;
            ctx.save();
            ctx.globalCompositeOperation = this.blendMode || 'source-over';
            ctx.globalAlpha = editor.brushOpacity;
            const fg = editor.fgColor;
            if (editor.brushHardness >= 1) {
                ctx.fillStyle = fg;
            } else {
                const grad = ctx.createRadialGradient(x, y, r * editor.brushHardness, x, y, r);
                grad.addColorStop(0, fg);
                grad.addColorStop(1, fg + '00');
                ctx.fillStyle = grad;
            }
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        renderOptions(container, editor) {
            container.innerHTML = `
                <div class="ob-group">
                    <span class="ob-label">Dim:</span>
                    <input type="range" class="ob-range" id="brush-size-range" min="1" max="500" value="${editor.brushSize}">
                    <input type="number" class="ob-input ob-input-num" id="brush-size" value="${editor.brushSize}" min="1" max="2000">
                    <span class="ob-label">px</span>
                </div>
                <div class="ob-group">
                    <span class="ob-label">Durezza:</span>
                    <input type="range" class="ob-range" id="brush-hardness-range" min="0" max="100" value="${Math.round(editor.brushHardness * 100)}">
                    <input type="number" class="ob-input ob-input-num" id="brush-hardness" value="${Math.round(editor.brushHardness * 100)}" min="0" max="100">%
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
                    <span class="ob-label">Modo:</span>
                    <select class="ob-select" id="brush-mode">
                        <option value="source-over">Normale</option>
                        <option value="multiply">Moltiplica</option>
                        <option value="screen">Scolora</option>
                        <option value="overlay">Sovrapponi</option>
                        <option value="darken">Scurisci</option>
                        <option value="lighten">Schiarisci</option>
                        <option value="color-dodge">Sovraesp. colore</option>
                        <option value="color-burn">Sottoesp. colore</option>
                    </select>
                </div>
            `;
            const sizeIn = container.querySelector('#brush-size');
            const sizeRange = container.querySelector('#brush-size-range');
            const hardIn = container.querySelector('#brush-hardness');
            const hardRange = container.querySelector('#brush-hardness-range');

            const setSize = (v) => {
                v = Math.max(1, Math.min(2000, parseInt(v, 10) || 1));
                editor.brushSize = v;
                sizeIn.value = v;
                sizeRange.value = Math.min(500, v);
                window.PSBus.emit('brush:size', v);
            };
            const setHardness = (v) => {
                v = Math.max(0, Math.min(100, parseInt(v, 10) || 0));
                editor.brushHardness = v / 100;
                hardIn.value = v;
                hardRange.value = v;
            };
            sizeIn.addEventListener('input', e => setSize(e.target.value));
            sizeRange.addEventListener('input', e => setSize(e.target.value));
            hardIn.addEventListener('input', e => setHardness(e.target.value));
            hardRange.addEventListener('input', e => setHardness(e.target.value));

            container.querySelector('#brush-opacity').addEventListener('input', e => editor.brushOpacity = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)) / 100);
            container.querySelector('#brush-flow').addEventListener('input', e => editor.brushFlow = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)) / 100);
            container.querySelector('#brush-mode').addEventListener('change', e => this.blendMode = e.target.value);

            // Sync the input when [/] keyboard shortcuts fire
            this._brushBusUnsub && this._brushBusUnsub();
            this._brushBusUnsub = window.PSBus.on('brush:size', s => {
                if (document.body.contains(sizeIn)) { sizeIn.value = s; sizeRange.value = Math.min(500, s); }
            });
        }
    }
    window.PSTools.BrushTool = BrushTool;
})();
