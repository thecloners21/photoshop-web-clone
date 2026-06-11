/* Layers panel — full layer management UI */
(function () {
    function buildLayersPanel(editor) {
        const root = document.getElementById('panel-layers');
        root.innerHTML = `
            <div class="layers-toolbar">
                <select class="layers-blend" id="layers-blend">
                    ${window.PS_BLEND_MODES.map(m => `<option value="${m}">${m}</option>`).join('')}
                </select>
            </div>
            <div class="layers-opacity">
                <span class="lbl">Opacità:</span>
                <input type="number" class="val" id="layers-opacity" min="0" max="100" value="100">
                <span class="lbl">%</span>
            </div>
            <div class="layer-locks">
                <span class="lbl">Blocco:</span>
                <button id="lock-tr" title="Blocca trasparenza">▦</button>
                <button id="lock-px" title="Blocca pixel">✏</button>
                <button id="lock-pos" title="Blocca posizione">✥</button>
                <button id="lock-all" title="Blocca tutto">🔒</button>
                <span class="lbl" style="margin-left:auto">Riempimento:</span>
                <input type="number" class="val" id="layers-fill" min="0" max="100" value="100" style="width:50px">
                <span class="lbl">%</span>
            </div>
            <div class="layers-list" id="layers-list"></div>
            <div class="layers-footer">
                <button class="icon-btn" id="btn-layer-link" title="Collega livelli">⌒</button>
                <button class="icon-btn" id="btn-layer-fx" title="Aggiungi stile livello">fx</button>
                <button class="icon-btn" id="btn-layer-mask" title="Aggiungi maschera">▢</button>
                <button class="icon-btn" id="btn-layer-adj" title="Crea livello regolazione">◐</button>
                <button class="icon-btn" id="btn-layer-group" title="Nuovo gruppo">▣</button>
                <button class="icon-btn" id="btn-layer-new" title="Nuovo livello">＋</button>
                <button class="icon-btn" id="btn-layer-delete" title="Elimina livello">🗑</button>
            </div>
        `;

        const list = root.querySelector('#layers-list');
        const blend = root.querySelector('#layers-blend');
        const op = root.querySelector('#layers-opacity');

        function refresh() {
            const doc = editor.activeDoc;
            list.innerHTML = '';
            if (!doc) return;
            // Photoshop displays layers top-down (top of stack first)
            for (let i = doc.layers.length - 1; i >= 0; i--) {
                const layer = doc.layers[i];
                const row = document.createElement('div');
                row.className = 'layer-row' + (i === doc.activeLayerIndex ? ' selected' : '');
                row.draggable = true;
                row.dataset.index = i;

                const eye = document.createElement('button');
                eye.className = 'layer-eye' + (layer.visible ? '' : ' hidden-eye');
                eye.innerHTML = layer.visible
                    ? '<svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/></svg>'
                    : '<svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M2 4l18 18-1 1-3-3a13 13 0 0 1-4 1c-6 0-10-7-10-7a17 17 0 0 1 4-5L1 5l1-1zm10 5a3 3 0 0 1 3 3v.3l-3.3-3.3.3 0z"/></svg>';
                eye.addEventListener('click', (e) => {
                    e.stopPropagation();
                    layer.visible = !layer.visible;
                    editor.requestRedraw();
                    refresh();
                });

                const thumb = document.createElement('div');
                thumb.className = 'layer-thumb';
                const th = document.createElement('canvas');
                th.width = 34; th.height = 28;
                thumb.appendChild(th);
                layer.renderThumb(th);

                const name = document.createElement('div');
                name.className = 'layer-name';
                name.textContent = layer.name;
                name.title = layer.name;
                name.addEventListener('dblclick', () => {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = layer.name;
                    name.innerHTML = '';
                    name.appendChild(input);
                    input.focus();
                    input.select();
                    const commit = () => { layer.name = input.value || layer.name; refresh(); };
                    input.addEventListener('blur', commit);
                    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') commit(); });
                });

                row.appendChild(eye);
                row.appendChild(thumb);
                row.appendChild(name);
                row.addEventListener('click', () => {
                    doc.setActiveLayer(i);
                    refresh();
                    blend.value = layer.blendMode;
                    op.value = Math.round(layer.opacity * 100);
                });

                row.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', i); row.style.opacity = '.5'; });
                row.addEventListener('dragend', e => { row.style.opacity = '1'; });
                row.addEventListener('dragover', e => e.preventDefault());
                row.addEventListener('drop', e => {
                    e.preventDefault();
                    const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                    const to = parseInt(row.dataset.index, 10);
                    doc.moveLayer(from, to);
                    editor._rebuildLayerCanvases();
                    editor.requestRedraw();
                    refresh();
                });
                list.appendChild(row);
            }
            const active = doc.getActiveLayer();
            if (active) {
                blend.value = active.blendMode;
                op.value = Math.round(active.opacity * 100);
            }
        }

        blend.addEventListener('change', () => {
            const layer = editor.activeDoc.getActiveLayer();
            if (!layer) return;
            layer.blendMode = blend.value;
            editor.requestRedraw();
        });
        op.addEventListener('input', () => {
            const layer = editor.activeDoc.getActiveLayer();
            if (!layer) return;
            layer.opacity = (parseInt(op.value, 10) || 0) / 100;
            editor.requestRedraw();
        });

        root.querySelector('#btn-layer-new').addEventListener('click', () => addLayer());
        root.querySelector('#btn-layer-delete').addEventListener('click', () => deleteActive());
        root.querySelector('#btn-layer-group').addEventListener('click', () => addLayer('Gruppo'));
        root.querySelector('#btn-layer-link').addEventListener('click', () =>
            window.PSBus.emit('status:flash', 'Collegamento livelli: prossima versione'));
        root.querySelector('#btn-layer-fx').addEventListener('click', () =>
            window.PSModal.alert('Stili di livello (ombra, glow, traccia) sono previsti nella fase 2.', 'Non ancora disponibile', 'fx'));
        root.querySelector('#btn-layer-mask').addEventListener('click', () =>
            window.PSModal.alert('Maschere di livello sono previste nella fase 2.', 'Non ancora disponibile', '▢'));
        root.querySelector('#btn-layer-adj').addEventListener('click', () =>
            window.PSModal.alert('Livelli di regolazione non distruttivi: prossima versione.\nNel frattempo applica regolazioni direttamente dal menu Immagine > Regolazioni.', 'Non ancora disponibile', '◐'));

        // Lock toolbar
        const lockBtns = {
            'lock-tr':  () => { const l = editor.activeDoc.getActiveLayer(); if (l) { l.lockTransparency = !l.lockTransparency; refreshLocks(); } },
            'lock-px':  () => { const l = editor.activeDoc.getActiveLayer(); if (l) { l.locked = !l.locked; refreshLocks(); window.PSBus.emit('status:flash', 'Livello ' + (l.locked ? 'bloccato' : 'sbloccato')); } },
            'lock-pos': () => { const l = editor.activeDoc.getActiveLayer(); if (l) { l.lockPosition = !l.lockPosition; refreshLocks(); } },
            'lock-all': () => { const l = editor.activeDoc.getActiveLayer(); if (!l) return; const next = !l.locked; l.locked = next; l.lockTransparency = next; l.lockPosition = next; refreshLocks(); window.PSBus.emit('status:flash', 'Livello ' + (next ? 'bloccato' : 'sbloccato')); },
        };
        Object.keys(lockBtns).forEach(id => {
            const b = root.querySelector('#' + id);
            if (b) b.addEventListener('click', lockBtns[id]);
        });
        function refreshLocks() {
            const l = editor.activeDoc.getActiveLayer();
            if (!l) return;
            root.querySelector('#lock-tr').classList.toggle('active', !!l.lockTransparency);
            root.querySelector('#lock-px').classList.toggle('active', !!l.locked);
            root.querySelector('#lock-pos').classList.toggle('active', !!l.lockPosition);
            root.querySelector('#lock-all').classList.toggle('active', !!(l.locked && l.lockTransparency && l.lockPosition));
            editor.requestRedraw();
        }
        window.PSBus.on('doc:active-layer', refreshLocks);
        window.PSBus.on('doc:layers-changed', refreshLocks);
        window.PSBus.on('layers:new', addLayer);
        window.PSBus.on('layers:delete', deleteActive);
        window.PSBus.on('layers:duplicate', duplicateActive);
        window.PSBus.on('layers:merge-down', mergeDown);
        window.PSBus.on('layers:merge-visible', mergeVisible);
        window.PSBus.on('layers:flatten', flatten);

        function addLayer(prefix = 'Livello') {
            const doc = editor.activeDoc;
            if (!doc) return;
            const layer = new window.PSLayer({
                name: prefix + ' ' + (doc.layers.length + 1),
                width: doc.width, height: doc.height,
            });
            doc.addLayer(layer);
            editor._rebuildLayerCanvases();
            editor.requestRedraw();
            refresh();
        }
        function deleteActive() {
            const doc = editor.activeDoc;
            if (!doc || doc.layers.length <= 1) return;
            doc.removeLayer(doc.activeLayerIndex);
            editor._rebuildLayerCanvases();
            editor.requestRedraw();
            refresh();
        }
        function duplicateActive() {
            const doc = editor.activeDoc;
            const active = doc.getActiveLayer();
            if (!active) return;
            const clone = active.clone();
            doc.addLayer(clone, doc.activeLayerIndex + 1);
            editor._rebuildLayerCanvases();
            editor.requestRedraw();
            refresh();
        }
        function mergeDown() {
            const doc = editor.activeDoc;
            if (doc.activeLayerIndex <= 0) return;
            const upper = doc.layers[doc.activeLayerIndex];
            const lower = doc.layers[doc.activeLayerIndex - 1];
            const ctx = lower.ctx;
            ctx.save();
            ctx.globalAlpha = upper.opacity;
            ctx.globalCompositeOperation = upper.blendMode === 'normal' ? 'source-over' : upper.blendMode;
            ctx.drawImage(upper.canvas, upper.x - lower.x, upper.y - lower.y);
            ctx.restore();
            doc.removeLayer(doc.activeLayerIndex);
            editor._rebuildLayerCanvases();
            editor.requestRedraw();
            refresh();
        }
        function mergeVisible() {
            const doc = editor.activeDoc;
            const flat = doc.flatten();
            const layer = new window.PSLayer({ name: 'Unione visibili', width: doc.width, height: doc.height });
            layer.ctx.drawImage(flat, 0, 0);
            doc.layers = [layer];
            doc.activeLayerIndex = 0;
            editor._rebuildLayerCanvases();
            editor.requestRedraw();
            refresh();
        }
        function flatten() { mergeVisible(); }

        window.PSBus.on('doc:layers-changed', refresh);
        window.PSBus.on('doc:active-layer', refresh);
        window.PSBus.on('layers:redraw', () => {
            // refresh thumbs
            const doc = editor.activeDoc;
            if (!doc) return;
            list.querySelectorAll('.layer-row').forEach(row => {
                const idx = parseInt(row.dataset.index, 10);
                const canvas = row.querySelector('.layer-thumb canvas');
                if (canvas && doc.layers[idx]) doc.layers[idx].renderThumb(canvas);
            });
        });

        refresh();
    }

    window.PSUI.buildLayersPanel = buildLayersPanel;
})();
