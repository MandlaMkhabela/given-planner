// given-home.js — tasks with times + bills

// ── TASK LIBRARY ─────────────────────────────────────────────────────────────
// Each entry: { text, duration (mins), bestTime ('morning'|'afternoon'|'evening'|'anytime'), emoji }
const TASK_LIBRARY = [
  // Cleaning
  { text: 'Sweep the floors',         duration: 20,  bestTime: 'morning',   emoji: '🧹' },
  { text: 'Mop the floors',           duration: 30,  bestTime: 'morning',   emoji: '🪣' },
  { text: 'Clean the bathroom',       duration: 25,  bestTime: 'morning',   emoji: '🚿' },
  { text: 'Clean the toilet',         duration: 15,  bestTime: 'morning',   emoji: '🚽' },
  { text: 'Wipe down kitchen',        duration: 20,  bestTime: 'morning',   emoji: '🍽️' },
  { text: 'Wash the dishes',          duration: 20,  bestTime: 'anytime',   emoji: '🍶' },
  { text: 'Take out the trash',       duration: 10,  bestTime: 'morning',   emoji: '🗑️' },
  { text: 'Clean the fridge',         duration: 25,  bestTime: 'afternoon', emoji: '🧊' },
  { text: 'Vacuum the rooms',         duration: 30,  bestTime: 'morning',   emoji: '🌀' },
  { text: 'Wipe windows',             duration: 20,  bestTime: 'morning',   emoji: '🪟' },
  // Laundry
  { text: 'Do the laundry',           duration: 60,  bestTime: 'morning',   emoji: '👕' },
  { text: 'Hang the washing',         duration: 15,  bestTime: 'morning',   emoji: '👗' },
  { text: 'Fold and pack clothes',    duration: 20,  bestTime: 'afternoon', emoji: '🧺' },
  { text: 'Iron clothes',             duration: 30,  bestTime: 'evening',   emoji: '👔' },
  // Shopping & errands
  { text: 'Buy groceries',            duration: 45,  bestTime: 'morning',   emoji: '🛒' },
  { text: 'Buy airtime / data',       duration: 10,  bestTime: 'anytime',   emoji: '📱' },
  { text: 'Pay electricity',          duration: 15,  bestTime: 'anytime',   emoji: '⚡' },
  { text: 'Pay water bill',           duration: 15,  bestTime: 'anytime',   emoji: '💧' },
  { text: 'Go to the ATM',            duration: 20,  bestTime: 'anytime',   emoji: '🏧' },
  { text: 'Post office run',          duration: 30,  bestTime: 'morning',   emoji: '📮' },
  { text: 'Pick up something from town', duration: 60, bestTime: 'morning', emoji: '🏙️' },
  // Food
  { text: 'Cook dinner',              duration: 45,  bestTime: 'evening',   emoji: '🍳' },
  { text: 'Cook lunch',               duration: 30,  bestTime: 'afternoon', emoji: '🥘' },
  { text: 'Prep tomorrow\'s food',    duration: 20,  bestTime: 'evening',   emoji: '🥗' },
  { text: 'Make breakfast',           duration: 15,  bestTime: 'morning',   emoji: '🥣' },
  // Kids & family
  { text: 'Help kids with homework',  duration: 45,  bestTime: 'afternoon', emoji: '📚' },
  { text: 'Drop kids at school',      duration: 30,  bestTime: 'morning',   emoji: '🎒' },
  { text: 'Pick up kids from school', duration: 30,  bestTime: 'afternoon', emoji: '🚶' },
  { text: 'Bath the kids',            duration: 25,  bestTime: 'evening',   emoji: '🛁' },
  { text: 'Check in on family',       duration: 20,  bestTime: 'anytime',   emoji: '📞' },
  // Self
  { text: 'Exercise / gym',           duration: 60,  bestTime: 'morning',   emoji: '💪' },
  { text: 'Go for a walk',            duration: 30,  bestTime: 'morning',   emoji: '🚶' },
  { text: 'Get a haircut',            duration: 45,  bestTime: 'afternoon', emoji: '✂️' },
  { text: 'Doctor / clinic visit',    duration: 90,  bestTime: 'morning',   emoji: '🏥' },
  // Home maintenance
  { text: 'Fix something in the house', duration: 60, bestTime: 'afternoon', emoji: '🔧' },
  { text: 'Pay rent',                 duration: 10,  bestTime: 'anytime',   emoji: '🏠' },
  { text: 'Charge devices',           duration: 10,  bestTime: 'evening',   emoji: '🔋' },
  { text: 'Organise the bedroom',     duration: 30,  bestTime: 'morning',   emoji: '🛏️' },
  // Chill
  { text: 'Grab a beer with the guys', duration: 90, bestTime: 'afternoon', emoji: '🍺' },
  { text: 'Chill with family',        duration: 60,  bestTime: 'evening',   emoji: '🛋️' },
  { text: 'Watch something',          duration: 90,  bestTime: 'evening',   emoji: '📺' },
  { text: 'Go grab a burger',         duration: 45,  bestTime: 'afternoon', emoji: '🍔' },
];

