/* Eyedropper tool */
(function () {
    class EyedropperTool extends window.PSTool {
        constructor() {
            super({
                id: 'eyedropper', name: 'Contagocce', shortcut: 'I',
                cursor: 'crosshair',
                icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16.5 3a3.5 3.5 0 0 1 2.5 6L17 11l1 1-2 2-1-1-7.5 7.5c-.5.5-1.2.5-1.5 0L4 18c-.3-.3-.3-1 .3-1.5L12 9l-1-1 2-2 1 1 2-2.4A3.5 3.5 0 0 1 16.5 3z"/></svg>`,
            });
        }
        onPointerDown(p, editor) {
            const merged = editor.activeDoc.flatten();
            const ctx = merged.getContext('2d');
            const x = Math.max(0, Math.min(merged.width - 1, Math.floor(p.x)));
            const y = Math.max(0, Math.min(merged.height - 1, Math.floor(p.y)));
            const d = ctx.getImageData(x, y, 1, 1).data;
            const hex = '#' + [d[0], d[1], d[2]].map(c => c.toString(16).padStart(2, '0')).join('');
            if (p.alt) editor.setBgColor(hex);
            else editor.setFgColor(hex);
        }
        onPointerMove(p, editor) {
            // ring preview could be added
        }
        renderOptions(container) {
            container.innerHTML = `
                <div class="ob-group">
                    <span class="ob-label">Dim. campione:</span>
                    <select class="ob-select">
                        <option>1 pixel</option>
                        <option>Media 3x3</option>
                        <option>Media 5x5</option>
                    </select>
                </div>
                <div class="ob-group">
                    <span class="ob-label">Campione:</span>
                    <select class="ob-select">
                        <option>Tutti i livelli</option>
                        <option>Livello corrente</option>
                    </select>
                </div>
            `;
        }
    }
    window.PSTools.EyedropperTool = EyedropperTool;
})();
