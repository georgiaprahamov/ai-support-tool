let currentChatId = null;
        let isWaiting = false;
        let reasoningOn = false;
        let webOn = false;

        const chatEl = document.getElementById('chat');
        const inputEl = document.getElementById('input');
        const sendBtn = document.getElementById('btn-send');

        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('open');
            document.getElementById('overlay').classList.toggle('show');
        }

        function toggleReasoning() {
            reasoningOn = !reasoningOn;
            document.getElementById('reasoning-btn').classList.toggle('active', reasoningOn);
        }

        function toggleWeb() {
            webOn = !webOn;
            document.getElementById('web-btn').classList.toggle('active', webOn);
        }

        function resize(el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 150) + 'px';
        }

        function onKey(e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
        }

        function ask(btn) {
            const t = btn.innerText.replace(/^[^\s]+\s/, '');
            inputEl.value = t;
            resize(inputEl);
            send();
        }

        function esc(s) {
            return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        function scrollDown() {
            requestAnimationFrame(() => { chatEl.scrollTop = chatEl.scrollHeight; });
        }

        // ===== Improved Markdown Parser =====
        function md(raw) {
            // 1) Extract code blocks BEFORE escaping HTML
            const codeBlocks = [];
            let text = raw.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
                const idx = codeBlocks.length;
                const langLabel = lang || 'code';
                codeBlocks.push(
                    `<pre><div class="code-header"><span>${esc(langLabel)}</span><button class="btn-copy" onclick="copyCode(this)">Копирай</button></div><code>${esc(code.trimEnd())}</code></pre>`
                );
                return `%%CODEBLOCK_${idx}%%`;
            });

            // 2) Now escape the rest
            let h = esc(text);

            // 3) Tables
            h = h.replace(/((?:^\|.+\|$\n?)+)/gm, (block) => {
                const rows = block.trim().split('\n').filter(r => r.trim());
                if (rows.length < 2) return block;
                if (!/^\|?[-:|]+(\|[-:|]+)+\|?$/.test(rows[1].replace(/\s/g, ''))) return block;
                const p = r => r.split('|').slice(1, -1).map(c => c.trim());
                let t = '<div class="md-table-wrap"><table><thead><tr>';
                p(rows[0]).forEach(c => t += `<th>${c}</th>`);
                t += '</tr></thead><tbody>';
                for (let i = 2; i < rows.length; i++) {
                    t += '<tr>';
                    p(rows[i]).forEach(c => t += `<td>${c}</td>`);
                    t += '</tr>';
                }
                return t + '</tbody></table></div>';
            });

            // 4) Headers
            h = h.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
            h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
            h = h.replace(/^## (.+)$/gm, '<h2>$1</h2>');
            h = h.replace(/^# (.+)$/gm, '<h1>$1</h1>');

            // 5) Horizontal rules
            h = h.replace(/^---$/gm, '<hr>');

            // 6) Blockquotes
            h = h.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

            // 7) Unordered lists
            h = h.replace(/^- (.+)$/gm, '<li>$1</li>');
            h = h.replace(/((?:<li>.*<\/li>\n?)+)/g, (match) => {
                // Check if preceded by an <ol> context — if not, wrap in <ul>
                return '<ul>' + match + '</ul>';
            });

            // 8) Ordered lists (1. 2. 3.)
            h = h.replace(/^(\d+)\. (.+)$/gm, '<oli>$2</oli>');
            h = h.replace(/((?:<oli>.*<\/oli>\n?)+)/g, (match) => {
                return '<ol>' + match.replace(/<oli>/g, '<li>').replace(/<\/oli>/g, '</li>') + '</ol>';
            });

            // 9) Inline code (but NOT inside pre blocks)
            h = h.replace(/`([^`\n]+)`/g, '<code>$1</code>');

            // 10) Bold and italic
            h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');

            // 11) Paragraphs
            h = h.split(/\n\n+/).map(b => {
                b = b.trim();
                if (!b) return '';
                if (/^<(h[1-4]|pre|ul|ol|table|div|blockquote|hr)/.test(b)) return b;
                if (/^%%CODEBLOCK_\d+%%$/.test(b)) return b;
                return `<p>${b.replace(/\n/g, '<br>')}</p>`;
            }).join('');

            // 12) Restore code blocks
            codeBlocks.forEach((block, i) => {
                h = h.replace(`%%CODEBLOCK_${i}%%`, block);
                // Also handle if wrapped in <p>
                h = h.replace(`<p>%%CODEBLOCK_${i}%%</p>`, block);
            });

            return h;
        }

        // Copy code to clipboard
        function copyCode(btn) {
            const code = btn.closest('pre').querySelector('code').textContent;
            navigator.clipboard.writeText(code).then(() => {
                btn.textContent = '✓ Копирано';
                setTimeout(() => btn.textContent = 'Копирай', 2000);
            });
        }

        // ===== Render math with KaTeX =====
        function renderMath(element) {
            if (typeof renderMathInElement !== 'undefined') {
                renderMathInElement(element, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '\\[', right: '\\]', display: true },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '$', right: '$', display: false }
                    ],
                    throwOnError: false,
                    output: 'html'
                });
            }
        }

        // Reasoning parser
        function parseThink(text) {
            const re = /<think>([\s\S]*?)<\/think>/g;
            const parts = [];
            let m;
            while ((m = re.exec(text)) !== null) parts.push(m[1].trim());
            const answer = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            return { thinking: parts.join('\n\n'), answer };
        }

        function hideWelcome() {
            const w = document.getElementById('welcome');
            if (w) w.style.display = 'none';
        }

        function showWelcome() {
            chatEl.innerHTML = `
                <div class="welcome" id="welcome">
                    <div class="welcome-logo">⚡</div>
                    <h2>С какво мога да помогна?</h2>
                    <p>Пиша код, дебъгвам грешки и обяснявам алгоритми на Python, JavaScript, C++, SQL и други езици.</p>
                    <div class="chips">
                        <button class="chip" onclick="ask(this)">🐍 Сортиране на масив в Python</button>
                        <button class="chip" onclick="ask(this)">🔧 Дебъгване на segmentation fault</button>
                        <button class="chip" onclick="ask(this)">📚 Обясни рекурсията с пример</button>
                        <button class="chip" onclick="ask(this)">⚡ REST API с Flask</button>
                    </div>
                </div>`;
        }

        function addMsg(content, role, opts = {}) {
            hideWelcome();
            const { anim = true, raw = null } = opts;
            const row = document.createElement('div');
            row.className = `msg-row ${role}` + (anim ? '' : ' no-anim');

            const inner = document.createElement('div');
            inner.className = 'msg-inner';

            const header = document.createElement('div');
            header.className = 'msg-header';
            const icon = document.createElement('div');
            icon.className = 'msg-icon';
            icon.textContent = role === 'user' ? '👤' : '✦';
            const name = document.createElement('div');
            name.className = 'msg-name';
            name.textContent = role === 'user' ? 'Вие' : 'DeepCodeBG';
            header.appendChild(icon);
            header.appendChild(name);
            inner.appendChild(header);

            const textSrc = raw || content;

            if (role === 'bot') {
                const parsed = parseThink(textSrc);

                if (parsed.thinking) {
                    const rDiv = document.createElement('div');
                    rDiv.className = 'reasoning';
                    rDiv.style.marginLeft = '32px';
                    rDiv.innerHTML = `
                        <div class="reasoning-head" onclick="this.parentElement.classList.toggle('collapsed')">
                            <span>🧠</span>
                            <span class="reasoning-head-label">Разсъждение</span>
                            <span class="reasoning-arrow">▼</span>
                        </div>
                        <div class="reasoning-body">${md(parsed.thinking)}</div>
                    `;
                    inner.appendChild(rDiv);
                }

                const body = document.createElement('div');
                body.className = 'msg-content';
                body.innerHTML = md(parsed.answer || content);
                inner.appendChild(body);

                // Render math after adding to DOM
                row.appendChild(inner);
                chatEl.appendChild(row);
                renderMath(body);
            } else {
                const body = document.createElement('div');
                body.className = 'msg-content';
                body.innerHTML = esc(content).replace(/\n/g, '<br>');
                inner.appendChild(body);
                row.appendChild(inner);
                chatEl.appendChild(row);
            }

            scrollDown();
        }

        function addError(text) {
            hideWelcome();
            const row = document.createElement('div');
            row.className = 'msg-row bot';
            row.innerHTML = `<div class="msg-inner">
                <div class="msg-header"><div class="msg-icon" style="background:rgba(224,108,96,0.15)">⚠️</div><div class="msg-name">Грешка</div></div>
                <div class="msg-content"><div class="msg-error">${esc(text)}</div></div>
            </div>`;
            chatEl.appendChild(row);
            scrollDown();
        }

        function showTyping() {
            const t = document.createElement('div');
            t.className = 'typing-row'; t.id = 'typing';
            t.innerHTML = `<div class="typing-inner">
                <div class="typing-header"><div class="msg-icon" style="background:linear-gradient(135deg,var(--accent),#b06a3a);font-size:12px">✦</div><div class="msg-name">DeepCodeBG</div></div>
                <div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>
            </div>`;
            chatEl.appendChild(t);
            scrollDown();
        }

        function hideTyping() {
            const t = document.getElementById('typing');
            if (t) t.remove();
        }

        async function send() {
            const text = inputEl.value.trim();
            if (!text || isWaiting) return;

            isWaiting = true;
            sendBtn.disabled = true;
            addMsg(text, 'user');
            inputEl.value = '';
            inputEl.style.height = 'auto';
            showTyping();

            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, chatId: currentChatId, reasoning: reasoningOn, webSearch: webOn })
                });
                hideTyping();
                const data = await res.json();

                if (res.ok) {
                    currentChatId = data.chatId;
                    document.getElementById('topbar-title').textContent = data.title;
                    addMsg(data.reply, 'bot', { raw: data.reply });
                    loadList();
                } else {
                    addError(data.error || 'Възникна грешка.');
                }
            } catch (e) {
                hideTyping();
                addError('Няма връзка със сървъра.');
            }

            isWaiting = false;
            sendBtn.disabled = false;
            inputEl.focus();
        }

        async function newChat() {
            currentChatId = null;
            document.getElementById('topbar-title').textContent = 'DeepCodeBG';
            showWelcome();
            document.querySelectorAll('.chat-link.active').forEach(e => e.classList.remove('active'));
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('overlay').classList.remove('show');
            inputEl.focus();
        }

        async function loadChat(id) {
            try {
                const res = await fetch(`/api/chats/${id}`);
                if (!res.ok) return;
                const data = await res.json();
                currentChatId = id;
                document.getElementById('topbar-title').textContent = data.title;
                chatEl.innerHTML = '';

                if (data.messages.length === 0) { showWelcome(); }
                else {
                    data.messages.forEach(m => {
                        addMsg(m.content, m.role === 'assistant' ? 'bot' : 'user', {
                            anim: false, raw: m.fullContent || m.content
                        });
                    });
                }

                document.querySelectorAll('.chat-link').forEach(e => {
                    e.classList.toggle('active', e.dataset.id === id);
                });
                document.getElementById('sidebar').classList.remove('open');
                document.getElementById('overlay').classList.remove('show');
            } catch (e) { console.error(e); }
        }

        async function delChat(id, ev) {
            if (ev) { ev.stopPropagation(); ev.preventDefault(); }
            try {
                await fetch(`/api/chats/${id}`, { method: 'DELETE' });
                if (currentChatId === id) newChat();
                loadList();
            } catch (e) { console.error(e); }
        }

        function deleteCurrentChat() { if (currentChatId) delChat(currentChatId); }

        async function loadList() {
            try {
                const res = await fetch('/api/chats');
                const chats = await res.json();
                const el = document.getElementById('sidebar-chats');
                const label = '<div class="sidebar-label">Скорошни</div>';

                if (!chats.length) {
                    el.innerHTML = label + '<div class="sidebar-empty">Все още няма разговори.</div>';
                    return;
                }

                let html = label;
                chats.forEach(c => {
                    const active = c.id === currentChatId ? ' active' : '';
                    html += `<div class="chat-link${active}" data-id="${c.id}" onclick="loadChat('${c.id}')">
                        <span class="chat-link-title">${esc(c.title)}</span>
                        <button class="chat-link-del" onclick="delChat('${c.id}',event)" title="Изтрий">✕</button>
                    </div>`;
                });
                el.innerHTML = html;
            } catch (e) { console.error(e); }
        }

        loadList();
        inputEl.focus();