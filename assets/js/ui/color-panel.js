/* Color panel — HSV picker */
(function () {
    function buildColorPanel(editor) {
        const root = document.getElementById('panel-color');
        root.innerHTML = `
            <div class="cp-pick-area" id="cp-area">
                <div class="cp-pick-cursor" id="cp-area-cursor"></div>
            </div>
            <div class="cp-hue" id="cp-hue">
                <div class="cp-hue-cursor" id="cp-hue-cursor" style="left:0"></div>
            </div>
            <div class="cp-values">
                <label>R</label><input type="number" id="cp-r" min="0" max="255" value="0">
                <label>G</label><input type="number" id="cp-g" min="0" max="255" value="0">
                <label>B</label><input type="number" id="cp-b" min="0" max="255" value="0">
                <label>A</label><input type="number" id="cp-a" min="0" max="100" value="100">
            </div>
            <div class="cp-hex">
                <label>#</label>
                <input type="text" id="cp-hex" maxlength="7" value="#000000">
                <button class="icon-btn" id="cp-fg-bg" title="Sta modificando primo piano">●</button>
            </div>
        `;
        let h = 0, s = 1, v = 0;
        let editingFg = true;
        const area = root.querySelector('#cp-area');
        const areaCur = root.querySelector('#cp-area-cursor');
        const hue = root.querySelector('#cp-hue');
        const hueCur = root.querySelector('#cp-hue-cursor');
        const inR = root.querySelector('#cp-r');
        const inG = root.querySelector('#cp-g');
        const inB = root.querySelector('#cp-b');
        const inHex = root.querySelector('#cp-hex');
        const fgBg = root.querySelector('#cp-fg-bg');

        function setFromHex(hex) {
            const rgb = hexToRgb(hex);
            const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
            h = hsv.h; s = hsv.s; v = hsv.v;
            refresh();
            inR.value = rgb.r; inG.value = rgb.g; inB.value = rgb.b;
            inHex.value = hex;
        }

        function refresh() {
            const rgb = hsvToRgb(h, s, v);
            inR.value = rgb.r; inG.value = rgb.g; inB.value = rgb.b;
            const hex = '#' + [rgb.r, rgb.g, rgb.b].map(x => x.toString(16).padStart(2, '0')).join('');
            inHex.value = hex;
            const hueRgb = hsvToRgb(h, 1, 1);
            area.style.background = `
                linear-gradient(to bottom, transparent, #000),
                linear-gradient(to right, #fff, rgb(${hueRgb.r},${hueRgb.g},${hueRgb.b}))
            `;
            areaCur.style.left = (s * 100) + '%';
            areaCur.style.top = ((1 - v) * 100) + '%';
            hueCur.style.left = ((h / 360) * 100) + '%';
            if (editingFg) editor.setFgColor(hex);
            else editor.setBgColor(hex);
        }

        function bindArea(el, onChange) {
            let dragging = false;
            const calc = (e) => {
                const r = el.getBoundingClientRect();
                const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
                const y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
                onChange(x, y);
            };
            el.addEventListener('pointerdown', e => { dragging = true; calc(e); el.setPointerCapture(e.pointerId); });
            el.addEventListener('pointermove', e => { if (dragging) calc(e); });
            el.addEventListener('pointerup', () => dragging = false);
        }

        bindArea(area, (x, y) => { s = x; v = 1 - y; refresh(); });
        bindArea(hue, (x) => { h = x * 360; refresh(); });

        [inR, inG, inB].forEach(input => input.addEventListener('input', () => {
            const rgb = { r: clamp(+inR.value, 0, 255), g: clamp(+inG.value, 0, 255), b: clamp(+inB.value, 0, 255) };
            const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
            h = hsv.h; s = hsv.s; v = hsv.v;
            refresh();
        }));
        inHex.addEventListener('change', () => {
            const val = inHex.value.startsWith('#') ? inHex.value : '#' + inHex.value;
            if (/^#[0-9a-f]{6}$/i.test(val)) setFromHex(val);
        });
        fgBg.addEventListener('click', () => {
            editingFg = !editingFg;
            fgBg.title = editingFg ? 'Sta modificando primo piano' : 'Sta modificando sfondo';
            fgBg.textContent = editingFg ? '●' : '○';
            setFromHex(editingFg ? editor.fgColor : editor.bgColor);
        });
        window.PSBus.on('color:fg', c => { if (editingFg) setFromHex(c); });
        window.PSBus.on('color:bg', c => { if (!editingFg) setFromHex(c); });

        setFromHex(editor.fgColor);
    }

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function hexToRgb(h) {
        const x = h.replace('#', '');
        return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16) };
    }
    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const d = max - min;
        let h = 0;
        const s = max === 0 ? 0 : d / max;
        const v = max;
        if (d !== 0) {
            if (max === r) h = 60 * (((g - b) / d) % 6);
            else if (max === g) h = 60 * ((b - r) / d + 2);
            else h = 60 * ((r - g) / d + 4);
        }
        if (h < 0) h += 360;
        return { h, s, v };
    }
    function hsvToRgb(h, s, v) {
        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;
        let r1 = 0, g1 = 0, b1 = 0;
        if (h < 60) [r1, g1, b1] = [c, x, 0];
        else if (h < 120) [r1, g1, b1] = [x, c, 0];
        else if (h < 180) [r1, g1, b1] = [0, c, x];
        else if (h < 240) [r1, g1, b1] = [0, x, c];
        else if (h < 300) [r1, g1, b1] = [x, 0, c];
        else [r1, g1, b1] = [c, 0, x];
        return { r: Math.round((r1 + m) * 255), g: Math.round((g1 + m) * 255), b: Math.round((b1 + m) * 255) };
    }

    window.PSUI.buildColorPanel = buildColorPanel;
})();
