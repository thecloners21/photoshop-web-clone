/* Zoom tool */
(function () {
    class ZoomTool extends window.PSTool {
        constructor() {
            super({
                id: 'zoom', name: 'Zoom', shortcut: 'Z',
                cursor: 'zoom-in',
                icon: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" fill="none"/><path stroke="currentColor" stroke-width="2" d="M16 16l5 5M8 11h6M11 8v6"/></svg>`,
            });
        }
        onPointerDown(p, editor) {
            if (p.alt) editor.viewport.zoomOut();
            else editor.viewport.zoomIn();
        }
        renderOptions(container) {
            container.innerHTML = `
                <div class="ob-group">
                    <button class="ob-toggle active" title="Zoom +">+</button>
                    <button class="ob-toggle" title="Zoom −">−</button>
                </div>
                <div class="ob-group">
                    <label class="ob-check"><input type="checkbox" checked> Ridimensiona finestre</label>
                    <label class="ob-check"><input type="checkbox"> Zoom con scorrimento</label>
                </div>
                <div class="ob-group">
                    <button class="ob-btn">100%</button>
                    <button class="ob-btn">Adatta a schermo</button>
                    <button class="ob-btn">Riempi schermo</button>
                </div>
            `;
        }
    }
    window.PSTools.ZoomTool = ZoomTool;
})();
