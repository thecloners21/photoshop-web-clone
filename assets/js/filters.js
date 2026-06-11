/* Image filters & adjustments — using elegant PSModal forms */
(function () {
    function getActive(editor) {
        const doc = editor.activeDoc;
        if (!doc) return null;
        const layer = doc.getActiveLayer();
        if (!layer || layer.locked) return null;
        return { doc, layer };
    }

    function applyFilter(editor, fn, label) {
        const ctx = getActive(editor);
        if (!ctx) return;
        const { layer } = ctx;
        const before = layer.snapshot();
        const img = layer.ctx.getImageData(0, 0, layer.width, layer.height);
        fn(img);
        layer.ctx.putImageData(img, 0, 0);
        editor.pushPaintHistory(layer, before, layer.snapshot(), label);
        editor.requestRedraw();
    }

    async function askForm(opts) { return window.PSModal.promptForm(opts); }

    const Filters = {
        invert(editor) {
            applyFilter(editor, img => {
                const d = img.data;
                for (let i = 0; i < d.length; i += 4) {
                    d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2];
                }
            }, 'Inverti');
        },
        grayscale(editor) {
            applyFilter(editor, img => {
                const d = img.data;
                for (let i = 0; i < d.length; i += 4) {
                    const y = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
                    d[i] = d[i + 1] = d[i + 2] = y;
                }
            }, 'Bianco e nero');
        },
        bw(editor) { Filters.grayscale(editor); },

        async noise(editor) {
            const r = await askForm({
                title: 'Aggiungi disturbo', icon: '◌',
                fields: [
                    { name: 'amount', label: 'Quantità', type: 'number', value: 20, min: 0, max: 100, step: 1 },
                    { name: 'mono', label: 'Monocromatico', type: 'select', value: 'no',
                      options: [{value:'no', label:'No'},{value:'yes', label:'Sì'}] },
                ],
            });
            if (!r) return;
            applyFilter(editor, img => {
                const d = img.data, a = r.amount;
                for (let i = 0; i < d.length; i += 4) {
                    if (r.mono === 'yes') {
                        const n = (Math.random() - 0.5) * 2 * a;
                        d[i] = clamp(d[i] + n); d[i + 1] = clamp(d[i + 1] + n); d[i + 2] = clamp(d[i + 2] + n);
                    } else {
                        d[i] = clamp(d[i] + (Math.random() - 0.5) * 2 * a);
                        d[i + 1] = clamp(d[i + 1] + (Math.random() - 0.5) * 2 * a);
                        d[i + 2] = clamp(d[i + 2] + (Math.random() - 0.5) * 2 * a);
                    }
                }
            }, 'Disturbo');
        },

        async blur(editor) {
            const r = await askForm({
                title: 'Sfocatura gaussiana', icon: '◌',
                fields: [{ name: 'radius', label: 'Raggio (px)', type: 'number', value: 4, min: 0, max: 100, step: 0.5 }],
            });
            if (!r) return;
            const ctx = getActive(editor);
            if (!ctx) return;
            const { layer } = ctx;
            const before = layer.snapshot();
            const tmp = document.createElement('canvas');
            tmp.width = layer.width; tmp.height = layer.height;
            const t = tmp.getContext('2d');
            t.filter = `blur(${r.radius}px)`;
            t.drawImage(layer.canvas, 0, 0);
            layer.ctx.clearRect(0, 0, layer.width, layer.height);
            layer.ctx.drawImage(tmp, 0, 0);
            editor.pushPaintHistory(layer, before, layer.snapshot(), 'Sfocatura gaussiana');
            editor.requestRedraw();
        },

        async pixelate(editor) {
            const r = await askForm({
                title: 'Effetto mosaico', icon: '▦',
                fields: [{ name: 'size', label: 'Dimensione cella (px)', type: 'number', value: 10, min: 2, max: 200, step: 1 }],
            });
            if (!r) return;
            const ctx = getActive(editor);
            if (!ctx) return;
            const { layer } = ctx;
            const before = layer.snapshot();
            const tmp = document.createElement('canvas');
            tmp.width = Math.max(1, Math.floor(layer.width / r.size));
            tmp.height = Math.max(1, Math.floor(layer.height / r.size));
            const t = tmp.getContext('2d');
            t.imageSmoothingEnabled = false;
            t.drawImage(layer.canvas, 0, 0, tmp.width, tmp.height);
            layer.ctx.imageSmoothingEnabled = false;
            layer.ctx.clearRect(0, 0, layer.width, layer.height);
            layer.ctx.drawImage(tmp, 0, 0, layer.width, layer.height);
            layer.ctx.imageSmoothingEnabled = true;
            editor.pushPaintHistory(layer, before, layer.snapshot(), 'Mosaico');
            editor.requestRedraw();
        },

        edges(editor) {
            applyFilter(editor, img => {
                const w = img.width, h = img.height;
                const src = new Uint8ClampedArray(img.data);
                const d = img.data;
                for (let y = 1; y < h - 1; y++) {
                    for (let x = 1; x < w - 1; x++) {
                        const i = (y * w + x) * 4;
                        const get = (xx, yy) => src[(yy * w + xx) * 4];
                        const gx = -get(x - 1, y - 1) - 2 * get(x - 1, y) - get(x - 1, y + 1) +
                                    get(x + 1, y - 1) + 2 * get(x + 1, y) + get(x + 1, y + 1);
                        const gy = -get(x - 1, y - 1) - 2 * get(x, y - 1) - get(x + 1, y - 1) +
                                    get(x - 1, y + 1) + 2 * get(x, y + 1) + get(x + 1, y + 1);
                        const v = Math.min(255, Math.sqrt(gx * gx + gy * gy));
                        d[i] = d[i + 1] = d[i + 2] = v;
                    }
                }
            }, 'Trova bordi');
        },

        async brightness(editor) {
            const r = await askForm({
                title: 'Luminosità/Contrasto', icon: '☀',
                fields: [
                    { name: 'brightness', label: 'Luminosità', type: 'number', value: 0, min: -100, max: 100 },
                    { name: 'contrast', label: 'Contrasto', type: 'number', value: 0, min: -100, max: 100 },
                ],
            });
            if (!r) return;
            applyFilter(editor, img => {
                const d = img.data;
                const b = r.brightness * 2.55;
                const c = (r.contrast + 100) / 100;
                const off = 128 - 128 * c;
                for (let i = 0; i < d.length; i += 4) {
                    d[i] = clamp(d[i] * c + off + b);
                    d[i + 1] = clamp(d[i + 1] * c + off + b);
                    d[i + 2] = clamp(d[i + 2] * c + off + b);
                }
            }, 'Luminosità/Contrasto');
        },

        async levels(editor) {
            const r = await askForm({
                title: 'Livelli', icon: '▤',
                fields: [
                    { name: 'black', label: 'Punto nero', type: 'number', value: 0, min: 0, max: 254 },
                    { name: 'gamma', label: 'Gamma', type: 'number', value: 1, min: 0.1, max: 9.9, step: 0.05 },
                    { name: 'white', label: 'Punto bianco', type: 'number', value: 255, min: 1, max: 255 },
                ],
            });
            if (!r) return;
            applyFilter(editor, img => {
                const d = img.data;
                const range = Math.max(1, r.white - r.black);
                const inv = 1 / r.gamma;
                for (let i = 0; i < d.length; i += 4) {
                    for (let k = 0; k < 3; k++) {
                        let v = (d[i + k] - r.black) / range;
                        v = Math.max(0, Math.min(1, v));
                        v = Math.pow(v, inv);
                        d[i + k] = clamp(v * 255);
                    }
                }
            }, 'Livelli');
        },

        async curves(editor) {
            const r = await askForm({
                title: 'Curve (semplificato)', icon: '⌒',
                fields: [
                    { name: 'lo', label: 'Ombre', type: 'number', value: 0, min: -100, max: 100 },
                    { name: 'mid', label: 'Mezzitoni', type: 'number', value: 0, min: -100, max: 100 },
                    { name: 'hi', label: 'Luci', type: 'number', value: 0, min: -100, max: 100 },
                ],
            });
            if (!r) return;
            applyFilter(editor, img => {
                const d = img.data;
                const lut = new Uint8ClampedArray(256);
                for (let i = 0; i < 256; i++) {
                    const t = i / 255;
                    const lo = (1 - t) * (1 - t) * r.lo / 100;
                    const mid = 2 * t * (1 - t) * r.mid / 100;
                    const hi = t * t * r.hi / 100;
                    lut[i] = clamp(i + (lo + mid + hi) * 255);
                }
                for (let i = 0; i < d.length; i += 4) {
                    d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]];
                }
            }, 'Curve');
        },

        async exposure(editor) {
            const r = await askForm({
                title: 'Esposizione', icon: '◐',
                fields: [
                    { name: 'exposure', label: 'Esposizione (EV)', type: 'number', value: 0.5, min: -3, max: 3, step: 0.05 },
                ],
            });
            if (!r) return;
            const k = Math.pow(2, r.exposure);
            applyFilter(editor, img => {
                const d = img.data;
                for (let i = 0; i < d.length; i += 4) {
                    d[i] = clamp(d[i] * k);
                    d[i + 1] = clamp(d[i + 1] * k);
                    d[i + 2] = clamp(d[i + 2] * k);
                }
            }, 'Esposizione');
        },

        async hsl(editor) {
            const r = await askForm({
                title: 'Tonalità/Saturazione', icon: '◑',
                fields: [
                    { name: 'h', label: 'Tonalità', type: 'number', value: 0, min: -180, max: 180 },
                    { name: 's', label: 'Saturazione', type: 'number', value: 0, min: -100, max: 100 },
                    { name: 'l', label: 'Luminosità', type: 'number', value: 0, min: -100, max: 100 },
                ],
            });
            if (!r) return;
            applyFilter(editor, img => {
                const d = img.data;
                for (let i = 0; i < d.length; i += 4) {
                    let [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
                    h = (h + r.h / 360 + 1) % 1;
                    s = Math.max(0, Math.min(1, s + r.s / 100));
                    l = Math.max(0, Math.min(1, l + r.l / 100));
                    const [rr, gg, bb] = hslToRgb(h, s, l);
                    d[i] = rr; d[i + 1] = gg; d[i + 2] = bb;
                }
            }, 'Tonalità/Saturazione');
        },

        async threshold(editor) {
            const r = await askForm({
                title: 'Soglia', icon: '▣',
                fields: [{ name: 't', label: 'Soglia', type: 'number', value: 128, min: 0, max: 255 }],
            });
            if (!r) return;
            applyFilter(editor, img => {
                const d = img.data;
                for (let i = 0; i < d.length; i += 4) {
                    const y = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
                    const v = y >= r.t ? 255 : 0;
                    d[i] = d[i + 1] = d[i + 2] = v;
                }
            }, 'Soglia');
        },

        async vibrance(editor) {
            const r = await askForm({
                title: 'Vividezza', icon: '★',
                fields: [{ name: 'v', label: 'Vividezza', type: 'number', value: 20, min: -100, max: 100 }],
            });
            if (!r) return;
            applyFilter(editor, img => {
                const d = img.data, k = r.v / 100;
                for (let i = 0; i < d.length; i += 4) {
                    const max = Math.max(d[i], d[i + 1], d[i + 2]);
                    const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
                    const amt = ((Math.abs(max - avg) * 2 / 255) * k);
                    for (let c = 0; c < 3; c++) {
                        if (d[i + c] !== max) d[i + c] += (max - d[i + c]) * amt;
                    }
                }
            }, 'Vividezza');
        },

        async balance(editor) {
            const r = await askForm({
                title: 'Bilanciamento colore', icon: '⚖',
                fields: [
                    { name: 'r', label: 'Rosso ↔ Ciano', type: 'number', value: 0, min: -100, max: 100 },
                    { name: 'g', label: 'Verde ↔ Magenta', type: 'number', value: 0, min: -100, max: 100 },
                    { name: 'b', label: 'Blu ↔ Giallo', type: 'number', value: 0, min: -100, max: 100 },
                ],
            });
            if (!r) return;
            applyFilter(editor, img => {
                const d = img.data;
                for (let i = 0; i < d.length; i += 4) {
                    d[i] = clamp(d[i] + r.r);
                    d[i + 1] = clamp(d[i + 1] + r.g);
                    d[i + 2] = clamp(d[i + 2] - r.b);
                }
            }, 'Bilanciamento');
        },

        async gradient(editor) {
            const r = await askForm({
                title: 'Mappa sfumatura', icon: '⊐',
                fields: [
                    { name: 'a', label: 'Colore ombre', type: 'color', value: '#000000' },
                    { name: 'b', label: 'Colore luci', type: 'color', value: '#ffffff' },
                ],
            });
            if (!r) return;
            const a = hexToRgb(r.a), b = hexToRgb(r.b);
            applyFilter(editor, img => {
                const d = img.data;
                for (let i = 0; i < d.length; i += 4) {
                    const y = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
                    d[i] = clamp(a.r + (b.r - a.r) * y);
                    d[i + 1] = clamp(a.g + (b.g - a.g) * y);
                    d[i + 2] = clamp(a.b + (b.b - a.b) * y);
                }
            }, 'Mappa sfumatura');
        },

        selective(editor) {
            window.PSModal.alert('Strumento "Colore selettivo" verrà introdotto in una versione successiva.', 'Non ancora disponibile', '⚠');
        },
    };

    const Img = {
        rotate(editor, angle) {
            const doc = editor.activeDoc;
            if (!doc) return;
            const rad = angle * Math.PI / 180;
            const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
            const nw = Math.round(doc.width * cos + doc.height * sin);
            const nh = Math.round(doc.width * sin + doc.height * cos);
            for (const layer of doc.layers) {
                const c = document.createElement('canvas');
                c.width = nw; c.height = nh;
                const ctx = c.getContext('2d', { willReadFrequently: true });
                ctx.translate(nw / 2, nh / 2);
                ctx.rotate(rad);
                ctx.drawImage(layer.canvas, -layer.width / 2, -layer.height / 2);
                layer.canvas = c;
                layer.ctx = ctx;
                layer.width = nw; layer.height = nh;
            }
            doc.width = nw; doc.height = nh;
            editor._rebuildLayerCanvases();
            editor._renderCheckerboard();
            editor.viewport.applyTransform();
            editor.requestRedraw();
        },
        flip(editor, axis) {
            const doc = editor.activeDoc;
            if (!doc) return;
            for (const layer of doc.layers) {
                const c = document.createElement('canvas');
                c.width = layer.width; c.height = layer.height;
                const ctx = c.getContext('2d', { willReadFrequently: true });
                if (axis === 'h') { ctx.translate(layer.width, 0); ctx.scale(-1, 1); }
                else { ctx.translate(0, layer.height); ctx.scale(1, -1); }
                ctx.drawImage(layer.canvas, 0, 0);
                layer.canvas = c; layer.ctx = ctx;
            }
            editor._rebuildLayerCanvases();
            editor.requestRedraw();
        },
    };

    function clamp(v) { return Math.max(0, Math.min(255, v)); }
    function hexToRgb(h) {
        const x = h.replace('#', '');
        return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16) };
    }
    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h /= 6;
        }
        return [h, s, l];
    }
    function hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) { r = g = b = l; }
        else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    window.PSFilters = Filters;
    window.PSImg = Img;
})();
