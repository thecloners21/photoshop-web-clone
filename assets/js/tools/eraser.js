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
        }
        onPointerDown(p, editor) {
            const layer = editor.activeDoc.getActiveLayer();
            if (!layer || layer.locked) return;
            this._erasing = true;
            this._before = layer.snapshot();
            this._last = { x: p.x, y: p.y };
            this._stamp(layer, p.x, p.y, editor);
        }
        onPointerMove(p, editor) {
            if (!this._erasing) return;
            const layer = editor.activeDoc.getActiveLayer();
            const dx = p.x - this._last.x, dy = p.y - this._last.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const step = Math.max(1, editor.brushSize * 0.2);
            const steps = Math.ceil(dist / step);
            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                this._stamp(layer, this._last.x + dx * t, this._last.y + dy * t, editor);
            }
            this._last = { x: p.x, y: p.y };
            editor.requestRedraw();
        }
        onPointerUp(p, editor) {
            if (!this._erasing) return;
            this._erasing = false;
            const layer = editor.activeDoc.getActiveLayer();
            if (layer && this._before) {
                editor.pushPaintHistory(layer, this._before, layer.snapshot(), 'Gomma');
            }
            this._before = null;
            this._last = null;
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
                    <span class="ob-brush-preview"><span class="dot" style="background:#888"></span><span class="ob-brush-size">${editor.brushSize} px</span></span>
                </div>
                <div class="ob-group">
                    <span class="ob-label">Modo:</span>
                    <select class="ob-select"><option>Pennello</option><option>Matita</option><option>Quadrato</option></select>
                </div>
                <div class="ob-group">
                    <span class="ob-label">Opacità:</span>
                    <input type="number" class="ob-input ob-input-num" value="100">%
                </div>
                <div class="ob-group">
                    <span class="ob-label">Flusso:</span>
                    <input type="number" class="ob-input ob-input-num" value="100">%
                </div>
            `;
        }
    }
    window.PSTools.EraserTool = EraserTool;
})();
