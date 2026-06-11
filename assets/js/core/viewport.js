/* Viewport: zoom/pan, rulers, coordinate transforms */
(function () {
    class Viewport {
        constructor(editor) {
            this.editor = editor;
            this.zoom = 1;
            this.panX = 0;
            this.panY = 0;
            this.stage = document.getElementById('document-stage');
            this.scrollEl = document.getElementById('viewport-scroll');
            this.contentEl = document.getElementById('viewport-content');
            this.rulerTop = document.getElementById('ruler-top');
            this.rulerLeft = document.getElementById('ruler-left');
            this._bindWheel();
            this._bindScroll();
            window.PSBus.on('theme:changed', () => this.drawRulers());
        }

        applyTransform() {
            const doc = this.editor.activeDoc;
            if (!doc) return;
            // Inner content kept at native size; layout box matches scaled visual size
            this.stage.style.width = (doc.width * this.zoom) + 'px';
            this.stage.style.height = (doc.height * this.zoom) + 'px';
            // Place a single inner wrapper that we can scale from top-left
            let inner = this.stage.querySelector(':scope > .stage-inner');
            if (!inner) {
                inner = document.createElement('div');
                inner.className = 'stage-inner';
                // move existing children into inner
                while (this.stage.firstChild) inner.appendChild(this.stage.firstChild);
                this.stage.appendChild(inner);
            }
            inner.style.width = doc.width + 'px';
            inner.style.height = doc.height + 'px';
            inner.style.transformOrigin = '0 0';
            inner.style.transform = `scale(${this.zoom})`;
            const sbZ = document.getElementById('sb-zoom-input');
            if (sbZ) sbZ.value = Math.round(this.zoom * 100);
            this.drawRulers();
        }

        setZoom(z, focusX, focusY) {
            const oldZoom = this.zoom;
            this.zoom = Math.max(0.01, Math.min(64, z));
            this.applyTransform();
            window.PSBus.emit('viewport:zoom', this.zoom);
        }

        zoomIn() { this.setZoom(this.zoom * 1.25); }
        zoomOut() { this.setZoom(this.zoom / 1.25); }
        fit() {
            const doc = this.editor.activeDoc;
            if (!doc) return;
            const r = this.scrollEl.getBoundingClientRect();
            const z = Math.min((r.width - 60) / doc.width, (r.height - 60) / doc.height);
            this.setZoom(z);
        }
        actual() { this.setZoom(1); }

        // screen → document pixel coords (account for zoom)
        screenToDoc(clientX, clientY) {
            const rect = this.stage.getBoundingClientRect();
            return {
                x: (clientX - rect.left) / this.zoom,
                y: (clientY - rect.top) / this.zoom,
            };
        }

        _bindWheel() {
            this.scrollEl.addEventListener('wheel', (e) => {
                if (e.ctrlKey || e.metaKey || e.altKey) {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? 1 / 1.15 : 1.15;
                    this.setZoom(this.zoom * delta);
                }
            }, { passive: false });
        }

        _bindScroll() {
            this.scrollEl.addEventListener('scroll', () => this.drawRulers());
        }

        drawRulers() {
            const doc = this.editor.activeDoc;
            if (!doc) return;
            const dpr = window.devicePixelRatio || 1;
            const styleTop = getComputedStyle(this.rulerTop);
            const stageRect = this.stage.getBoundingClientRect();
            const scrollRect = this.scrollEl.getBoundingClientRect();

            // Top ruler
            const rtW = this.rulerTop.clientWidth;
            const rtH = 20;
            this.rulerTop.width = rtW * dpr;
            this.rulerTop.height = rtH * dpr;
            const tctx = this.rulerTop.getContext('2d');
            tctx.scale(dpr, dpr);
            const css = getComputedStyle(document.documentElement);
            const bg = css.getPropertyValue('--ruler-bg').trim() || '#2b2b2b';
            const fg = css.getPropertyValue('--ruler-fg').trim() || '#b0b0b0';
            const tick = css.getPropertyValue('--ruler-tick').trim() || '#606060';
            tctx.fillStyle = bg;
            tctx.fillRect(0, 0, rtW, rtH);
            tctx.strokeStyle = tick;
            tctx.fillStyle = fg;
            tctx.font = '9px "Adobe Clean", sans-serif';
            // origin of doc relative to ruler
            const originX = stageRect.left - scrollRect.left;
            const step = this._rulerStep();
            const pxStep = step * this.zoom;
            const startDoc = -originX / this.zoom;
            const startUnit = Math.floor(startDoc / step) * step;
            tctx.beginPath();
            for (let u = startUnit; u * this.zoom + originX < rtW; u += step) {
                const x = u * this.zoom + originX;
                tctx.moveTo(x + 0.5, rtH);
                tctx.lineTo(x + 0.5, rtH - 8);
                tctx.fillText(String(Math.round(u)), x + 2, 9);
                // minor ticks
                for (let m = 1; m < 5; m++) {
                    const mx = x + (pxStep * m / 5);
                    if (mx >= 0 && mx < rtW) {
                        tctx.moveTo(mx + 0.5, rtH);
                        tctx.lineTo(mx + 0.5, rtH - 3);
                    }
                }
            }
            tctx.stroke();

            // Left ruler
            const rlW = 20;
            const rlH = this.rulerLeft.clientHeight;
            this.rulerLeft.width = rlW * dpr;
            this.rulerLeft.height = rlH * dpr;
            const lctx = this.rulerLeft.getContext('2d');
            lctx.scale(dpr, dpr);
            lctx.fillStyle = bg;
            lctx.fillRect(0, 0, rlW, rlH);
            lctx.strokeStyle = tick;
            lctx.fillStyle = fg;
            lctx.font = '9px "Adobe Clean", sans-serif';
            const originY = stageRect.top - scrollRect.top;
            const startDocY = -originY / this.zoom;
            const startUnitY = Math.floor(startDocY / step) * step;
            lctx.beginPath();
            for (let u = startUnitY; u * this.zoom + originY < rlH; u += step) {
                const y = u * this.zoom + originY;
                lctx.moveTo(rlW, y + 0.5);
                lctx.lineTo(rlW - 8, y + 0.5);
                lctx.save();
                lctx.translate(8, y + 2);
                lctx.rotate(-Math.PI / 2);
                lctx.fillText(String(Math.round(u)), 0, 0);
                lctx.restore();
                for (let m = 1; m < 5; m++) {
                    const my = y + (step * this.zoom * m / 5);
                    if (my >= 0 && my < rlH) {
                        lctx.moveTo(rlW, my + 0.5);
                        lctx.lineTo(rlW - 3, my + 0.5);
                    }
                }
            }
            lctx.stroke();
        }

        _rulerStep() {
            const z = this.zoom;
            if (z >= 8) return 10;
            if (z >= 4) return 25;
            if (z >= 2) return 50;
            if (z >= 1) return 100;
            if (z >= 0.5) return 200;
            if (z >= 0.25) return 500;
            return 1000;
        }
    }

    window.PSViewport = Viewport;
})();
