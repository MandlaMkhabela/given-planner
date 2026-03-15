// given-firebase.js — Firebase sync — project: given-planner

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBkd6EF5GCt3Rn41fxvt0mnUWGmAEq_jzc",
  authDomain:        "given-planner.firebaseapp.com",
  projectId:         "given-planner",
  storageBucket:     "given-planner.firebasestorage.app",
  messagingSenderId: "148989714577",
  appId:             "1:148989714577:web:3062e1774d631f596cdf30",
  measurementId:     "G-FPYN7DQYDQ"
};

let DB = null, UID = null, syncActive = false;
let _doc, _col, _setDoc, _getDoc, _getDocs, _addDoc, _query, _orderBy, _limit;

async function initFirebase() {
  console.log('[Firebase] Initializing given-planner...');
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getAuth, signInAnonymously, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const fb = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

    const app = initializeApp(FIREBASE_CONFIG);
    DB = fb.getFirestore(app);

    // Skip IndexedDB persistence on localhost — it causes write hangs
    // Will be enabled on production domain automatically
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isLocal) {
      try {
        await fb.enableIndexedDbPersistence(DB);
        console.log('[Firebase] Offline persistence enabled ✓');
      } catch(e) { console.warn('[Firebase] Persistence:', e.code); }
    } else {
      console.log('[Firebase] Localhost — skipping persistence, using memory cache');
    }

    _doc      = (c, i) => fb.doc(DB, c, i);
    _col      = (p)    => fb.collection(DB, p);
    _setDoc   = fb.setDoc;
    _getDoc   = fb.getDoc;
    _getDocs  = fb.getDocs;
    _addDoc   = fb.addDoc;
    _query    = fb.query;
    _orderBy  = fb.orderBy;
    _limit    = fb.limit;

    const auth = getAuth(app);
    onAuthStateChanged(auth, async user => {
      if (!user) { updateSyncBadge('offline'); return; }
      UID = user.uid;
      console.log('[Firebase] ✅ Signed in uid:', UID);
      updateSyncBadge('syncing');
      // Wait for Firestore to fully settle after persistence init
      await new Promise(res => setTimeout(res, 800));
      const flag = localStorage.getItem('gv_fb_migrated_' + UID);
      if (!flag) {
        await _migrateAll();
      } else {
        console.log('[Firebase] Already migrated ✓');
      }
      syncActive = true;
      updateSyncBadge('online');
    });

    await signInAnonymously(auth);
  } catch(err) {
    console.error('[Firebase] ❌ Init failed:', err.message, err);
    updateSyncBadge('offline');
  }
}

// ── safe data readers ─────────────────────────────────────────────────────────
function safeObj(key)  { try { return S.get(key, {})  || {}; } catch(e) { return {}; } }
function safeArr(key)  { try { return S.get(key, [])  || []; } catch(e) { return []; } }
function safeStr(key)  { try { return S.get(key, '')  || ''; } catch(e) { return ''; } }

