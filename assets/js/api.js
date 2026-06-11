/* API wrappers: PHP backend interactions + import/export local */
(function () {
    const API_BASE = 'backend/api';

    async function call(endpoint, opts = {}) {
        try {
            const res = await fetch(`${API_BASE}/${endpoint}`, opts);
            const ct = res.headers.get('content-type') || '';
            return ct.includes('json') ? res.json() : res.text();
        } catch (e) {
            console.warn('[api] request failed', endpoint, e);
            return { ok: false, error: 'network' };
        }
    }

    async function saveActive(editor) {
        const doc = editor.activeDoc;
        if (!doc) return;
        const flat = doc.flatten();
        const dataUrl = flat.toDataURL('image/png');
        const payload = {
            name: doc.name,
            width: doc.width, height: doc.height,
            resolution: doc.resolution, colorMode: doc.colorMode,
            preview: dataUrl,
            layers: doc.layers.map(l => ({
                name: l.name, visible: l.visible, opacity: l.opacity,
                blendMode: l.blendMode, x: l.x, y: l.y,
                width: l.width, height: l.height,
                data: l.toDataURL('image/png'),
            }))
        };
        const res = await call('projects.php?action=save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (res && res.ok) {
            window.PSBus.emit('status:flash', 'Salvato come progetto #' + res.id);
        } else {
            // Fallback: download as JSON
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            triggerDownload(blob, doc.name + '.pswc.json');
            window.PSBus.emit('status:flash', 'Backend non disponibile. Scaricato come file .pswc.json');
        }
    }

    function exportActive(editor, format = 'png') {
        const doc = editor.activeDoc;
        if (!doc) return;
        const flat = doc.flatten();
        const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
        flat.toBlob(blob => {
            triggerDownload(blob, doc.name + '.' + (format === 'jpeg' ? 'jpg' : format));
        }, mime, 0.95);
    }

    function triggerDownload(blob, filename) {
        const a = document.getElementById('hidden-download-anchor');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function bindOpen(editor) {
        const input = document.getElementById('hidden-file-input');
        input.addEventListener('change', () => {
            const file = input.files && input.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                const doc = editor.createDocument({
                    name: file.name,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    bg: 'transparent',
                });
                doc.layers = []; // remove default bg
                const layer = new window.PSLayer({ name: 'Sfondo', width: img.width, height: img.height });
                layer.ctx.drawImage(img, 0, 0);
                doc.addLayer(layer);
                editor._rebuildLayerCanvases();
                editor.viewport.fit();
                editor.requestRedraw();
                URL.revokeObjectURL(url);
                input.value = '';
            };
            img.src = url;
        });
    }

    async function listProjects() {
        return call('projects.php?action=list');
    }
    async function loadProject(id, editor) {
        const data = await call('projects.php?action=get&id=' + encodeURIComponent(id));
        if (!data || !data.ok) return;
        const p = data.project;
        const doc = editor.createDocument({ name: p.name, width: p.width, height: p.height, bg: 'transparent' });
        doc.layers = [];
        for (const ldata of p.layers) {
            const img = new Image();
            await new Promise(r => { img.onload = r; img.src = ldata.data; });
            const layer = new window.PSLayer({ name: ldata.name, width: ldata.width, height: ldata.height, opacity: ldata.opacity, blendMode: ldata.blendMode, visible: ldata.visible, x: ldata.x, y: ldata.y });
            layer.ctx.drawImage(img, 0, 0);
            doc.addLayer(layer);
        }
        editor._rebuildLayerCanvases();
        editor.requestRedraw();
    }

    window.PSAPI = { saveActive, exportActive, bindOpen, listProjects, loadProject };
})();
