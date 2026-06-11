/* Dialogs (new doc) + tab switching */
(function () {
    function init(editor) {
        // Generic close behavior
        document.querySelectorAll('.dialog-overlay').forEach(ov => {
            ov.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => ov.classList.add('hidden')));
        });

        // New doc dialog
        document.getElementById('newdoc-create').addEventListener('click', () => {
            const name = document.getElementById('newdoc-name').value || 'Senza titolo';
            const w = parseInt(document.getElementById('newdoc-width').value, 10) || 800;
            const h = parseInt(document.getElementById('newdoc-height').value, 10) || 600;
            const dpi = parseInt(document.getElementById('newdoc-dpi').value, 10) || 72;
            const bg = document.getElementById('newdoc-bg').value;
            editor.createDocument({ name, width: w, height: h, resolution: dpi, bg });
            document.getElementById('dialog-new-doc').classList.add('hidden');
            updateDocTab(editor);
        });

        // Panel tab switching
        document.querySelectorAll('.panel-group').forEach(group => {
            const tabs = group.querySelectorAll('.panel-tab');
            const bodies = group.querySelectorAll('.panel-body');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    bodies.forEach(b => b.classList.add('hidden'));
                    tab.classList.add('active');
                    const id = 'panel-' + tab.dataset.panel;
                    const body = document.getElementById(id);
                    if (body) body.classList.remove('hidden');
                });
            });
        });

        // Status bar zoom
        const sbZ = document.getElementById('sb-zoom-input');
        sbZ.addEventListener('change', () => {
            const z = (parseFloat(sbZ.value) || 100) / 100;
            editor.viewport.setZoom(z);
        });
        window.PSBus.on('viewport:zoom', z => sbZ.value = Math.round(z * 100));

        // Doc tab updates
        window.PSBus.on('doc:changed', () => updateDocTab(editor));
        window.PSBus.on('viewport:zoom', () => updateDocTab(editor));
    }

    function updateDocTab(editor) {
        const doc = editor.activeDoc;
        const tab = document.querySelector('.doc-tab.active .doc-tab-name');
        const info = document.getElementById('sb-doc-info');
        if (!doc) return;
        if (tab) tab.textContent = `${doc.name} @ ${Math.round(editor.viewport.zoom * 100)}% (${doc.colorMode})`;
        if (info) info.textContent = `Doc: ${doc.width} x ${doc.height} px • ${doc.colorMode} • ${doc.sizeMB()} MB`;
    }

    window.PSUI.initDialogs = init;

    // Title bar window controls (minimize / maximize / close)
    function initWindowControls(editor) {
        const btnMin = document.getElementById('btn-tb-minimize');
        const btnMax = document.getElementById('btn-tb-maximize');
        const btnClose = document.getElementById('btn-tb-close');

        // Minimize: collapse UI to titlebar, show restore pill
        btnMin.addEventListener('click', () => {
            document.body.classList.add('ps-iconified');
            let pill = document.querySelector('.ps-restore-pill');
            if (!pill) {
                pill = document.createElement('button');
                pill.className = 'ps-restore-pill';
                pill.innerHTML = '<span class="ps-mini-logo">Ps</span><span>Photoshop Web Clone — ripristina</span>';
                pill.title = 'Clicca per ripristinare la finestra';
                pill.addEventListener('click', restore);
                document.body.appendChild(pill);
            }
            window.PSBus.emit('status:flash', 'Finestra iconizzata');
        });

        function restore() {
            document.body.classList.remove('ps-iconified');
            const pill = document.querySelector('.ps-restore-pill');
            if (pill) pill.remove();
            if (editor && editor.viewport) {
                editor.viewport.applyTransform();
                editor.requestRedraw();
            }
        }

        // Maximize: toggle fullscreen API
        btnMax.addEventListener('click', async () => {
            try {
                if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                } else {
                    await document.exitFullscreen();
                }
            } catch (e) {
                window.PSModal.alert(
                    'Il browser ha rifiutato la richiesta di tutto schermo.\nProva premendo F11 sulla tastiera.',
                    'Tutto schermo non disponibile', '⚠'
                );
            }
        });
        document.addEventListener('fullscreenchange', () => {
            const isFs = !!document.fullscreenElement;
            btnMax.title = isFs ? 'Esci da tutto schermo (F11)' : 'A tutto schermo (F11)';
            btnMax.innerHTML = isFs
                ? '<svg viewBox="0 0 12 12" width="12" height="12"><rect x="3" y="3" width="6" height="6" stroke="currentColor" stroke-width="1.2" fill="none"/><path stroke="currentColor" stroke-width="1.2" d="M1 5V1h4M11 7v4H7" fill="none"/></svg>'
                : '<svg viewBox="0 0 12 12" width="12" height="12"><rect x="2" y="2" width="8" height="8" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>';
            if (editor && editor.viewport) editor.viewport.drawRulers();
        });

        // Close: confirm, then attempt window.close() then show close screen
        btnClose.addEventListener('click', async () => {
            const ok = await window.PSModal.confirm(
                'Vuoi davvero chiudere Photoshop Web Clone?\nEventuali modifiche non salvate andranno perse.',
                'Chiudi applicazione'
            );
            if (!ok) return;
            // Try to close — works only if window was opened via JS in some browsers
            try { window.close(); } catch (_) {}
            // Fallback: show close screen overlay
            setTimeout(() => {
                if (document.querySelector('.ps-closed-screen')) return;
                const scr = document.createElement('div');
                scr.className = 'ps-closed-screen';
                scr.innerHTML = `
                    <div class="logo">Ps</div>
                    <h2>Photoshop Web Clone chiuso</h2>
                    <p>Puoi chiudere la scheda del browser o riavviare l'applicazione dal pulsante qui sotto.</p>
                    <button id="ps-relaunch">Riavvia applicazione</button>
                `;
                document.body.appendChild(scr);
                scr.querySelector('#ps-relaunch').addEventListener('click', () => location.reload());
            }, 100);
        });

        // F11 binding mirror
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F11') {
                e.preventDefault();
                btnMax.click();
            }
        });
    }

    window.PSUI.initWindowControls = initWindowControls;
})();
