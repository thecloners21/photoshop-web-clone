/* Options bar — contextual to active tool */
(function () {
    function buildOptionsBar(editor) {
        const ob = document.getElementById('options-bar');
        function render(toolId) {
            const tool = editor.tools[toolId];
            if (!tool) { ob.innerHTML = ''; return; }
            ob.innerHTML = `<div class="ob-tool-preview">${tool.icon || ''}</div>`;
            const slot = document.createElement('div');
            slot.style.display = 'flex'; slot.style.alignItems = 'center'; slot.style.gap = '6px';
            slot.style.flex = '1';
            ob.appendChild(slot);
            if (tool.renderOptions) tool.renderOptions(slot, editor);
        }
        window.PSBus.on('tool:changed', render);
        if (editor.activeTool) render(editor.activeTool.id);
    }
    window.PSUI.buildOptionsBar = buildOptionsBar;
})();
