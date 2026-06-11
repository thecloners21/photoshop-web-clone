/* Crop tool */
(function () {
    class CropTool extends window.PSTool {
        constructor() {
            super({
                id: 'crop', name: 'Ritaglia', shortcut: 'C',
                cursor: 'crosshair',
                icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 1v4H3v2h4v12h12v4h2v-4h2v-2H9V7h12V5H7V1H5v4H1v2h6V1H7z"/></svg>`,
            });
            this._rect = null;
        }
        onPointerDown(p) { this._rect = { x: p.x, y: p.y, w: 0, h: 0, sx: p.x, sy: p.y }; }
        onPointerMove(p, editor) {
            if (!this._rect) return;
            const r = this._rect;
            r.x = Math.min(r.sx, p.x);
            r.y = Math.min(r.sy, p.y);
            r.w = Math.abs(p.x - r.sx);
            r.h = Math.abs(p.y - r.sy);
            editor.requestRedraw();
        }
        onPointerUp(p, editor) {
            if (!this._rect || this._rect.w < 5 || this._rect.h < 5) { this._rect = null; return; }
        }
        commit(editor) {
            if (!this._rect) return;
            const r = this._rect;
            const doc = editor.activeDoc;
            for (const layer of doc.layers) {
                const newCanvas = document.createElement('canvas');
                newCanvas.width = Math.round(r.w);
                newCanvas.height = Math.round(r.h);
                const ctx = newCanvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(layer.canvas, -r.x + layer.x, -r.y + layer.y);
                layer.canvas = newCanvas;
                layer.ctx = ctx;
                layer.width = newCanvas.width;
                layer.height = newCanvas.height;
                layer.x = 0; layer.y = 0;
            }
            doc.width = Math.round(r.w);
            doc.height = Math.round(r.h);
            editor._rebuildLayerCanvases();
            editor._renderCheckerboard();
            editor.viewport.applyTransform();
            editor.requestRedraw();
            this._rect = null;
            window.PSBus.emit('doc:layers-changed', doc);
            window.PSBus.emit('doc:changed', doc);
        }
        drawOverlay(ctx, editor) {
            if (!this._rect) return;
            const r = this._rect;
            const doc = editor.activeDoc;
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,.5)';
            ctx.fillRect(0, 0, doc.width, doc.height);
            ctx.clearRect(r.x, r.y, r.w, r.h);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h);
            // thirds
            ctx.beginPath();
            for (let i = 1; i < 3; i++) {
                ctx.moveTo(r.x + (r.w * i) / 3, r.y);
                ctx.lineTo(r.x + (r.w * i) / 3, r.y + r.h);
                ctx.moveTo(r.x, r.y + (r.h * i) / 3);
                ctx.lineTo(r.x + r.w, r.y + (r.h * i) / 3);
            }
            ctx.strokeStyle = 'rgba(255,255,255,.6)';
            ctx.stroke();
            ctx.restore();
        }
        renderOptions(container, editor) {
            container.innerHTML = `
                <div class="ob-group">
                    <select class="ob-select">
                        <option>Proporzioni</option>
                        <option>1:1</option>
                        <option>4:3</option>
                        <option>16:9</option>
                    </select>
                </div>
                <div class="ob-group">
                    <label class="ob-check"><input type="checkbox"> Elimina pixel ritagliati</label>
                </div>
                <div class="ob-group">
                    <button class="ob-btn" id="crop-commit">✓ Applica</button>
                    <button class="ob-btn" id="crop-cancel">✕ Annulla</button>
                </div>
            `;
            container.querySelector('#crop-commit').addEventListener('click', () => this.commit(editor));
            container.querySelector('#crop-cancel').addEventListener('click', () => { this._rect = null; editor.requestRedraw(); });
        }
    }
    window.PSTools.CropTool = CropTool;
})();
