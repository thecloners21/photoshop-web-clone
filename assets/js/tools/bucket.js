/* Paint bucket — flood fill */
(function () {
    class BucketTool extends window.PSTool {
        constructor() {
            super({
                id: 'bucket', name: 'Secchiello', shortcut: 'G',
                cursor: 'crosshair',
                icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 3l8 8-6 6c-1 1-1 3 0 4l3 0 6-6 4-4-8-8H5zm14 12c-1 2-1 4 0 5s3-1 3-3-3-2-3-2z"/></svg>`,
            });
            this.tolerance = 32;
        }
        onPointerDown(p, editor) {
            const layer = editor.activeDoc.getActiveLayer();
            if (!layer || layer.locked) return;
            const before = layer.snapshot();
            const img = layer.ctx.getImageData(0, 0, layer.width, layer.height);
            const data = img.data;
            const x = Math.floor(p.x), y = Math.floor(p.y);
            if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) return;
            const idx = (y * layer.width + x) * 4;
            const target = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
            const hex = editor.fgColor;
            const fill = this._hexToRgb(hex);
            if (this._matches(target, [fill.r, fill.g, fill.b, 255], 0)) return;
            const tol = this.tolerance;
            const stack = [[x, y]];
            const visited = new Uint8Array(layer.width * layer.height);
            while (stack.length) {
                const [cx, cy] = stack.pop();
                if (cx < 0 || cy < 0 || cx >= layer.width || cy >= layer.height) continue;
                const mi = cy * layer.width + cx;
                if (visited[mi]) continue;
                const di = mi * 4;
                if (Math.abs(data[di] - target[0]) > tol) continue;
                if (Math.abs(data[di + 1] - target[1]) > tol) continue;
                if (Math.abs(data[di + 2] - target[2]) > tol) continue;
                if (Math.abs(data[di + 3] - target[3]) > tol) continue;
                visited[mi] = 1;
                data[di] = fill.r;
                data[di + 1] = fill.g;
                data[di + 2] = fill.b;
                data[di + 3] = 255;
                stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
            }
            layer.ctx.putImageData(img, 0, 0);
            editor.pushPaintHistory(layer, before, layer.snapshot(), 'Riempimento');
            editor.requestRedraw();
        }
        _matches(a, b, tol) {
            return Math.abs(a[0] - b[0]) <= tol &&
                   Math.abs(a[1] - b[1]) <= tol &&
                   Math.abs(a[2] - b[2]) <= tol &&
                   Math.abs(a[3] - b[3]) <= tol;
        }
        _hexToRgb(h) {
            const x = h.replace('#', '');
            return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16) };
        }
        renderOptions(container) {
            container.innerHTML = `
                <div class="ob-group">
                    <select class="ob-select"><option>Primo piano</option><option>Sfondo</option><option>Pattern</option></select>
                </div>
                <div class="ob-group">
                    <span class="ob-label">Modo:</span>
                    <select class="ob-select"><option>Normale</option><option>Moltiplica</option><option>Sovrapponi</option></select>
                </div>
                <div class="ob-group">
                    <span class="ob-label">Opacità:</span>
                    <input type="number" class="ob-input ob-input-num" value="100">%
                </div>
                <div class="ob-group">
                    <span class="ob-label">Tolleranza:</span>
                    <input type="number" class="ob-input ob-input-num" value="32" id="bucket-tol" min="0" max="255">
                </div>
                <div class="ob-group">
                    <label class="ob-check"><input type="checkbox" checked> Anti-alias</label>
                    <label class="ob-check"><input type="checkbox" checked> Contigui</label>
                </div>
            `;
            const t = container.querySelector('#bucket-tol');
            if (t) t.addEventListener('input', () => this.tolerance = parseInt(t.value, 10) || 0);
        }
    }
    window.PSTools.BucketTool = BucketTool;
})();
