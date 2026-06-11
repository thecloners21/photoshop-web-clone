/* Type/Text tool — places a text label as a new layer */
(function () {
    class TextTool extends window.PSTool {
        constructor() {
            super({
                id: 'text', name: 'Testo orizzontale', shortcut: 'T',
                cursor: 'text',
                icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 4h14v3h-5v13h-4V7H5V4z"/></svg>`,
            });
            this._family = 'Adobe Clean';
            this._size = 60;
            this._weight = '400';
        }
        async onPointerDown(p, editor) {
            const res = await window.PSModal.promptForm({
                title: 'Strumento testo',
                icon: 'T',
                size: 'sm',
                okLabel: 'Inserisci',
                fields: [
                    { name: 'text', label: 'Testo', type: 'textarea', value: 'Testo' },
                    { name: 'family', label: 'Famiglia', type: 'select', value: this._family,
                      options: ['Adobe Clean','Arial','Helvetica','Times New Roman','Georgia','Courier New','Verdana','Tahoma','Impact','Comic Sans MS'].map(v => ({ value: v, label: v })) },
                    { name: 'weight', label: 'Stile', type: 'select', value: this._weight,
                      options: [
                          { value: '300', label: 'Light' },
                          { value: '400', label: 'Regular' },
                          { value: '500', label: 'Medium' },
                          { value: '700', label: 'Bold' },
                          { value: '900', label: 'Black' },
                      ] },
                    { name: 'size', label: 'Dimensione (pt)', type: 'number', value: this._size, min: 6, max: 500 },
                    { name: 'color', label: 'Colore', type: 'color', value: editor.fgColor },
                ],
            });
            if (!res || !res.text) return;
            this._family = res.family; this._weight = res.weight; this._size = res.size;
            const layer = new window.PSLayer({
                name: 'Testo',
                width: editor.activeDoc.width,
                height: editor.activeDoc.height,
            });
            const ctx = layer.ctx;
            ctx.font = `${res.weight} ${res.size}px "${res.family}", sans-serif`;
            ctx.fillStyle = res.color || editor.fgColor;
            ctx.textBaseline = 'top';
            const lines = (res.text + '').split('\n');
            const lh = res.size * 1.2;
            lines.forEach((line, i) => ctx.fillText(line, p.x, p.y + i * lh));
            const idx = editor.activeDoc.layers.length;
            editor.activeDoc.addLayer(layer);
            editor.activeDoc.history.push({
                type: 'layer-add', index: idx, layer, label: 'Testo: ' + res.text.slice(0, 20)
            });
            editor._rebuildLayerCanvases();
            editor.requestRedraw();
        }
        renderOptions(container, editor) {
            container.innerHTML = `
                <div class="ob-group">
                    <select class="ob-select" id="text-family">
                        <option>Adobe Clean</option>
                        <option>Arial</option>
                        <option>Helvetica</option>
                        <option>Times New Roman</option>
                        <option>Georgia</option>
                        <option>Courier New</option>
                        <option>Verdana</option>
                        <option>Tahoma</option>
                        <option>Impact</option>
                        <option>Comic Sans MS</option>
                    </select>
                </div>
                <div class="ob-group">
                    <select class="ob-select" id="text-weight">
                        <option value="100">Thin</option>
                        <option value="300">Light</option>
                        <option value="400" selected>Regular</option>
                        <option value="500">Medium</option>
                        <option value="700">Bold</option>
                        <option value="900">Black</option>
                    </select>
                </div>
                <div class="ob-group">
                    <span class="ob-label">Dim:</span>
                    <input type="number" class="ob-input ob-input-num" value="${this._size}" id="text-size" min="6" max="500">pt
                </div>
                <div class="ob-group">
                    <button class="ob-toggle" title="Allinea sx">⇤</button>
                    <button class="ob-toggle" title="Allinea centro">⇔</button>
                    <button class="ob-toggle" title="Allinea dx">⇥</button>
                </div>
                <div class="ob-group">
                    <span class="ob-label">Colore:</span>
                    <input type="color" id="text-color" value="${editor.fgColor}">
                </div>
            `;
            container.querySelector('#text-family').addEventListener('change', e => this._family = e.target.value);
            container.querySelector('#text-weight').addEventListener('change', e => this._weight = e.target.value);
            container.querySelector('#text-size').addEventListener('input', e => this._size = parseInt(e.target.value, 10) || 12);
            container.querySelector('#text-color').addEventListener('input', e => editor.setFgColor(e.target.value));
        }
    }
    window.PSTools.TextTool = TextTool;
})();
