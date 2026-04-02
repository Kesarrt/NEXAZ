// ==========================================
// 1. DATA STORAGE & INITIALIZATION
// ==========================================
let nexaTasks = JSON.parse(localStorage.getItem('nexa-tasks')) || [];
let nexaNotes = JSON.parse(localStorage.getItem('nexa-notes')) || [];
let nexaLinks = JSON.parse(localStorage.getItem('nexa-links')) || [];
let nexaPasswords = JSON.parse(localStorage.getItem('nexa-passwords')) || [];
let nexaEvents = JSON.parse(localStorage.getItem('nexa-events')) || [];

// PIN Variables
const DEFAULT_PIN = "1234";
let loginAttempts = 0;
let currentNavDate = new Date(); // For Calendar Navigation

document.addEventListener('DOMContentLoaded', () => {
    // --- FIRST TIME USER SETUP ---
    if (!localStorage.getItem('nexa-pin')) {
        alert("Welcome to NEXAZ! Your default login PIN is 1234. You can change this in the Security section of Settings.");
        localStorage.setItem('nexa-pin', DEFAULT_PIN);
        localStorage.setItem('nexa-pin-hint', "Default is 1-2-3-4");
    }

    // --- LOAD PREFERENCES ---
    const savedTheme = localStorage.getItem('nexa-theme');
    if (savedTheme) setTheme(savedTheme);

    loadProfile();
    renderAll();
    renderLinks();
    renderPasswords();
    setupNavigation();
    renderCalendar(); // Initialize the Visual Calendar

    // --- MODAL CLICK HANDLER ---
    window.onclick = (event) => {
        const modal = document.getElementById('note-modal');
        if (event.target == modal) closeNote();
    }
});

// ==========================================
// 2. SECURITY (PIN & LOCK)
// ==========================================

function checkPin() {
    const entered = document.getElementById('pin-input').value;
    const errorTxt = document.getElementById('login-error');
    const correctPin = localStorage.getItem('nexa-pin') || DEFAULT_PIN;
    
    if (entered === correctPin) {
        document.getElementById('lock-screen').style.display = 'none';
        loginAttempts = 0;
    } else {
        loginAttempts++;
        document.getElementById('pin-input').value = "";
        if (loginAttempts >= 3) {
            const hint = localStorage.getItem('nexa-pin-hint') || "Default PIN is 1234";
            errorTxt.innerHTML = `Wrong PIN.<br><small>Hint: ${hint}</small>`;
        } else {
            errorTxt.innerText = `Incorrect PIN. (${loginAttempts}/3)`;
        }
    }
}

function updatePin() {
    const newPin = document.getElementById('new-pin').value;
    const newHint = document.getElementById('new-pin-hint').value;
    if (newPin.length === 4 && !isNaN(newPin)) {
        localStorage.setItem('nexa-pin', newPin);
        localStorage.setItem('nexa-pin-hint', newHint || "No hint provided");
        alert("PIN updated successfully!");
        document.getElementById('new-pin').value = "";
        document.getElementById('new-pin-hint').value = "";
    } else {
        alert("PIN must be exactly 4 digits.");
    }
}

// ==========================================
// 3. CROSS-APP GLOBAL SEARCH
// ==========================================

function runGlobalSearch() {
    const query = document.getElementById('global-search').value.toLowerCase();
    const resultsDiv = document.getElementById('global-search-results');
    
    if (query.length < 2) {
        resultsDiv.style.display = "none";
        return;
    }

    const taskMatches = nexaTasks.filter(t => t.text.toLowerCase().includes(query));
    const noteMatches = nexaNotes.filter(n => 
        n.title.toLowerCase().includes(query) || 
        (n.content && n.content.toLowerCase().includes(query)) || 
        (n.tags && n.tags.toLowerCase().includes(query))
    );
    const linkMatches = nexaLinks.filter(l => l.desc.toLowerCase().includes(query));

    resultsDiv.style.display = "block";
    if (taskMatches.length === 0 && noteMatches.length === 0 && linkMatches.length === 0) {
        resultsDiv.innerHTML = `<div class="search-item">No matches found</div>`;
    } else {
        resultsDiv.innerHTML = `
            ${taskMatches.map(t => `<div class="search-item" onclick="setSection('matrix')">✅ Task: ${t.text}</div>`).join('')}
            ${noteMatches.map(n => `<div class="search-item" onclick="setSection('notes')">📝 Note: ${n.title}</div>`).join('')}
            ${linkMatches.map(l => `<div class="search-item" onclick="setSection('links')">🔗 Link: ${l.desc}</div>`).join('')}
        `;
    }
}

