// given-notes.js — notes with save + delete

const NOTE_KEYS = [
  { id: 'daily-note',   label: 'Daily notes',   key: 'daily-note'   },
  { id: 'work-note',    label: 'Work notes',     key: 'work-note'    },
  { id: 'money-note',   label: 'Money notes',    key: 'money-note'   },
  { id: 'private-note', label: 'Private',        key: 'private-note' },
];

function saveNote(key) {
  const el  = document.getElementById(key);
  if (!el) return;
  S.set(key, el.value);
  flashSaved('saved-' + key);
}

function deleteNote(key) {
  if (!confirm('Delete this note? It cannot be undone.')) return;
  S.set(key, '');
  const el = document.getElementById(key);
  if (el) el.value = '';
  flashSaved('saved-' + key, 'Deleted');
}

function flashSaved(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg || 'Saved ✓';
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.style.opacity = '0', 1800);
}

function initNotes() {
  NOTE_KEYS.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    const v  = S.get(key);
    if (el && v !== null) el.value = v;
  });
}
