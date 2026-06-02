const form = document.getElementById('note-form');
const input = document.getElementById('note-input');
const list = document.getElementById('notes-list');
const banner = document.getElementById('offline-banner');
const STORAGE_KEY = 'practice-14-notes';

function updateOnlineStatus() {
    banner.classList.toggle('visible', !navigator.onLine);
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

function getNotes() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem('notes') || '[]');
}

function loadNotes() {
    const notes = getNotes();
    list.innerHTML = '';

    if (!notes.length) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = 'Записей пока нет';
        list.appendChild(emptyItem);
        return;
    }

    notes.forEach((note, index) => {
        const item = document.createElement('li');
        item.textContent = `${index + 1}. ${note}`;
        list.appendChild(item);
    });
}

function addNote(text) {
    const notes = getNotes();
    notes.unshift(text);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    loadNotes();
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

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker зарегистрирован:', registration.scope);
        } catch (err) {
            console.error('Ошибка регистрации Service Worker:', err);
        }
    });
}
