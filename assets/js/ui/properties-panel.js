/* Properties panel — context aware (document/layer) */
(function () {
    function buildPropertiesPanel(editor) {
        const root = document.getElementById('panel-properties');
        const adj = document.getElementById('panel-adjustments');
        const lib = document.getElementById('panel-libraries');

        function refresh() {
            const doc = editor.activeDoc;
            if (!doc) { root.innerHTML = '<div style="color:var(--text-muted);padding:10px">Nessun documento</div>'; return; }
            const layer = doc.getActiveLayer();
            root.innerHTML = `
                <div class="props-section">
                    <div style="font-weight:600;margin-bottom:6px">Documento</div>
                    <div class="props-row"><label>Larghezza</label><span>${doc.width} px</span></div>
                    <div class="props-row"><label>Altezza</label><span>${doc.height} px</span></div>
                    <div class="props-row"><label>Risoluzione</label><span>${doc.resolution} ppi</span></div>
                    <div class="props-row"><label>Metodo colore</label><span>${doc.colorMode}</span></div>
                </div>
                ${layer ? `
                <div class="props-section">
                    <div style="font-weight:600;margin-bottom:6px">Livello: ${layer.name}</div>
                    <div class="props-row"><label>X</label><input type="number" id="prop-lx" value="${layer.x}"></div>
                    <div class="props-row"><label>Y</label><input type="number" id="prop-ly" value="${layer.y}"></div>
                    <div class="props-row"><label>Larghezza</label><span>${layer.width} px</span></div>
                    <div class="props-row"><label>Altezza</label><span>${layer.height} px</span></div>
                    <div class="props-row"><label>Opacità</label>
                        <input type="number" id="prop-op" value="${Math.round(layer.opacity * 100)}" min="0" max="100"></div>
                </div>
                ` : ''}
            `;
            const px = root.querySelector('#prop-lx');
            const py = root.querySelector('#prop-ly');
            const op = root.querySelector('#prop-op');
            if (px) px.addEventListener('input', e => { layer.x = parseInt(e.target.value, 10) || 0; editor.requestRedraw(); });
            if (py) py.addEventListener('input', e => { layer.y = parseInt(e.target.value, 10) || 0; editor.requestRedraw(); });
            if (op) op.addEventListener('input', e => { layer.opacity = (parseInt(e.target.value, 10) || 0) / 100; editor.requestRedraw(); });
        }

        adj.innerHTML = `
            <div style="color:var(--text-muted);margin-bottom:6px">Crea livello di regolazione</div>
            <div class="adj-grid">
                <button class="adj-btn" data-adj="brightness" title="Luminosità/Contrasto">☀</button>
                <button class="adj-btn" data-adj="levels" title="Livelli">▤</button>
                <button class="adj-btn" data-adj="curves" title="Curve">⌒</button>
                <button class="adj-btn" data-adj="exposure" title="Esposizione">◐</button>
                <button class="adj-btn" data-adj="vibrance" title="Vividezza">★</button>
                <button class="adj-btn" data-adj="hsl" title="Tonalità/Saturazione">◑</button>
                <button class="adj-btn" data-adj="balance" title="Bilanciamento colore">⚖</button>
                <button class="adj-btn" data-adj="bw" title="Bianco e nero">◯</button>
                <button class="adj-btn" data-adj="invert" title="Inverti">⊘</button>
                <button class="adj-btn" data-adj="threshold" title="Soglia">▣</button>
                <button class="adj-btn" data-adj="gradient" title="Mappa sfumatura">⊐</button>
                <button class="adj-btn" data-adj="selective" title="Colore selettivo">◧</button>
            </div>
        `;
        adj.querySelectorAll('.adj-btn').forEach(b => b.addEventListener('click', () => {
            const k = b.dataset.adj;
            if (window.PSFilters && window.PSFilters[k]) window.PSFilters[k](editor);
        }));

        lib.innerHTML = `<div style="color:var(--text-muted);padding:10px">Libreria CC non disponibile.</div>`;

        window.PSBus.on('doc:changed', refresh);
        window.PSBus.on('doc:active-layer', refresh);
        window.PSBus.on('doc:layers-changed', refresh);
        refresh();
    }
    window.PSUI.buildPropertiesPanel = buildPropertiesPanel;
})();
