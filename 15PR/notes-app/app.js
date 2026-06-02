const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const STORAGE_KEY = 'practice-15-notes';

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
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem('notes') || '[]');
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
            emptyItem.textContent = 'Список пока пуст';
            list.appendChild(emptyItem);
            return;
        }

        notes.forEach((note, index) => {
            const item = document.createElement('li');
            item.className = 'card';
            item.style.marginBottom = '0.5rem';
            item.style.padding = '0.5rem';
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
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW registered:', reg.scope))
            .catch(err => console.log('SW registration failed:', err));
    });
}