function setSection(targetId) {
    document.querySelectorAll('.nav-item').forEach(nav => {
        if(nav.getAttribute('data-target') === targetId) nav.click();
    });
    document.getElementById('global-search-results').style.display = 'none';
    document.getElementById('global-search').value = "";
}

// ==========================================
// 4. THEME, NAV & PROFILE
// ==========================================
function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('nexa-theme', themeName);
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.page-section');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === target) section.classList.add('active');
            });
            if(target === 'calendar') renderCalendar();
        });
    });
}

function saveProfile() {
    const name = document.getElementById('profile-name').value;
    const role = document.getElementById('profile-role').value;
    localStorage.setItem('nexa-user-name', name);
    localStorage.setItem('nexa-user-role', role);
    const welcomeHeading = document.getElementById('welcome-text');
    if (welcomeHeading) welcomeHeading.innerText = `Welcome back, ${name || 'User'}`;
}

function loadProfile() {
    const savedName = localStorage.getItem('nexa-user-name') || "Kesar (Khushi)";
    const savedRole = localStorage.getItem('nexa-user-role') || "Final Year B.Tech Student";
    const nameInp = document.getElementById('profile-name');
    const roleInp = document.getElementById('profile-role');
    if(nameInp) nameInp.value = savedName;
    if(roleInp) roleInp.value = savedRole;
    const welcomeHeading = document.getElementById('welcome-text');
    if (welcomeHeading) welcomeHeading.innerText = `Welcome back, ${savedName}`;
}

// ==========================================
// 5. VISUAL CALENDAR LOGIC
// ==========================================

function changeMonth(offset) {
    currentNavDate.setMonth(currentNavDate.getMonth() + offset);
    renderCalendar();
}

function addEvent() {
    const date = document.getElementById('event-date').value;
    const title = document.getElementById('event-title').value;
    const label = document.getElementById('event-label').value;
    const color = document.getElementById('event-color').value;

    if (!date || !title) return alert("Enter date and title!");

    const newEvent = { id: Date.now(), date, title, label, color };
    nexaEvents.push(newEvent);
    localStorage.setItem('nexa-events', JSON.stringify(nexaEvents));
    renderCalendar();
    document.getElementById('event-title').value = "";
}

