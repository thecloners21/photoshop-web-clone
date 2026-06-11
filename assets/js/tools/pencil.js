/* Pencil tool — hard-edged 1px+ brush */
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
        }
        onPointerDown(p, editor) {
            const layer = editor.activeDoc.getActiveLayer();
            if (!layer || layer.locked) return;
            this._stroking = true;
            this._before = layer.snapshot();
            this._last = { x: p.x, y: p.y };
            this._line(layer, p.x, p.y, p.x, p.y, editor);
        }
        onPointerMove(p, editor) {
            if (!this._stroking) return;
            const layer = editor.activeDoc.getActiveLayer();
            this._line(layer, this._last.x, this._last.y, p.x, p.y, editor);
            this._last = { x: p.x, y: p.y };
            editor.requestRedraw();
        }
        onPointerUp(p, editor) {
            if (!this._stroking) return;
            this._stroking = false;
            const layer = editor.activeDoc.getActiveLayer();
            if (layer && this._before) {
                const after = layer.snapshot();
                editor.pushPaintHistory(layer, this._before, after, 'Matita');
            }
            this._before = null; this._last = null;
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
                    <span class="ob-brush-preview" style="color:${editor.fgColor}">
                        <span class="dot"></span>
                        <span class="ob-brush-size">${editor.brushSize} px</span>
                    </span>
                </div>
                <div class="ob-group">
                    <span class="ob-label">Opacità:</span>
                    <input type="number" class="ob-input ob-input-num" value="100">%
                </div>
                <div class="ob-group">
                    <label class="ob-check"><input type="checkbox"> Cancella automaticamente</label>
                </div>
            `;
        }
    }
    window.PSTools.PencilTool = PencilTool;
})();