// ── LIBRARY PICKER ────────────────────────────────────────────────────────────
let libraryOpen = false;
let libraryFilter = '';

function toggleLibrary() {
  libraryOpen = !libraryOpen;
  const picker = document.getElementById('task-picker');
  const btn    = document.getElementById('library-btn');
  if (!picker) return;
  picker.style.display = libraryOpen ? 'block' : 'none';
  btn.textContent = libraryOpen ? '✕ Close' : '📋 Pick from list';
  if (libraryOpen) renderLibrary();
}

function renderLibrary() {
  const el = document.getElementById('library-list');
  if (!el) return;
  const existing = S.get('home-tasks', []).map(t => t.text);
  const q = libraryFilter.toLowerCase();
  const filtered = TASK_LIBRARY.filter(t =>
    (!q || t.text.toLowerCase().includes(q)) && !existing.includes(t.text)
  );
  if (!filtered.length) {
    el.innerHTML = '<p class="empty-msg">Nothing matching — try a different search</p>';
    return;
  }
  el.innerHTML = filtered.map((t, i) => `
    <div class="lib-item" onclick="addFromLibrary('${t.text.replace(/'/g,"\\'")}','${t.bestTime}',${t.duration},'${t.emoji}')">
      <span class="lib-emoji">${t.emoji}</span>
      <div class="lib-text">
        <div class="lib-name">${t.text}</div>
        <div class="lib-meta">${t.duration} min · best: ${t.bestTime}</div>
      </div>
      <span class="lib-add">+</span>
    </div>`).join('');
}

function filterLibrary(val) {
  libraryFilter = val;
  renderLibrary();
}

function addFromLibrary(text, bestTime, duration, emoji) {
  const tasks = S.get('home-tasks', []);
  tasks.push({ text, bestTime, duration, emoji, time: '', done: false });
  S.set('home-tasks', tasks);
  renderHomeTasks();
  renderLibrary(); // refresh to remove added item
  if (typeof renderPredictions === 'function') renderPredictions();
}

