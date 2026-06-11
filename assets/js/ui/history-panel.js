/* History panel */
(function () {
    function buildHistoryPanel(editor) {
        const root = document.getElementById('panel-history');
        root.innerHTML = `<div class="history-list" id="history-list"></div>`;
        const list = root.querySelector('#history-list');
        function refresh() {
            const doc = editor.activeDoc;
            list.innerHTML = '';
            if (!doc) return;
            const states = doc.history.states;
            const cursor = doc.history.cursor;
            const snap = document.createElement('div');
            snap.className = 'history-row current';
            snap.innerHTML = '<span class="history-icon">📷</span> Istantanea documento';
            list.appendChild(snap);
            states.forEach((s, idx) => {
                const row = document.createElement('div');
                row.className = 'history-row' + (idx === cursor ? ' current' : '') + (idx > cursor ? ' future' : '');
                row.innerHTML = `<span class="history-icon">●</span> ${s.label || s.type}`;
                row.addEventListener('click', () => {
                    while (doc.history.cursor < idx) editor.redo();
                    while (doc.history.cursor > idx) editor.undo();
                });
                list.appendChild(row);
            });
        }
        window.PSBus.on('history:changed', refresh);
        window.PSBus.on('doc:changed', refresh);
        refresh();
    }
    window.PSUI.buildHistoryPanel = buildHistoryPanel;
})();
