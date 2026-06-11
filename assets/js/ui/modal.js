/* Reusable elegant modal system — replaces prompt()/alert() */
(function () {
    function open(opts) {
        const ov = document.createElement('div');
        ov.className = 'dialog-overlay';
        const dlg = document.createElement('div');
        dlg.className = 'dialog ps-modal';
        if (opts.size === 'sm') dlg.style.minWidth = '360px';
        if (opts.size === 'lg') dlg.style.minWidth = '620px';

        const head = document.createElement('div');
        head.className = 'dialog-header';
        head.innerHTML = `
            <span class="ps-modal-icon">${opts.icon || ''}</span>
            <span class="ps-modal-title">${opts.title || ''}</span>
            <span class="ps-modal-spacer"></span>
            <button class="dialog-close" title="Chiudi">×</button>
        `;
        const body = document.createElement('div');
        body.className = 'dialog-body';
        if (typeof opts.body === 'string') body.innerHTML = opts.body;
        else if (opts.body instanceof Node) body.appendChild(opts.body);

        const foot = document.createElement('div');
        foot.className = 'dialog-footer';
        const buttons = opts.buttons || [
            { label: 'Annulla', kind: 'secondary', value: false },
            { label: opts.okLabel || 'OK', kind: 'primary', value: true, default: true },
        ];

        let resolved = false;
        let resolver;
        const promise = new Promise(r => resolver = r);
        const close = (val) => {
            if (resolved) return;
            resolved = true;
            ov.classList.add('closing');
            setTimeout(() => ov.remove(), 140);
            resolver(val);
        };

        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.className = b.kind === 'primary' ? 'btn-primary' : 'btn-secondary';
            btn.textContent = b.label;
            if (b.default) btn.dataset.default = '1';
            btn.addEventListener('click', () => {
                if (b.onClick) {
                    const r = b.onClick(body, dlg);
                    if (r === false) return;
                    close(r != null ? r : b.value);
                } else close(b.value);
            });
            foot.appendChild(btn);
        });

        head.querySelector('.dialog-close').addEventListener('click', () => close(null));
        dlg.appendChild(head);
        dlg.appendChild(body);
        dlg.appendChild(foot);
        ov.appendChild(dlg);
        document.body.appendChild(ov);

        // Keyboard
        const onKey = (e) => {
            if (e.key === 'Escape') { close(null); document.removeEventListener('keydown', onKey); }
            else if (e.key === 'Enter') {
                const def = foot.querySelector('[data-default="1"]');
                if (def) def.click();
            }
        };
        document.addEventListener('keydown', onKey);

        // Animate in
        requestAnimationFrame(() => ov.classList.add('open'));
        const focusable = body.querySelector('input,select,textarea,button');
        if (focusable) focusable.focus();

        return promise;
    }

    function alertBox(message, title = 'Avviso', icon = 'ℹ') {
        return open({
            title, icon, size: 'sm',
            body: `<div class="ps-modal-msg">${message.replace(/\n/g, '<br>')}</div>`,
            buttons: [{ label: 'OK', kind: 'primary', value: true, default: true }],
        });
    }

    function confirmBox(message, title = 'Conferma') {
        return open({
            title, icon: '?', size: 'sm',
            body: `<div class="ps-modal-msg">${message.replace(/\n/g, '<br>')}</div>`,
            buttons: [
                { label: 'Annulla', kind: 'secondary', value: false },
                { label: 'Conferma', kind: 'primary', value: true, default: true },
            ],
        });
    }

    function promptText(label, defaultValue = '', opts = {}) {
        const body = document.createElement('div');
        body.innerHTML = `
            <div class="form-row">
                <label>${label}</label>
                <input type="text" id="ps-prompt-input" value="${(defaultValue + '').replace(/"/g, '&quot;')}">
            </div>
        `;
        return open({
            title: opts.title || 'Inserisci valore',
            icon: opts.icon || '✎',
            size: 'sm',
            body,
            buttons: [
                { label: 'Annulla', kind: 'secondary', value: null },
                { label: 'OK', kind: 'primary', default: true,
                  onClick: (b) => b.querySelector('#ps-prompt-input').value }
            ],
        });
    }

    function promptNumber(label, defaultValue = 0, opts = {}) {
        const min = opts.min != null ? opts.min : -1e6;
        const max = opts.max != null ? opts.max : 1e6;
        const step = opts.step || 1;
        const body = document.createElement('div');
        body.innerHTML = `
            <div class="form-row">
                <label>${label}</label>
                <div class="ps-slider-row">
                    <input type="range" id="ps-num-range" min="${min}" max="${max}" step="${step}" value="${defaultValue}">
                    <input type="number" id="ps-num-val" min="${min}" max="${max}" step="${step}" value="${defaultValue}">
                </div>
            </div>
        `;
        const range = body.querySelector('#ps-num-range');
        const num = body.querySelector('#ps-num-val');
        range.addEventListener('input', () => num.value = range.value);
        num.addEventListener('input', () => range.value = num.value);
        return open({
            title: opts.title || 'Inserisci valore',
            icon: opts.icon || '#',
            size: 'sm',
            body,
            buttons: [
                { label: 'Annulla', kind: 'secondary', value: null },
                { label: 'OK', kind: 'primary', default: true,
                  onClick: () => parseFloat(num.value) }
            ],
        });
    }

    /**
     * promptForm — multiple numeric/text fields in one elegant modal
     * fields: [{name, label, type:'number'|'text', value, min, max, step}]
     */
    function promptForm(opts) {
        const fields = opts.fields || [];
        const body = document.createElement('div');
        fields.forEach(f => {
            const row = document.createElement('div');
            row.className = 'form-row';
            if (f.type === 'number') {
                row.innerHTML = `
                    <label>${f.label}</label>
                    <div class="ps-slider-row">
                        <input type="range" data-name="${f.name}" data-kind="range" min="${f.min ?? -100}" max="${f.max ?? 100}" step="${f.step ?? 1}" value="${f.value ?? 0}">
                        <input type="number" data-name="${f.name}" data-kind="num" min="${f.min ?? -100}" max="${f.max ?? 100}" step="${f.step ?? 1}" value="${f.value ?? 0}">
                    </div>
                `;
            } else if (f.type === 'color') {
                row.innerHTML = `
                    <label>${f.label}</label>
                    <input type="color" data-name="${f.name}" value="${f.value || '#000000'}">
                `;
            } else if (f.type === 'select') {
                row.innerHTML = `
                    <label>${f.label}</label>
                    <select data-name="${f.name}">
                        ${f.options.map(o => `<option value="${o.value}" ${o.value === f.value ? 'selected' : ''}>${o.label}</option>`).join('')}
                    </select>
                `;
            } else if (f.type === 'textarea') {
                row.innerHTML = `
                    <label>${f.label}</label>
                    <textarea data-name="${f.name}" rows="4">${(f.value || '').replace(/</g, '&lt;')}</textarea>
                `;
            } else {
                row.innerHTML = `
                    <label>${f.label}</label>
                    <input type="text" data-name="${f.name}" value="${(f.value || '').replace(/"/g, '&quot;')}">
                `;
            }
            body.appendChild(row);
        });
        // sync sliders
        body.querySelectorAll('[data-kind="range"]').forEach(r => {
            const partner = body.querySelector(`[data-name="${r.dataset.name}"][data-kind="num"]`);
            r.addEventListener('input', () => partner.value = r.value);
            partner.addEventListener('input', () => r.value = partner.value);
        });
        return open({
            title: opts.title || 'Parametri',
            icon: opts.icon || '⚙',
            size: opts.size || 'sm',
            body,
            buttons: [
                { label: 'Annulla', kind: 'secondary', value: null },
                { label: opts.okLabel || 'OK', kind: 'primary', default: true,
                  onClick: (b) => {
                      const out = {};
                      fields.forEach(f => {
                          const el = b.querySelector(`[data-name="${f.name}"]${f.type === 'number' ? '[data-kind="num"]' : ''}`);
                          if (!el) return;
                          out[f.name] = f.type === 'number' ? parseFloat(el.value) : el.value;
                      });
                      return out;
                  } }
            ],
        });
    }

    window.PSModal = { open, alert: alertBox, confirm: confirmBox, promptText, promptNumber, promptForm };
})();