// ── migrate ───────────────────────────────────────────────────────────────────
async function _migrateAll() {
  console.log('[Firebase] _migrateAll() starting...');

  // step 1 — profile
  console.log('[Firebase] step 1: profile');
  try {
    await _setDoc(_doc('users', UID), {
      uid: UID,
      rate: parseFloat(safeStr('sh-rate')) || 25,
      viewDays: parseInt(safeStr('cal-view-days')) || 7,
      createdAt: new Date().toISOString()
    }, { merge: true });
    console.log('[Firebase] step 1 done ✓');
  } catch(e) { console.error('[Firebase] step 1 failed:', e.message); }

  // step 2 — shift calendar
  console.log('[Firebase] step 2: shift calendar');
  try {
    const cal = safeObj('shift-cal');
    const entries = Object.entries(cal);
    console.log('[Firebase] step 2: ' + entries.length + ' days');
    for (const [dateKey, day] of entries) {
      await _setDoc(_doc('users/' + UID + '/shifts', dateKey), { ...day, dateKey, uid: UID });
    }
    console.log('[Firebase] step 2 done ✓');
  } catch(e) { console.error('[Firebase] step 2 failed:', e.message); }

  // step 3 — shift history
  console.log('[Firebase] step 3: shift history');
  try {
    const hist = safeArr('sh-hist');
    console.log('[Firebase] step 3: ' + hist.length + ' entries');
    for (const entry of hist) {
      if (!entry || typeof entry !== 'object') continue;
      await _addDoc(_col('users/' + UID + '/shiftHistory'), { ...entry, uid: UID });
    }
    console.log('[Firebase] step 3 done ✓');
  } catch(e) { console.error('[Firebase] step 3 failed:', e.message); }

  // step 4 — tasks
  console.log('[Firebase] step 4: tasks');
  try {
    const tasks = safeArr('home-tasks');
    console.log('[Firebase] step 4: ' + tasks.length + ' tasks');
    for (const task of tasks) {
      if (!task || typeof task !== 'object') continue;
      await _addDoc(_col('users/' + UID + '/tasks'), { ...task, uid: UID });
    }
    console.log('[Firebase] step 4 done ✓');
  } catch(e) { console.error('[Firebase] step 4 failed:', e.message); }

  // step 5 — bills
  console.log('[Firebase] step 5: bills');
  try {
    const bills = safeArr('bills');
    console.log('[Firebase] step 5: ' + bills.length + ' bills');
    for (const bill of bills) {
      if (!bill || typeof bill !== 'object') continue;
      await _addDoc(_col('users/' + UID + '/bills'), { ...bill, uid: UID });
    }
    console.log('[Firebase] step 5 done ✓');
  } catch(e) { console.error('[Firebase] step 5 failed:', e.message); }

  // step 6 — plans
  console.log('[Firebase] step 6: plans');
  try {
    const plans = safeArr('plans');
    console.log('[Firebase] step 6: ' + plans.length + ' plans');
    for (const plan of plans) {
      if (!plan || typeof plan !== 'object') continue;
      await _addDoc(_col('users/' + UID + '/plans'), { ...plan, uid: UID });
    }
    console.log('[Firebase] step 6 done ✓');
  } catch(e) { console.error('[Firebase] step 6 failed:', e.message); }

  // step 7 — family
  console.log('[Firebase] step 7: family');
  try {
    const fam = safeArr('fam-members');
    console.log('[Firebase] step 7: ' + fam.length + ' members');
    for (const member of fam) {
      if (!member || typeof member !== 'object') continue;
      await _addDoc(_col('users/' + UID + '/family'), { ...member, uid: UID });
    }
    console.log('[Firebase] step 7 done ✓');
  } catch(e) { console.error('[Firebase] step 7 failed:', e.message); }

  // step 8 — notes
  console.log('[Firebase] step 8: notes');
  try {
    await _setDoc(_doc('users/' + UID + '/notes', 'main'), {
      daily:   safeStr('daily-note'),
      work:    safeStr('work-note'),
      money:   safeStr('money-note'),
      private: safeStr('private-note'),
      morning: safeStr('morning-note'),
      uid:     UID,
      updatedAt: new Date().toISOString()
    });
    console.log('[Firebase] step 8 done ✓');
  } catch(e) { console.error('[Firebase] step 8 failed:', e.message); }

  // step 9 — priorities
  console.log('[Firebase] step 9: priorities');
  try {
    await _setDoc(_doc('users/' + UID + '/priorities', 'main'), {
      items:     safeArr('priorities'),
      gratitude: safeStr('gratitude'),
      savings:   { target: safeStr('sav-target'), current: safeStr('sav-current') },
      uid:       UID,
      updatedAt: new Date().toISOString()
    });
    console.log('[Firebase] step 9 done ✓');
  } catch(e) { console.error('[Firebase] step 9 failed:', e.message); }

  // mark done
  localStorage.setItem('gv_fb_migrated_' + UID, '1');
  console.log('[Firebase] ✅ Migration complete!');
  showSyncToast('KingLife backed up to cloud ☁️ 🙌');
}

