/* Editor — orchestrates documents, tools, rendering, input */
(function () {
    class Editor {
        constructor() {
            this.documents = [];
            this.activeDoc = null;
            this.tools = {};
            this.activeTool = null;
            this.fgColor = '#000000';
            this.bgColor = '#ffffff';
            this.brushSize = 30;
            this.brushHardness = 1.0;
            this.brushOpacity = 1.0;
            this.brushFlow = 1.0;
            this.brushSmoothing = 0;
            this.viewport = null;
            this._initialized = false;
        }

        init() {
            if (this._initialized) return;
            this.viewport = new window.PSViewport(this);
            this._bindInput();
            this._bindKeys();
            this._initialized = true;
        }

        createDocument(opts) {
            const doc = new window.PSDocument(opts);
            this.documents.push(doc);
            this.setActiveDocument(doc);
            return doc;
        }

        setActiveDocument(doc) {
            this.activeDoc = doc;
            this._rebuildLayerCanvases();
            this._renderCheckerboard();
            this.viewport.applyTransform();
            this.viewport.fit();
            this.requestRedraw();
            window.PSBus.emit('doc:changed', doc);
            window.PSBus.emit('doc:layers-changed', doc);
        }

        registerTool(id, tool) {
            this.tools[id] = tool;
        }

        setActiveTool(id) {
            const tool = this.tools[id];
            if (!tool) return;
            if (this.activeTool && this.activeTool.onDeactivate) this.activeTool.onDeactivate(this);
            this.activeTool = tool;
            if (tool.onActivate) tool.onActivate(this);
            window.PSBus.emit('tool:changed', id);
        }

        setFgColor(c) { this.fgColor = c; window.PSBus.emit('color:fg', c); }
        setBgColor(c) { this.bgColor = c; window.PSBus.emit('color:bg', c); }
        swapColors() {
            const t = this.fgColor;
            this.fgColor = this.bgColor;
            this.bgColor = t;
            window.PSBus.emit('color:fg', this.fgColor);
            window.PSBus.emit('color:bg', this.bgColor);
        }

        _rebuildLayerCanvases() {
            const container = document.getElementById('layers-container');
            container.innerHTML = '';
            if (!this.activeDoc) return;
            for (const layer of this.activeDoc.layers) {
                layer.canvas.style.width = layer.canvas.width + 'px';
                layer.canvas.style.height = layer.canvas.height + 'px';
                container.appendChild(layer.canvas);
            }
            this._applyLayerStyles();
            // overlay
            const overlay = document.getElementById('overlay-canvas');
            overlay.width = this.activeDoc.width;
            overlay.height = this.activeDoc.height;
            overlay.style.width = this.activeDoc.width + 'px';
            overlay.style.height = this.activeDoc.height + 'px';
            const bg = document.getElementById('bg-checker');
            bg.width = this.activeDoc.width;
            bg.height = this.activeDoc.height;
            bg.style.width = this.activeDoc.width + 'px';
            bg.style.height = this.activeDoc.height + 'px';
        }

        _applyLayerStyles() {
            if (!this.activeDoc) return;
            for (const layer of this.activeDoc.layers) {
                layer.canvas.style.display = layer.visible ? 'block' : 'none';
                layer.canvas.style.opacity = layer.opacity;
                layer.canvas.style.mixBlendMode = layer.blendMode === 'normal' ? 'normal' : layer.blendMode;
                layer.canvas.style.transform = `translate(${layer.x}px, ${layer.y}px)`;
            }
        }

        _renderCheckerboard() {
            const c = document.getElementById('bg-checker');
            const ctx = c.getContext('2d');
            const sz = 10;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, c.width, c.height);
            ctx.fillStyle = '#c8c8c8';
            for (let y = 0; y < c.height; y += sz) {
                for (let x = 0; x < c.width; x += sz) {
                    if (((x / sz) + (y / sz)) % 2 === 0) ctx.fillRect(x, y, sz, sz);
                }
            }
        }

        requestRedraw() {
            if (this._raf) return;
            this._raf = requestAnimationFrame(() => {
                this._raf = null;
                this._applyLayerStyles();
                this._renderOverlay();
                window.PSBus.emit('layers:redraw', this.activeDoc);
            });
        }

        _renderOverlay() {
            const overlay = document.getElementById('overlay-canvas');
            if (!overlay || !this.activeDoc) return;
            const ctx = overlay.getContext('2d');
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            // Selection marching ants
            if (this.activeDoc.selection) {
                const s = this.activeDoc.selection;
                ctx.save();
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w, s.h);
                ctx.setLineDash([5, 5]);
                ctx.lineDashOffset = -3;
                ctx.strokeStyle = '#fff';
                ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w, s.h);
                ctx.restore();
            }
            // Let active tool draw overlay
            if (this.activeTool && this.activeTool.drawOverlay) {
                this.activeTool.drawOverlay(ctx, this);
            }
        }

        _bindInput() {
            const overlay = document.getElementById('overlay-canvas');
            const events = ['pointerdown', 'pointermove', 'pointerup', 'pointerleave'];
            const handler = (e) => {
                if (!this.activeDoc || !this.activeTool) return;
                const pos = this.viewport.screenToDoc(e.clientX, e.clientY);
                pos.event = e;
                pos.shift = e.shiftKey; pos.alt = e.altKey; pos.ctrl = e.ctrlKey || e.metaKey;
                pos.button = e.button;
                const map = {
                    pointerdown: 'onPointerDown',
                    pointermove: 'onPointerMove',
                    pointerup: 'onPointerUp',
                    pointerleave: 'onPointerLeave',
                };
                const m = map[e.type];
                if (m && this.activeTool[m]) {
                    this.activeTool[m](pos, this);
                }
                if (e.type === 'pointerdown') overlay.setPointerCapture(e.pointerId);
                this._updateCoordsTooltip(pos);
            };
            events.forEach(t => overlay.addEventListener(t, handler));

            // Cursor position display
            overlay.addEventListener('pointermove', (e) => {
                const pos = this.viewport.screenToDoc(e.clientX, e.clientY);
                const tt = document.getElementById('sb-tooltip');
                if (tt) tt.textContent = `X: ${Math.round(pos.x)}  Y: ${Math.round(pos.y)}`;
            });
        }

        _updateCoordsTooltip(pos) {}

        _bindKeys() {
            const shortcuts = {
                'v': 'move',
                'm': 'select-rect',
                'l': 'lasso',
                'w': 'magic-wand',
                'c': 'crop',
                'i': 'eyedropper',
                'b': 'brush',
                'n': 'pencil',
                'e': 'eraser',
                'g': 'bucket',
                't': 'text',
                'h': 'hand',
                'z': 'zoom',
            };
            window.addEventListener('keydown', (e) => {
                if (document.activeElement && /input|textarea|select/i.test(document.activeElement.tagName)) return;
                const k = e.key.toLowerCase();
                if ((e.ctrlKey || e.metaKey) && k === 'z' && !e.shiftKey) {
                    e.preventDefault(); this.undo();
                } else if ((e.ctrlKey || e.metaKey) && (k === 'y' || (k === 'z' && e.shiftKey))) {
                    e.preventDefault(); this.redo();
                } else if ((e.ctrlKey || e.metaKey) && k === 's') {
                    e.preventDefault(); window.PSBus.emit('action:save');
                } else if ((e.ctrlKey || e.metaKey) && k === 'o') {
                    e.preventDefault(); window.PSBus.emit('action:open');
                } else if ((e.ctrlKey || e.metaKey) && k === 'n') {
                    e.preventDefault(); window.PSBus.emit('action:new');
                } else if ((e.ctrlKey || e.metaKey) && k === '+') {
                    e.preventDefault(); this.viewport.zoomIn();
                } else if ((e.ctrlKey || e.metaKey) && k === '-') {
                    e.preventDefault(); this.viewport.zoomOut();
                } else if ((e.ctrlKey || e.metaKey) && k === '0') {
                    e.preventDefault(); this.viewport.fit();
                } else if ((e.ctrlKey || e.metaKey) && k === '1') {
                    e.preventDefault(); this.viewport.actual();
                } else if (k === 'd' && !e.ctrlKey && !e.metaKey) {
                    this.fgColor = '#000000'; this.bgColor = '#ffffff';
                    window.PSBus.emit('color:fg', this.fgColor);
                    window.PSBus.emit('color:bg', this.bgColor);
                } else if (k === 'x' && !e.ctrlKey && !e.metaKey) {
                    this.swapColors();
                } else if (k === '[') {
                    this.brushSize = Math.max(1, this.brushSize - 2);
                    window.PSBus.emit('brush:size', this.brushSize);
                } else if (k === ']') {
                    this.brushSize = Math.min(2000, this.brushSize + 2);
                    window.PSBus.emit('brush:size', this.brushSize);
                } else if (shortcuts[k] && !e.ctrlKey && !e.metaKey) {
                    this.setActiveTool(shortcuts[k]);
                } else if ((e.ctrlKey || e.metaKey) && k === 'd' && this.activeDoc) {
                    e.preventDefault();
                    this.activeDoc.clearSelection();
                    this.requestRedraw();
                }
            });
        }

        undo() {
            if (!this.activeDoc) return;
            const action = this.activeDoc.history.undo();
            if (!action) return;
            this._applyHistory(action, true);
            this.requestRedraw();
        }

        redo() {
            if (!this.activeDoc) return;
            const action = this.activeDoc.history.redo();
            if (!action) return;
            this._applyHistory(action, false);
            this.requestRedraw();
        }

        _applyHistory(action, undo) {
            if (action.type === 'layer-paint') {
                const layer = this.activeDoc.layers.find(l => l.id === action.layerId);
                if (layer) layer.restore(undo ? action.before : action.after);
            } else if (action.type === 'layer-add') {
                if (undo) {
                    const idx = this.activeDoc.layers.findIndex(l => l.id === action.layer.id);
                    if (idx >= 0) this.activeDoc.layers.splice(idx, 1);
                } else {
                    this.activeDoc.layers.splice(action.index, 0, action.layer);
                }
                this._rebuildLayerCanvases();
                window.PSBus.emit('doc:layers-changed', this.activeDoc);
            } else if (action.type === 'layer-remove') {
                if (undo) {
                    this.activeDoc.layers.splice(action.index, 0, action.layer);
                } else {
                    const idx = this.activeDoc.layers.findIndex(l => l.id === action.layer.id);
                    if (idx >= 0) this.activeDoc.layers.splice(idx, 1);
                }
                this._rebuildLayerCanvases();
                window.PSBus.emit('doc:layers-changed', this.activeDoc);
            } else if (action.type === 'selection') {
                this.activeDoc.selection = undo ? action.before : action.after;
                window.PSBus.emit('doc:selection-changed', this.activeDoc);
            }
        }

        pushPaintHistory(layer, before, after, label = 'Pittura') {
            if (!this.activeDoc) return;
            this.activeDoc.history.push({
                type: 'layer-paint',
                layerId: layer.id,
                before, after,
                label,
                ts: Date.now(),
            });
        }
    }

    window.PSEditor = Editor;
})();
