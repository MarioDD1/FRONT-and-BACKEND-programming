const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const STORAGE_KEY = 'practice-17-notes';

const VAPID_PUBLIC_KEY =
    'BD9vKlmYgWp7eIj3yaayXYJShCEcjhWs_c3qZ2q12k7Z-qH1yMqMvQb9HM6V-glp_gfUix6tU0qOlqmcIxE3Cjc';

const socket = typeof io === 'function' ? io() : null;

function showToast(text) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

if (socket) {
    socket.on('taskAdded', (task) => {
        const text = task?.text ? `Новая запись: ${task.text}` : 'Добавлена новая запись';
        showToast(text);
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    await fetch('/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
    });
}

async function unsubscribeFromPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await fetch('/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
    });
    await subscription.unsubscribe();
}

async function initPushUi(registration) {
    const enableBtn = document.getElementById('enable-push');
    const disableBtn = document.getElementById('disable-push');
    if (!enableBtn || !disableBtn) return;

    const existing = await registration.pushManager.getSubscription();
    enableBtn.style.display = existing ? 'none' : 'inline-block';
    disableBtn.style.display = existing ? 'inline-block' : 'none';

    enableBtn.addEventListener('click', async () => {
        if (Notification.permission === 'denied') {
            alert('Уведомления запрещены. Разрешите их в настройках браузера.');
            return;
        }
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Нужно разрешить уведомления.');
                return;
            }
        }

        try {
            await subscribeToPush();
            enableBtn.style.display = 'none';
            disableBtn.style.display = 'inline-block';
        } catch (err) {
            console.error('Ошибка подписки на push:', err);
            alert('Не удалось включить уведомления.');
        }
    });

    disableBtn.addEventListener('click', async () => {
        try {
            await unsubscribeFromPush();
            disableBtn.style.display = 'none';
            enableBtn.style.display = 'inline-block';
        } catch (err) {
            console.error('Ошибка отписки от push:', err);
            alert('Не удалось отключить уведомления.');
        }
    });
}

function setActiveButton(activeId) {
    [homeBtn, aboutBtn].forEach(btn => btn.classList.remove('active'));
    document.getElementById(activeId).classList.add('active');
}

async function loadContent(page) {
    try {
        const response = await fetch(`content/${page}.html`);
        const html = await response.text();
        contentDiv.innerHTML = html;

        if (page === 'home') {
            initNotes();
        }
    } catch (err) {
        contentDiv.innerHTML = '<p class="empty-state">Не удалось загрузить страницу.</p>';
        console.error(err);
    }
}

homeBtn.addEventListener('click', () => {
    setActiveButton('home-btn');
    loadContent('home');
});

aboutBtn.addEventListener('click', () => {
    setActiveButton('about-btn');
    loadContent('about');
});

loadContent('home');

function initNotes() {
    const form = document.getElementById('note-form');
    const input = document.getElementById('note-input');
    const reminderForm = document.getElementById('reminder-form');
    const reminderText = document.getElementById('reminder-text');
    const reminderTime = document.getElementById('reminder-time');
    const list = document.getElementById('notes-list');

    function getNotes() {
        const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('notes') || '[]';
        return JSON.parse(raw).map((note) => {
            if (typeof note === 'string') {
                return { id: Date.now(), text: note, createdAt: Date.now(), reminder: null };
            }
            return note;
        });
    }

    function loadNotes() {
        const notes = getNotes();

        if (!notes.length) {
            list.innerHTML = '<li class="empty-state">Пока нет заметок. Добавьте первую запись выше.</li>';
            return;
        }

        list.innerHTML = notes.map((note, index) => `
            <li class="note-card">
                <p class="note-text">${index + 1}. ${escapeHtml(note.text)}</p>
                <div class="note-meta">
                    <span>Создано: ${new Date(note.createdAt).toLocaleString()}</span>
                    ${note.reminder ? `<span class="reminder-badge">Напомнить: ${new Date(note.reminder).toLocaleString()}</span>` : ''}
                </div>
            </li>
        `).join('');
    }

    function addNote(text, reminderTimestamp = null) {
        const notes = getNotes();
        const note = { id: Date.now(), text, createdAt: Date.now(), reminder: reminderTimestamp };
        notes.unshift(note);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        loadNotes();

        socket?.emit('newTask', { id: note.id, text: note.text, timestamp: note.createdAt });
        if (reminderTimestamp) {
            socket?.emit('newReminder', { id: note.id, text: note.text, reminderTime: reminderTimestamp });
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) {
            addNote(text);
            input.value = '';
            input.focus();
        }
    });

    reminderForm?.addEventListener('submit', (e) => {
        e.preventDefault();

        const text = reminderText?.value.trim();
        const dtValue = reminderTime?.value;
        const ts = dtValue ? new Date(dtValue).getTime() : NaN;

        if (!text) return;
        if (!Number.isFinite(ts)) {
            alert('Выберите дату и время напоминания.');
            return;
        }
        if (ts <= Date.now()) {
            alert('Напоминание должно быть в будущем.');
            return;
        }

        addNote(text, ts);
        reminderText.value = '';
        reminderTime.value = '';
    });

    loadNotes();
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('sw.js');
            console.log('Service worker зарегистрирован:', reg.scope);
            await initPushUi(reg);
        } catch (err) {
            console.log('Ошибка регистрации service worker:', err);
        }
    });
}
