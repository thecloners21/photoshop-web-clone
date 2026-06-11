/* Magic Wand — flood-fill based selection */
(function () {
    class MagicWandTool extends window.PSTool {
        constructor() {
            super({
                id: 'magic-wand', name: 'Bacchetta magica', shortcut: 'W',
                cursor: 'crosshair', group: 'select',
                icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M14 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zm-7 9l-5 9 9-5L7 12z"/></svg>`,
            });
            this.tolerance = 32;
        }
        onPointerDown(p, editor) {
            const layer = editor.activeDoc.getActiveLayer();
            if (!layer) return;
            const x = Math.floor(p.x), y = Math.floor(p.y);
            if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) return;
            const img = layer.ctx.getImageData(0, 0, layer.width, layer.height);
            const data = img.data;
            const idx = (y * layer.width + x) * 4;
            const target = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
            const tol = this.tolerance;
            const mask = new Uint8Array(layer.width * layer.height);
            const stack = [[x, y]];
            let minX = x, maxX = x, minY = y, maxY = y;
            while (stack.length) {
                const [cx, cy] = stack.pop();
                if (cx < 0 || cy < 0 || cx >= layer.width || cy >= layer.height) continue;
                const mi = cy * layer.width + cx;
                if (mask[mi]) continue;
                const di = mi * 4;
                if (Math.abs(data[di] - target[0]) > tol) continue;
                if (Math.abs(data[di + 1] - target[1]) > tol) continue;
                if (Math.abs(data[di + 2] - target[2]) > tol) continue;
                if (Math.abs(data[di + 3] - target[3]) > tol) continue;
                mask[mi] = 1;
                if (cx < minX) minX = cx;
                if (cx > maxX) maxX = cx;
                if (cy < minY) minY = cy;
                if (cy > maxY) maxY = cy;
                stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
            }
            const before = editor.activeDoc.selection;
            const after = {
                x: minX, y: minY,
                w: maxX - minX + 1, h: maxY - minY + 1,
                shape: 'mask',
                mask, maskWidth: layer.width
            };
            editor.activeDoc.setSelection(after);
            editor.activeDoc.history.push({ type: 'selection', before, after, label: 'Bacchetta magica' });
            editor.requestRedraw();
        }
        renderOptions(container) {
            container.innerHTML = `
                <div class="ob-group">
                    <span class="ob-label">Tolleranza:</span>
                    <input type="number" class="ob-input ob-input-num" value="32" min="0" max="255" id="mw-tolerance">
                </div>
                <div class="ob-group">
                    <label class="ob-check"><input type="checkbox" checked> Anti-alias</label>
                    <label class="ob-check"><input type="checkbox" checked> Contigui</label>
                    <label class="ob-check"><input type="checkbox"> Tutti i livelli</label>
                </div>
            `;
            const tol = container.querySelector('#mw-tolerance');
            if (tol) tol.addEventListener('input', () => this.tolerance = parseInt(tol.value, 10) || 0);
        }
    }
    window.PSTools.MagicWandTool = MagicWandTool;
})();
