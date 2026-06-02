const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const STORAGE_KEY = 'practice-16-notes';

const VAPID_PUBLIC_KEY =
    'BD9vKlmYgWp7eIj3yaayXYJShCEcjhWs_c3qZ2q12k7Z-qH1yMqMvQb9HM6V-glp_gfUix6tU0qOlqmcIxE3Cjc';

const socket = typeof io === 'function' ? io() : null;

function showToast(text) {
    const toast = document.createElement('div');
    toast.textContent = text;
    toast.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #4285f4;
        color: white;
        padding: 1rem;
        border-radius: 5px;
        z-index: 1000;
        max-width: 320px;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

if (socket) {
    socket.on('taskAdded', (task) => {
        const text = task?.text ? `Новая заметка: ${task.text}` : 'Добавлена новая заметка';
        showToast(text);
    });
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
            alert('Уведомления запрещены в настройках браузера.');
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
        contentDiv.innerHTML = '<p class="is-center text-error">Не удалось загрузить страницу.</p>';
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

function getNotes() {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('notes') || '[]';
    return JSON.parse(raw).map(note => (
        typeof note === 'string'
            ? { id: Date.now(), text: note, createdAt: Date.now() }
            : note
    ));
}

function initNotes() {
    const form = document.getElementById('note-form');
    const input = document.getElementById('note-input');
    const list = document.getElementById('notes-list');

    function loadNotes() {
        const notes = getNotes();
        list.innerHTML = '';

        if (!notes.length) {
            const emptyItem = document.createElement('li');
            emptyItem.textContent = 'Заметок пока нет';
            list.appendChild(emptyItem);
            return;
        }

        notes.forEach((note, index) => {
            const item = document.createElement('li');
            item.className = 'card';
            item.style.marginBottom = '0.5rem';
            item.style.padding = '0.5rem';
            item.textContent = `${index + 1}. ${note.text}`;

            const date = document.createElement('small');
            date.textContent = ` ${new Date(note.createdAt).toLocaleString()}`;
            item.appendChild(document.createElement('br'));
            item.appendChild(date);
            list.appendChild(item);
        });
    }

    function addNote(text) {
        const notes = getNotes();
        const note = { id: Date.now(), text, createdAt: Date.now() };
        notes.unshift(note);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        loadNotes();

        socket?.emit('newTask', { id: note.id, text: note.text, timestamp: note.createdAt });
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

    loadNotes();
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('sw.js');
            console.log('SW registered:', reg.scope);
            await initPushUi(reg);
        } catch (err) {
            console.log('SW registration failed:', err);
        }
    });
}
