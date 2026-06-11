/* App entry point */
(function () {
    function showDemoBannerIfNeeded() {
        if (!/github\.io$/i.test(location.hostname)) return;
        const bar = document.createElement('div');
        bar.id = 'demo-banner';
        bar.innerHTML = `
            <span class="demo-dot"></span>
            <b>Modalità demo</b>
            <span>— Backend PHP non disponibile su GitHub Pages. "Salva" scarica il progetto come file .pswc.json. Per la versione completa, clona il repo e lancia <code>php -S localhost:8000</code>.</span>
            <button id="demo-banner-close" title="Chiudi">×</button>
        `;
        document.body.appendChild(bar);
        document.body.classList.add('has-demo-banner');
        document.getElementById('demo-banner-close').addEventListener('click', () => {
            bar.remove();
            document.body.classList.remove('has-demo-banner');
        });
    }

    function boot() {
        const editor = new window.PSEditor();
        window.editor = editor; // for debug
        editor.init();
        showDemoBannerIfNeeded();

        // Register tools
        [
            'MoveTool','SelectRectTool','SelectEllipseTool','LassoTool','MagicWandTool',
            'CropTool','EyedropperTool','BrushTool','PencilTool','EraserTool',
            'BucketTool','TextTool','HandTool','ZoomTool'
        ].forEach(name => {
            const cls = window.PSTools[name];
            if (!cls) return;
            const t = new cls();
            editor.registerTool(t.id, t);
        });

        // Build UI
        window.PSUI.buildMenubar(editor);
        window.PSUI.buildToolbar(editor);
        window.PSUI.buildOptionsBar(editor);
        window.PSUI.buildColorPanel(editor);
        window.PSUI.buildSwatchesPanel(editor);
        window.PSUI.buildLayersPanel(editor);
        window.PSUI.buildHistoryPanel(editor);
        window.PSUI.buildPropertiesPanel(editor);
        window.PSUI.initDialogs(editor);
        window.PSUI.initWindowControls(editor);
        window.PSUI.initTheme();
        window.PSAPI.bindOpen(editor);

        // Initial document
        editor.createDocument({ name: 'Senza titolo-1', width: 1920, height: 1080, bg: 'white' });
        editor.setActiveTool('brush');

        // Resize observer for rulers
        window.addEventListener('resize', () => editor.viewport.drawRulers());
        setTimeout(() => editor.viewport.fit(), 100);

        // Theme change re-applies viewport/rulers
        window.PSBus.on('theme:changed', () => {
            editor.viewport.applyTransform();
            editor.requestRedraw();
        });

        // Status flash
        window.PSBus.on('status:flash', (msg) => {
            const tt = document.getElementById('sb-tooltip');
            if (!tt) return;
            const prev = tt.textContent;
            tt.textContent = msg;
            setTimeout(() => { tt.textContent = prev || 'Pronto'; }, 2500);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
