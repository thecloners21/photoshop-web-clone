/* Layer class — represents a single bitmap layer with its own canvas */
(function () {
    let nextId = 1;

    const BLEND_MODES = [
        'normal','multiply','screen','overlay','darken','lighten',
        'color-dodge','color-burn','hard-light','soft-light',
        'difference','exclusion','hue','saturation','color','luminosity'
    ];

    class Layer {
        constructor(opts = {}) {
            this.id = opts.id || ('layer-' + (nextId++));
            this.name = opts.name || 'Livello ' + nextId;
            this.width = opts.width || 800;
            this.height = opts.height || 600;
            this.visible = opts.visible !== false;
            this.opacity = opts.opacity != null ? opts.opacity : 1;
            this.blendMode = opts.blendMode || 'normal';
            this.locked = !!opts.locked;
            this.lockTransparency = !!opts.lockTransparency;
            this.x = opts.x || 0;
            this.y = opts.y || 0;
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
            if (opts.fill) {
                this.ctx.fillStyle = opts.fill;
                this.ctx.fillRect(0, 0, this.width, this.height);
            }
        }

        snapshot() {
            return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        }

        restore(imageData) {
            this.ctx.putImageData(imageData, 0, 0);
        }

        resize(w, h, anchor = 'top-left') {
            const old = this.canvas;
            const newCanvas = document.createElement('canvas');
            newCanvas.width = w;
            newCanvas.height = h;
            const nctx = newCanvas.getContext('2d', { willReadFrequently: true });
            let dx = 0, dy = 0;
            if (anchor === 'center') { dx = (w - old.width) / 2; dy = (h - old.height) / 2; }
            nctx.drawImage(old, dx, dy);
            this.canvas = newCanvas;
            this.ctx = nctx;
            this.width = w;
            this.height = h;
        }

        clone() {
            const l = new Layer({
                name: this.name + ' copia',
                width: this.width, height: this.height,
                opacity: this.opacity, blendMode: this.blendMode,
                visible: this.visible, x: this.x, y: this.y
            });
            l.ctx.drawImage(this.canvas, 0, 0);
            return l;
        }

        toDataURL(type = 'image/png') { return this.canvas.toDataURL(type); }

        renderThumb(targetCanvas) {
            const tctx = targetCanvas.getContext('2d');
            tctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
            const scale = Math.min(targetCanvas.width / this.width, targetCanvas.height / this.height);
            const w = this.width * scale, h = this.height * scale;
            tctx.drawImage(this.canvas, (targetCanvas.width - w) / 2, (targetCanvas.height - h) / 2, w, h);
        }
    }

    window.PSLayer = Layer;
    window.PS_BLEND_MODES = BLEND_MODES;
})();
