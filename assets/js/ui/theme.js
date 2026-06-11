/* Theme toggle (dark/light) */
(function () {
    function init() {
        const btn = document.getElementById('btn-toggle-theme');
        const saved = localStorage.getItem('ps-theme');
        if (saved) document.documentElement.setAttribute('data-theme', saved);
        btn.addEventListener('click', () => {
            const cur = document.documentElement.getAttribute('data-theme');
            const next = cur === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('ps-theme', next);
            window.PSBus.emit('theme:changed', next);
        });
    }
    window.PSUI.initTheme = init;
})();