function deleteEvent(id) {
    nexaEvents = nexaEvents.filter(e => e.id !== id);
    localStorage.setItem('nexa-events', JSON.stringify(nexaEvents));
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthDisplay = document.getElementById('current-month-display');
    const calList = document.getElementById('calendar-events-list');
    if (!grid) return;

    grid.innerHTML = "";
    const year = currentNavDate.getFullYear();
    const month = currentNavDate.getMonth();

    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentNavDate);
    monthDisplay.innerText = `${monthName} ${year}`;

    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        grid.innerHTML += `<div style="text-align:center; font-weight:bold; font-size:0.75rem; padding-bottom:5px;">${day}</div>`;
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div></div>`;

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayEvents = nexaEvents.filter(e => e.date === dateStr);
        
        const dateSquare = document.createElement('div');
        dateSquare.style = `border: 1px solid var(--border); border-radius: 8px; min-height: 50px; padding: 4px; background: var(--bg-app); position: relative; overflow:hidden;`;
        dateSquare.innerHTML = `<span style="font-size:0.7rem;">${d}</span>`;
        
        dayEvents.forEach(ev => {
            dateSquare.innerHTML += `<div title="${ev.title}" style="background:${ev.color}; width:100%; height:3px; border-radius:2px; margin-top:2px;"></div>`;
        });
        grid.appendChild(dateSquare);
    }

    if(calList) {
        calList.innerHTML = nexaEvents.sort((a,b)=> new Date(a.date)-new Date(b.date)).map(ev => `
            <div class="vault-item" style="font-size:0.8rem; padding:8px;">
                <div style="border-left: 3px solid ${ev.color}; padding-left:8px;">
                    <strong>${ev.title}</strong><br><small>${ev.date} (${ev.label})</small>
                </div>
                <span class="material-symbols-rounded delete-btn" style="font-size:16px;" onclick="deleteEvent(${ev.id})">delete</span>
            </div>
        `).join('');
    }
}

// ==========================================
// 6. FUNCTIONAL MODULES
// ==========================================

function addTask(type) {
    const input = document.getElementById(`input-${type}`);
    if (input.value.trim() === "") return;
    nexaTasks.push({ id: Date.now(), text: input.value, type: type, completed: false, isStarred: false });
    saveAndRender();
    input.value = "";
}

function toggleStar(id) {
    const task = nexaTasks.find(t => t.id === id);
    if (task) task.isStarred = !task.isStarred;
    saveAndRender();
}

function toggleTask(id) {
    const task = nexaTasks.find(t => t.id === id);
    if (task) task.completed = !task.completed;
    saveAndRender();
}

function deleteTask(id) {
    nexaTasks = nexaTasks.filter(t => t.id !== id);
    saveAndRender();
}

function updateProgressBar() {
    const starredTasks = nexaTasks.filter(t => t.isStarred);
    const total = starredTasks.length;
    const completed = starredTasks.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    const fill = document.getElementById('progress-fill');
    const txt = document.getElementById('progress-percent');
    if(fill) fill.style.width = percent + "%";
    if(txt) txt.innerText = `${percent}%`;
}

function addPassword() {
    const service = document.getElementById('pw-service');
    const pass = document.getElementById('pw-value');
    if (!service.value || !pass.value) return;
    nexaPasswords.push({ id: Date.now(), service: service.value, pass: pass.value });
    localStorage.setItem('nexa-passwords', JSON.stringify(nexaPasswords));
    renderPasswords();
    service.value = ""; pass.value = "";
}

function renderPasswords() {
    const list = document.getElementById('password-list');
    if (!list) return;
    list.innerHTML = nexaPasswords.map(p => `
        <li class="vault-item">
            <div><strong>${p.service}</strong> <span class="masked-text" data-pass="${p.pass}">••••••</span></div>
            <div class="vault-actions">
                <span class="material-symbols-rounded view-btn" onclick="togglePassword(this)">visibility</span>
                <span class="material-symbols-rounded delete-btn" onclick="deletePassword(${p.id})">delete</span>
            </div>
        </li>`).join('');
}

function deletePassword(id) {
    nexaPasswords = nexaPasswords.filter(p => p.id !== id);
    localStorage.setItem('nexa-passwords', JSON.stringify(nexaPasswords));
    renderPasswords();
}

function togglePassword(btn) {
    const span = btn.parentElement.parentElement.querySelector('.masked-text');
    const isMasked = span.innerText === "••••••";
    span.innerText = isMasked ? span.getAttribute('data-pass') : "••••••";
    btn.innerText = isMasked ? "visibility_off" : "visibility";
}

function addDocument(input) {
    const list = document.getElementById('document-list');
    if (input.files && input.files[0]) {
        const fileURL = URL.createObjectURL(input.files[0]);
        const li = document.createElement('li');
        li.className = "vault-item";
        li.innerHTML = `<span>📄 ${input.files[0].name}</span>
            <div class="vault-actions">
                <a href="${fileURL}" target="_blank" class="view-link"><span class="material-symbols-rounded">open_in_new</span></a>
                <span class="material-symbols-rounded delete-btn" onclick="this.parentElement.parentElement.remove()">delete</span>
            </div>`;
        list.appendChild(li);
    }
}

function addNote() {
    const t = document.getElementById('note-title'), c = document.getElementById('note-content'), tg = document.getElementById('note-tags');
    if (!t.value) return;
    nexaNotes.push({ id: Date.now(), title: t.value, content: c.value, tags: tg.value });
    saveAndRender();
    t.value = ""; c.value = ""; tg.value = "";
}

function deleteNote(id, event) {
    event.stopPropagation();
    nexaNotes = nexaNotes.filter(n => n.id !== id);
    saveAndRender();
}

function openNote(id) {
    const note = nexaNotes.find(n => n.id === id);
    if (!note) return;
    document.getElementById('modal-title').innerText = note.title;
    document.getElementById('modal-body').innerText = note.content;
    document.getElementById('note-modal').style.display = 'flex';
}

function closeNote() { document.getElementById('note-modal').style.display = 'none'; }

function startVoiceRecognition() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return alert("Use Chrome!");
    const rec = new Speech();
    const btn = document.getElementById('voice-btn');
    rec.onstart = () => { btn.innerHTML = "Listening..."; btn.style.background = "#e94560"; };
    rec.onresult = (e) => { document.getElementById('note-content').value += e.results[0][0].transcript; };
    rec.onend = () => { btn.innerHTML = "Speak"; btn.style.background = "var(--accent)"; };
    rec.start();
}

function addLink() {
    const u = document.getElementById('link-url'), d = document.getElementById('link-desc');
    if (!u.value) return;
    nexaLinks.push({ id: Date.now(), url: u.value, desc: d.value });
    localStorage.setItem('nexa-links', JSON.stringify(nexaLinks));
    renderLinks();
    u.value = ""; d.value = "";
}

function renderLinks() {
    const list = document.getElementById('links-list');
    if (!list) return;
    list.innerHTML = nexaLinks.map(l => `
        <div class="note-card"><h3>Link</h3><p>${l.desc}</p><a href="${l.url}" target="_blank">Visit</a>
        <span class="material-symbols-rounded delete-note" onclick="deleteLink(${l.id})">delete</span></div>
    `).reverse().join('');
}

function deleteLink(id) {
    nexaLinks = nexaLinks.filter(l => l.id !== id);
    localStorage.setItem('nexa-links', JSON.stringify(nexaLinks));
    renderLinks();
}

// ==========================================
// 7. RENDER, BACKUP & FILTER
// ==========================================

function saveAndRender() {
    localStorage.setItem('nexa-tasks', JSON.stringify(nexaTasks));
    localStorage.setItem('nexa-notes', JSON.stringify(nexaNotes));
    renderAll();
}

function filterNotes() {
    const query = document.getElementById('note-search').value.toLowerCase();
    const cards = document.querySelectorAll('.notes-grid .note-card');
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(query) ? "block" : "none";
    });
}

function renderAll() {
    ['ui', 'i', 'u', 'e'].forEach(type => {
        const list = document.getElementById(`list-${type}`);
        if (list) {
            list.innerHTML = nexaTasks.filter(t => t.type === type).map(t => `
                <li class="${t.completed?'completed':''}">
                    <span class="material-symbols-rounded star-btn ${t.isStarred ? 'starred' : ''}" onclick="toggleStar(${t.id})">star</span>
                    <span onclick="toggleTask(${t.id})" class="task-text">${t.text}</span>
                    <span class="material-symbols-rounded delete-btn" onclick="deleteTask(${t.id})">delete</span>
                </li>`).join('');
        }
    });

    const noteList = document.getElementById('notes-list');
    if (noteList) {
        noteList.innerHTML = nexaNotes.map(n => `
            <div class="note-card" onclick="openNote(${n.id})">
                <h3>${n.title}</h3>
                <div class="note-tags">${n.tags}</div>
                <span class="material-symbols-rounded delete-note" onclick="deleteNote(${n.id}, event)">delete</span>
            </div>`).reverse().join('');
    }

    const tStat = document.getElementById('stat-tasks');
    const nStat = document.getElementById('stat-notes');
    if(tStat) tStat.innerText = `Tasks: ${nexaTasks.length}`;
    if(nStat) nStat.innerText = `Notes: ${nexaNotes.length}`;
    updateProgressBar();
}

function exportData() {
    const backup = { tasks: nexaTasks, notes: nexaNotes, links: nexaLinks, passwords: nexaPasswords, events: nexaEvents };
    const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "nexaz_backup.json";
    a.click();
}

function clearAllData() {
    if (confirm("Delete everything?")) { localStorage.clear(); location.reload(); }
}