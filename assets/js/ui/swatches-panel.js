/* Swatches panel — preset color grid */
(function () {
    const PRESETS = [
        '#000000','#ffffff','#808080','#c0c0c0',
        '#7f0000','#ff0000','#ff8080','#ffcccc',
        '#7f4000','#ff8000','#ffcc80','#ffe0c0',
        '#7f7f00','#ffff00','#ffff80','#ffffc0',
        '#007f00','#00ff00','#80ff80','#c0ffc0',
        '#007f7f','#00ffff','#80ffff','#c0ffff',
        '#00007f','#0000ff','#8080ff','#c0c0ff',
        '#7f007f','#ff00ff','#ff80ff','#ffc0ff',
        '#1473e6','#31a8ff','#001e36','#0058cc',
        '#ff5722','#ffc107','#4caf50','#9c27b0',
        '#e91e63','#673ab7','#3f51b5','#03a9f4',
        '#009688','#cddc39','#795548','#607d8b',
    ];

    function buildSwatchesPanel(editor) {
        const root = document.getElementById('panel-swatches');
        root.innerHTML = '<div class="swatches-grid" id="swatches-grid"></div>';
        const grid = root.querySelector('#swatches-grid');
        PRESETS.forEach(c => {
            const sw = document.createElement('div');
            sw.className = 'swatch';
            sw.style.background = c;
            sw.title = c;
            sw.addEventListener('click', (e) => {
                if (e.altKey) editor.setBgColor(c);
                else editor.setFgColor(c);
            });
            grid.appendChild(sw);
        });
    }

    window.PSUI.buildSwatchesPanel = buildSwatchesPanel;
})();