// ── TASK LIST ─────────────────────────────────────────────────────────────────
function renderHomeTasks() {
  const tasks = S.get('home-tasks', []);
  const el    = document.getElementById('home-list');
  if (!el) return;

  const left = tasks.filter(t => !t.done).length;
  const el2  = document.getElementById('td-tasks');
  if (el2) el2.textContent = left;

  if (!tasks.length) {
    el.innerHTML = '<p class="empty-msg">No tasks. Pick from the list or add your own below 👇</p>';
    return;
  }

  el.innerHTML = tasks.map((t, i) => `
    <div class="ht-item${t.done ? ' done' : ''}">
      <div class="ht-top" onclick="toggleHT(${i})">
        <div class="ckbox">${t.done ? '✓' : ''}</div>
        <span class="ht-emoji">${t.emoji || '📌'}</span>
        <span class="ht-text">${esc(t.text)}</span>
        ${t.duration ? `<span class="ht-dur">${t.duration}m</span>` : ''}
        <button class="cl-del" onclick="event.stopPropagation();delHT(${i})">×</button>
      </div>
      <div class="ht-time-row">
        <label>When?</label>
        <select class="inp ht-time-sel" onchange="setTaskTime(${i},this.value)">
          <option value="">No specific time</option>
          <option value="morning"   ${t.time==='morning'   ?'selected':''}>Morning (06:00–12:00)</option>
          <option value="afternoon" ${t.time==='afternoon' ?'selected':''}>Afternoon (12:00–17:00)</option>
          <option value="evening"   ${t.time==='evening'   ?'selected':''}>Evening (17:00–22:00)</option>
          <option value="anytime"   ${t.time==='anytime'   ?'selected':''}>Anytime</option>
        </select>
        ${t.bestTime && !t.time ? `<span class="ht-suggest">Suggested: ${t.bestTime}</span>` : ''}
      </div>
    </div>`).join('');
}

function addHomeTask() {
  const inp = document.getElementById('home-inp');
  const t   = inp.value.trim();
  if (!t) return;
  const tasks = S.get('home-tasks', []);
  tasks.push({ text: t, emoji: '📌', bestTime: 'anytime', duration: 0, time: '', done: false });
  S.set('home-tasks', tasks);
  inp.value = '';
  renderHomeTasks();
  if (typeof renderPredictions === 'function') renderPredictions();
}

function setTaskTime(i, val) {
  const tasks = S.get('home-tasks', []);
  tasks[i].time = val;
  S.set('home-tasks', tasks);
  renderHomeTasks();
  if (typeof renderPredictions === 'function') renderPredictions();
}

function toggleHT(i) {
  const a = S.get('home-tasks', []);
  a[i].done = !a[i].done;
  S.set('home-tasks', a);
  renderHomeTasks();
}

function delHT(i) {
  const a = S.get('home-tasks', []);
  a.splice(i, 1);
  S.set('home-tasks', a);
  renderHomeTasks();
  if (typeof renderPredictions === 'function') renderPredictions();
}

// expose tasks for predictions engine
function getHomeTasks() { return S.get('home-tasks', []); }

// ── BILLS ─────────────────────────────────────────────────────────────────────
function renderBills() {
  const bills = S.get('bills', []);
  const el    = document.getElementById('bills-list');
  if (!el) return;
  const total = bills.reduce((a, b) => a + b.amount, 0);
  const tot   = document.getElementById('bills-total');
  if (tot) tot.textContent = 'R' + total.toFixed(0);
  if (!bills.length) {
    el.innerHTML = '<p class="empty-msg">Add your monthly bills here</p>';
    return;
  }
  el.innerHTML = bills.map((b, i) => `
    <div class="cl-item${b.paid ? ' done' : ''}">
      <div class="ckbox" onclick="toggleBill(${i})">${b.paid ? '✓' : ''}</div>
      <span onclick="toggleBill(${i})" style="flex:1;">${esc(b.name)}</span>
      <span style="font-weight:700;color:${b.paid ? 'var(--green)' : 'var(--red)'};">R${b.amount.toFixed(0)}</span>
      <button class="cl-del" onclick="delBill(${i})">×</button>
    </div>`).join('');
}

function addBill() {
  const n = document.getElementById('bill-name-inp').value.trim();
  const a = parseFloat(document.getElementById('bill-amt-inp').value);
  if (!n || !a) return;
  const bills = S.get('bills', []);
  bills.push({ name: n, amount: a, paid: false });
  S.set('bills', bills);
  document.getElementById('bill-name-inp').value = '';
  document.getElementById('bill-amt-inp').value  = '';
  renderBills();
}

function toggleBill(i) { const b = S.get('bills', []); b[i].paid = !b[i].paid; S.set('bills', b); renderBills(); }
function delBill(i)     { const b = S.get('bills', []); b.splice(i, 1); S.set('bills', b); renderBills(); }
