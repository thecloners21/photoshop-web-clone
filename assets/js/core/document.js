/* Document — collection of layers + selection + metadata */
(function () {
    let nextDocId = 1;

    class PSDocument {
        constructor(opts = {}) {
            this.id = 'doc-' + (nextDocId++);
            this.name = opts.name || 'Senza titolo-' + nextDocId;
            this.width = opts.width || 800;
            this.height = opts.height || 600;
            this.resolution = opts.resolution || 72;
            this.colorMode = opts.colorMode || 'RGB/8';
            this.layers = [];
            this.activeLayerIndex = -1;
            this.selection = null; // {x,y,w,h,mask?} pixel-mask selection
            this.dirty = false;
            this.history = new window.PSHistory();

            if (!opts.skipDefault) {
                const bg = new window.PSLayer({
                    name: 'Sfondo',
                    width: this.width,
                    height: this.height,
                    fill: opts.bg === 'transparent' ? null : (opts.bg === 'black' ? '#000' : '#fff'),
                });
                // Background is editable by default for a smooth demo UX
                // (Photoshop locks it, but users expect to paint immediately).
                bg.locked = false;
                this.addLayer(bg);
            }
        }

        addLayer(layer, index = null) {
            if (index == null) index = this.layers.length;
            this.layers.splice(index, 0, layer);
            this.activeLayerIndex = index;
            this.dirty = true;
            window.PSBus.emit('doc:layers-changed', this);
        }

        removeLayer(idx) {
            if (idx < 0 || idx >= this.layers.length) return;
            this.layers.splice(idx, 1);
            if (this.activeLayerIndex >= this.layers.length) this.activeLayerIndex = this.layers.length - 1;
            this.dirty = true;
            window.PSBus.emit('doc:layers-changed', this);
        }

        moveLayer(from, to) {
            if (from === to) return;
            const [l] = this.layers.splice(from, 1);
            this.layers.splice(to, 0, l);
            this.activeLayerIndex = to;
            window.PSBus.emit('doc:layers-changed', this);
        }

        getActiveLayer() {
            return this.layers[this.activeLayerIndex] || null;
        }

        setActiveLayer(idx) {
            if (idx < 0 || idx >= this.layers.length) return;
            this.activeLayerIndex = idx;
            window.PSBus.emit('doc:active-layer', this);
        }

        flatten() {
            const out = document.createElement('canvas');
            out.width = this.width;
            out.height = this.height;
            const ctx = out.getContext('2d');
            for (const layer of this.layers) {
                if (!layer.visible) continue;
                ctx.save();
                ctx.globalAlpha = layer.opacity;
                ctx.globalCompositeOperation = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode;
                ctx.drawImage(layer.canvas, layer.x, layer.y);
                ctx.restore();
            }
            return out;
        }

        setSelection(sel) {
            this.selection = sel;
            window.PSBus.emit('doc:selection-changed', this);
        }

        clearSelection() {
            this.selection = null;
            window.PSBus.emit('doc:selection-changed', this);
        }

        sizeBytes() { return this.width * this.height * 4 * Math.max(1, this.layers.length); }
        sizeMB() { return (this.sizeBytes() / (1024 * 1024)).toFixed(2); }
    }

    window.PSDocument = PSDocument;
})();
