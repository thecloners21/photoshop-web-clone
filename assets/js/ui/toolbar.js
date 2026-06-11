/* Tools panel UI: list of tools (with flyout groups) */
(function () {
    const ICON = (path, attrs = '') => `<svg viewBox="0 0 24 24" ${attrs}>${path}</svg>`;

    const TOOLS = [
        { id: 'move', name: 'Sposta', shortcut: 'V',
            icon: ICON('<path fill="currentColor" d="M12 2l4 4h-3v5h5V8l4 4-4 4v-3h-5v5h3l-4 4-4-4h3v-5H6v3l-4-4 4-4v3h5V6H8l4-4z"/>')
        },
        { group: 'select', shortcut: 'M', members: [
            { id: 'select-rect', name: 'Selezione rettangolare', shortcut: 'M',
              icon: ICON('<path stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 2" fill="none" d="M3 5h18v14H3z"/>') },
            { id: 'select-ellipse', name: 'Selezione ellittica', shortcut: 'M',
              icon: ICON('<ellipse cx="12" cy="12" rx="9" ry="6" stroke="currentColor" stroke-width="1.6" fill="none" stroke-dasharray="3 2"/>') }
        ]},
        { id: 'lasso', name: 'Lazo', shortcut: 'L',
          icon: ICON('<path fill="none" stroke="currentColor" stroke-width="1.6" d="M5 5c4-2 10-2 13 1s2 9-2 11-12-1-12-7c0-4 5-7 9-5"/>')
        },
        { id: 'magic-wand', name: 'Bacchetta magica', shortcut: 'W',
          icon: ICON('<path fill="currentColor" d="M14 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zm-7 9l-5 9 9-5L7 12z"/>')
        },
        { id: 'crop', name: 'Ritaglia', shortcut: 'C',
          icon: ICON('<path fill="currentColor" d="M7 1v4H3v2h4v12h12v4h2v-4h2v-2H9V7h12V5H7V1H5v4H1v2h6V1H7z"/>')
        },
        { id: 'eyedropper', name: 'Contagocce', shortcut: 'I',
          icon: ICON('<path fill="currentColor" d="M16.5 3a3.5 3.5 0 0 1 2.5 6L17 11l1 1-2 2-1-1-7.5 7.5c-.5.5-1.2.5-1.5 0L4 18c-.3-.3-.3-1 .3-1.5L12 9l-1-1 2-2 1 1 2-2.4A3.5 3.5 0 0 1 16.5 3z"/>')
        },
        { group: 'brush', shortcut: 'B', members: [
            { id: 'brush', name: 'Pennello', shortcut: 'B',
              icon: ICON('<path fill="currentColor" d="M20 3c-1 0-2 .5-3 1.5l-9 9-2 5 5-2 9-9c1-1 1.5-2 1.5-3S21 3 20 3zM4 17c-1 1-1 3 0 4s3 1 4 0l3-3-4-4-3 3z"/>') },
            { id: 'pencil', name: 'Matita', shortcut: 'B',
              icon: ICON('<path fill="currentColor" d="M3 17l11-11 4 4L7 21H3v-4zm15-12l2-2 2 2-2 2-2-2z"/>') }
        ]},
        { id: 'eraser', name: 'Gomma', shortcut: 'E',
          icon: ICON('<path fill="currentColor" d="M16 3l5 5-10 10H6l-3-3 10-10 3-2zm-3 14h8v2h-10l-2-2 4 0z"/>')
        },
        { id: 'bucket', name: 'Secchiello', shortcut: 'G',
          icon: ICON('<path fill="currentColor" d="M5 3l8 8-6 6c-1 1-1 3 0 4l3 0 6-6 4-4-8-8H5zm14 12c-1 2-1 4 0 5s3-1 3-3-3-2-3-2z"/>')
        },
        { id: 'text', name: 'Testo orizzontale', shortcut: 'T',
          icon: ICON('<path fill="currentColor" d="M5 4h14v3h-5v13h-4V7H5V4z"/>')
        },
        { id: 'hand', name: 'Mano', shortcut: 'H',
          icon: ICON('<path fill="currentColor" d="M5 11V6a2 2 0 1 1 4 0v4h1V4a2 2 0 1 1 4 0v6h1V5a2 2 0 1 1 4 0v8c0 4-3 8-7 8s-7-3-7-7v-3z"/>')
        },
        { id: 'zoom', name: 'Zoom', shortcut: 'Z',
          icon: ICON('<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" fill="none"/><path stroke="currentColor" stroke-width="2" d="M16 16l5 5M8 11h6M11 8v6"/>')
        },
    ];

    function buildToolbar(editor) {
        const list = document.getElementById('tools-list');
        list.innerHTML = '';
        const groupActive = {}; // group -> active member id

        TOOLS.forEach(entry => {
            if (entry.group) {
                groupActive[entry.group] = entry.members[0].id;
                const btn = createToolBtn(entry.members[0]);
                btn.dataset.group = entry.group;
                const arrow = document.createElement('div'); arrow.className = 'tool-arrow';
                btn.appendChild(arrow);

                let flyoutTimer;
                btn.addEventListener('mousedown', (e) => {
                    flyoutTimer = setTimeout(() => showFlyout(btn, entry), 350);
                });
                btn.addEventListener('mouseup', () => clearTimeout(flyoutTimer));
                btn.addEventListener('mouseleave', () => clearTimeout(flyoutTimer));

                // Right click also shows flyout
                btn.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    showFlyout(btn, entry);
                });

                list.appendChild(btn);
            } else {
                const btn = createToolBtn(entry);
                list.appendChild(btn);
            }
        });

        function createToolBtn(t) {
            const btn = document.createElement('button');
            btn.className = 'tool-btn';
            btn.dataset.toolId = t.id;
            btn.innerHTML = t.icon;
            btn.title = `${t.name} (${t.shortcut})`;
            btn.addEventListener('click', (e) => {
                if (e.button !== 0) return;
                editor.setActiveTool(t.id);
            });
            return btn;
        }

        function showFlyout(parentBtn, group) {
            document.querySelectorAll('.tool-flyout').forEach(el => el.remove());
            const fl = document.createElement('div');
            fl.className = 'tool-flyout';
            group.members.forEach(m => {
                const row = document.createElement('div');
                row.className = 'tool-flyout-row';
                row.innerHTML = `<span style="width:18px">${m.icon}</span> ${m.name} <span class="key">${m.shortcut}</span>`;
                row.addEventListener('click', () => {
                    parentBtn.innerHTML = m.icon;
                    const arrow = document.createElement('div'); arrow.className = 'tool-arrow';
                    parentBtn.appendChild(arrow);
                    parentBtn.dataset.toolId = m.id;
                    parentBtn.title = `${m.name} (${m.shortcut})`;
                    groupActive[group.group] = m.id;
                    editor.setActiveTool(m.id);
                    fl.remove();
                });
                fl.appendChild(row);
            });
            const r = parentBtn.getBoundingClientRect();
            fl.style.left = r.right + 'px';
            fl.style.top = r.top + 'px';
            document.body.appendChild(fl);
            const off = (e) => {
                if (!fl.contains(e.target)) { fl.remove(); document.removeEventListener('mousedown', off); }
            };
            setTimeout(() => document.addEventListener('mousedown', off), 50);
        }

        window.PSBus.on('tool:changed', (id) => {
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.toggle('active', b.dataset.toolId === id));
        });

        // Color swatches in tools footer
        const fg = document.getElementById('fg-color-swatch');
        const bg = document.getElementById('bg-color-swatch');
        fg.style.background = editor.fgColor;
        bg.style.background = editor.bgColor;
        const pick = (cb) => {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = '#000000';
            input.style.position = 'fixed'; input.style.opacity = '0';
            document.body.appendChild(input);
            input.addEventListener('input', () => cb(input.value));
            input.addEventListener('change', () => input.remove());
            input.click();
        };
        fg.addEventListener('click', () => pick(c => editor.setFgColor(c)));
        bg.addEventListener('click', () => pick(c => editor.setBgColor(c)));
        document.getElementById('btn-swap-colors').addEventListener('click', () => editor.swapColors());
        document.getElementById('btn-default-colors').addEventListener('click', () => {
            editor.setFgColor('#000000');
            editor.setBgColor('#ffffff');
        });
        window.PSBus.on('color:fg', c => fg.style.background = c);
        window.PSBus.on('color:bg', c => bg.style.background = c);
    }

    window.PSUI.buildToolbar = buildToolbar;
})();