// ── push helpers ──────────────────────────────────────────────────────────────
async function pushNotes() {
  if (!syncActive || !UID) return;
  try {
    await _setDoc(_doc('users/' + UID + '/notes', 'main'), {
      daily: safeStr('daily-note'), work: safeStr('work-note'),
      money: safeStr('money-note'), private: safeStr('private-note'),
      morning: safeStr('morning-note'), uid: UID, updatedAt: new Date().toISOString()
    }, { merge: true });
    updateSyncBadge('online');
  } catch(e) { console.warn('[Firebase] pushNotes:', e.message); }
}

async function pushPriorities() {
  if (!syncActive || !UID) return;
  try {
    await _setDoc(_doc('users/' + UID + '/priorities', 'main'), {
      items: safeArr('priorities'), gratitude: safeStr('gratitude'),
      savings: { target: safeStr('sav-target'), current: safeStr('sav-current') },
      uid: UID, updatedAt: new Date().toISOString()
    }, { merge: true });
    updateSyncBadge('online');
  } catch(e) { console.warn('[Firebase] pushPriorities:', e.message); }
}

async function pushShiftDay(dateKey, data) {
  if (!syncActive || !UID) return;
  try {
    await _setDoc(_doc('users/' + UID + '/shifts', dateKey),
      { ...data, dateKey, uid: UID, updatedAt: new Date().toISOString() });
    updateSyncBadge('online');
  } catch(e) { console.warn('[Firebase] pushShiftDay:', e.message); }
}

async function pushShiftHistory(entry) {
  if (!syncActive || !UID) return;
  try {
    await _addDoc(_col('users/' + UID + '/shiftHistory'), { ...entry, uid: UID });
  } catch(e) { console.warn('[Firebase] pushShiftHistory:', e.message); }
}

async function pushTasks() {
  if (!syncActive || !UID) return;
  try {
    await _setDoc(_doc('users/' + UID + '/priorities', 'tasks'), {
      items: safeArr('home-tasks'), uid: UID, updatedAt: new Date().toISOString()
    }, { merge: true });
    updateSyncBadge('online');
  } catch(e) { console.warn('[Firebase] pushTasks:', e.message); }
}

async function pushProfile() {
  if (!syncActive || !UID) return;
  try {
    await _setDoc(_doc('users', UID), {
      rate: parseFloat(safeStr('sh-rate')) || 25,
      viewDays: parseInt(safeStr('cal-view-days')) || 7,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch(e) { console.warn('[Firebase] pushProfile:', e.message); }
}

// ── hook S.set ────────────────────────────────────────────────────────────────
const _origSet = S.set;
S.set = function(k, v) {
  _origSet.call(S, k, v);
  if (!syncActive) return;
  clearTimeout(S['_t_' + k]);
  S['_t_' + k] = setTimeout(() => {
    if (['daily-note','work-note','money-note','private-note','morning-note'].includes(k)) pushNotes();
    else if (k === 'home-tasks') pushTasks();
    else if (['priorities','gratitude','sav-target','sav-current'].includes(k)) pushPriorities();
    else if (['sh-rate','cal-view-days'].includes(k)) pushProfile();
  }, 1500);
};

// ── UI helpers ────────────────────────────────────────────────────────────────
function updateSyncBadge(state) {
  const el = document.getElementById('sync-badge');
  if (!el) return;
  const map = { online:'☁️ Synced', syncing:'⏳ Syncing…', offline:'📴 Offline' };
  const col = { online:'var(--green)', syncing:'var(--amber)', offline:'var(--muted)' };
  el.textContent = map[state] || map.offline;
  el.style.color = col[state] || col.offline;
}

function showSyncToast(msg) {
  const el = document.getElementById('sync-toast');
  if (!el) return;
  el.textContent = msg; el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 4000);
}

window.FB = { pushShiftDay, pushShiftHistory, pushNotes, pushTasks, pushPriorities, pushProfile };

initFirebase();