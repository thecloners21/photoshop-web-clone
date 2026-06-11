/* Base Tool */
(function () {
    class Tool {
        constructor(opts = {}) {
            this.id = opts.id;
            this.name = opts.name || opts.id;
            this.cursor = opts.cursor || 'crosshair';
            this.icon = opts.icon || '';
            this.shortcut = opts.shortcut || '';
            this.group = opts.group || null;
            this.options = opts.options || {};
        }
        onActivate(editor) {
            const overlay = document.getElementById('overlay-canvas');
            if (overlay) overlay.style.cursor = this.cursor;
        }
        onDeactivate(editor) {}
        onPointerDown(p, editor) {}
        onPointerMove(p, editor) {}
        onPointerUp(p, editor) {}
        onPointerLeave(p, editor) {}
        drawOverlay(ctx, editor) {}
        renderOptions(container, editor) {}
    }
    window.PSTool = Tool;
})();
