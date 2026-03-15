// given-schedule.js — date-specific shift schedule + smart predictions

// ── SHIFT PRESETS ─────────────────────────────────────────────────────────────
const SHIFT_PRESETS = [
  { label: 'Morning',   start: '06:00', end: '14:00' },
  { label: 'Afternoon', start: '14:00', end: '22:00' },
  { label: 'Night',     start: '22:00', end: '06:00' },
  { label: 'Early',     start: '05:00', end: '13:00' },
  { label: 'Long',      start: '06:00', end: '18:00' },
  { label: 'Half day',  start: '08:00', end: '13:00' },
];

// ── DATE HELPERS ──────────────────────────────────────────────────────────────
function dateKey(d) {
  // YYYY-MM-DD string for a Date object
  return d.getFullYear() + '-' + p2(d.getMonth()+1) + '-' + p2(d.getDate());
}
function addDays(d, n) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function dayLabel(d, offset) {
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Tomorrow';
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return days[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth()+1);
}
function getRate() {
  return parseFloat(document.getElementById('tt-rate')?.value)
      || parseFloat(S.get('tt-rate', 25)) || 25;
}

// ── SHIFT CALENDAR STORE ──────────────────────────────────────────────────────
// calendar = { 'YYYY-MM-DD': { work: bool, start: 'HH:MM', end: 'HH:MM', note: '' } }
function getCalendar() { return S.get('shift-cal', {}); }
function setCalendar(cal) { S.set('shift-cal', cal); }

function getDay(date) {
  const cal = getCalendar();
  const key = dateKey(date);
  return cal[key] || { work: false, start: '06:00', end: '14:00', note: '' };
}

function saveDay(date, data) {
  const cal = getCalendar();
  cal[dateKey(date)] = data;
  setCalendar(cal);
}

function deleteDay(dateStr) {
  const cal = getCalendar();
  delete cal[dateStr];
  setCalendar(cal);
  renderCalendar();
  renderPredictions();
}

// ── HOW MANY DAYS TO SHOW ─────────────────────────────────────────────────────
function getViewDays() { return parseInt(S.get('cal-view-days', 7)); }
function setViewDays(n) { S.set('cal-view-days', n); renderCalendar(); renderPredictions(); }

// ── RENDER CALENDAR ───────────────────────────────────────────────────────────
function renderCalendar() {
  const el = document.getElementById('timetable-grid');
  if (!el) return;
  const now   = new Date();
  const days  = getViewDays();
  const rate  = getRate();

  el.innerHTML = '';

  for (let off = 0; off < days; off++) {
    const date = addDays(now, off);
    const key  = dateKey(date);
    const day  = getDay(date);
    const lbl  = dayLabel(date, off);
    const hrs  = day.work ? shiftHrs(day.start, day.end) : 0;
    const pay  = hrs * rate;

    // Is this shift currently live?
    const isToday = off === 0;
    const curH    = now.getHours() + now.getMinutes()/60;
    const sh      = day.work ? parseFloat(day.start) : 0;
    const eh      = day.work ? parseFloat(day.end) : 0;
    const live    = isToday && day.work && curH >= sh && curH < eh;
    const elapsed = live ? curH - sh : 0;
    const liveEarned = (elapsed * rate).toFixed(2);

    el.innerHTML += `
    <div class="tt-day" id="tt-day-${off}">
      <div class="tt-day-hdr" onclick="toggleTTDay(${off})">
        <div>
          <span class="tt-day-name ${day.work ? 'workday' : 'offday'}">${lbl}</span>
          ${live ? '<span class="live-badge">● LIVE</span>' : ''}
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          ${live
            ? `<span style="font-size:0.82rem;color:var(--green);">R${liveEarned} so far</span>`
            : day.work
              ? `<span style="font-size:0.82rem;color:var(--neon);">${day.start} – ${day.end}</span>`
              : ''
          }
          <span class="tt-badge ${day.work?'badge-work':'badge-off'}">
            ${day.work ? hrs.toFixed(1)+'h' : 'OFF'}
          </span>
        </div>
      </div>
      <div class="tt-day-body" id="tt-body-${off}">

        <!-- Work/off toggle -->
        <div class="tt-toggle" onclick="toggleCalDay(${off},'${key}')">
          <div class="tt-switch ${day.work?'on':''}" id="tt-sw-${off}"></div>
          <span id="tt-sw-lbl-${off}">${day.work ? 'Work day' : 'Day off'}</span>
        </div>

        <!-- Times (shown when work=true) -->
        <div id="tt-times-${off}" style="margin-top:14px;display:${day.work?'block':'none'};">

          <!-- Presets -->
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
            ${SHIFT_PRESETS.map(p=>`
              <button class="preset-btn ${day.start===p.start&&day.end===p.end?'preset-active':''}"
                onclick="applyPreset(${off},'${key}','${p.start}','${p.end}')">
                ${p.label}
              </button>`).join('')}
          </div>

          <div class="tt-time-row">
            <label>Start</label>
            <input class="tt-time-inp" type="time" id="tt-start-${off}" value="${day.start}"
              onchange="updateCalTime(${off},'${key}','start',this.value)">
          </div>
          <div class="tt-time-row">
            <label>End</label>
            <input class="tt-time-inp" type="time" id="tt-end-${off}" value="${day.end}"
              onchange="updateCalTime(${off},'${key}','end',this.value)">
          </div>

          <!-- Live pay counter -->
          ${live ? `
          <div class="live-counter" id="live-counter">
            <span class="live-dot"></span>
            <span>Earning right now: <strong id="live-pay">R${liveEarned}</strong></span>
            <span style="color:var(--muted);font-size:0.8rem;">${fmtMins(Math.round((eh-curH)*60))} left</span>
          </div>` : ''}

          ${day.work ? `<div style="font-size:0.82rem;color:var(--muted);margin-top:8px;">
            Est. pay: <strong style="color:var(--amber);">R${pay.toFixed(0)}</strong>
          </div>` : ''}
        </div>

        <!-- Note for this day -->
        <div style="margin-top:12px;">
          <input class="inp" placeholder="Note for this day (optional)…"
            value="${esc(day.note||'')}"
            oninput="updateCalNote(${off},'${key}',this.value)"
            style="font-size:0.85rem;">
        </div>

        <!-- Delete this day's entry -->
        ${getCalendar()[key] ? `
        <button class="btn btn-ghost btn-sm" onclick="deleteDay('${key}')"
          style="margin-top:10px;color:var(--red);border-color:rgba(255,77,77,0.2);">
          🗑 Clear this day
        </button>` : ''}
      </div>
    </div>`;
  }

  // Start live counter ticker
  startLiveTicker();
}

// ── LIVE PAY TICKER ────────────────────────────────────────────────────────────
let liveTicker = null;
function startLiveTicker() {
  if (liveTicker) clearInterval(liveTicker);
  liveTicker = setInterval(() => {
    const el = document.getElementById('live-pay');
    if (!el) { clearInterval(liveTicker); return; }
    const now  = new Date();
    const day  = getDay(now);
    if (!day.work) return;
    const sh   = parseFloat(day.start);
    const eh   = parseFloat(day.end);
    const curH = now.getHours() + now.getMinutes()/60 + now.getSeconds()/3600;
    if (curH < sh || curH >= eh) return;
    el.textContent = 'R' + ((curH - sh) * getRate()).toFixed(2);
  }, 5000);
}

// ── CALENDAR MUTATIONS ─────────────────────────────────────────────────────────
function toggleCalDay(off, key) {
  const day  = getDay(new Date(key + 'T12:00:00'));
  day.work   = !day.work;
  saveDay(new Date(key + 'T12:00:00'), day);
  renderCalendar(); renderPredictions();
}

function updateCalTime(off, key, field, val) {
  const day    = getDay(new Date(key + 'T12:00:00'));
  day[field]   = val;
  day.work     = true;
  saveDay(new Date(key + 'T12:00:00'), day);
  renderCalendar(); renderPredictions();
}

function updateCalNote(off, key, val) {
  const day  = getDay(new Date(key + 'T12:00:00'));
  day.note   = val;
  saveDay(new Date(key + 'T12:00:00'), day);
}

function applyPreset(off, key, start, end) {
  const day  = getDay(new Date(key + 'T12:00:00'));
  day.start  = start; day.end = end; day.work = true;
  saveDay(new Date(key + 'T12:00:00'), day);
  renderCalendar(); renderPredictions();
}

function toggleTTDay(off) {
  const el   = document.getElementById('tt-day-' + off);
  const open = el.classList.contains('open');
  document.querySelectorAll('.tt-day').forEach(d => d.classList.remove('open'));
  if (!open) el.classList.add('open');
}

// ── PREDICTION ENGINE ─────────────────────────────────────────────────────────
function renderPredictions() {
  const predWrap = document.getElementById('predictions-wrap');
  if (!predWrap || !fcWrap) return;

  const now    = new Date();
  const rate   = getRate();
  const curH   = now.getHours() + now.getMinutes()/60;
  const days   = getViewDays();
  const preds  = [];
  const fc     = [];
  let wkPay=0, wkHrs=0, wkDays=0;

  for (let off = 0; off < Math.min(days, 7); off++) {
    const date  = addDays(now, off);
    const day   = getDay(date);
    const lbl   = dayLabel(date, off);
    const hrs   = day.work ? shiftHrs(day.start, day.end) : 0;
    const pay   = hrs * rate;
    if (day.work) { wkPay += pay; wkHrs += hrs; wkDays++; }

    if (off === 0) {
      if (!day.work) {
        preds.push({ type:'green', icon:'😎',
          title: 'Day off today — do your thing',
          sub: 'No work. Sort your life, handle errands, whatever you need.'
        });
        _beerOnDayOff(now, curH, preds, getDay(addDays(now,1)));
      } else {
        const sh = parseFloat(day.start), eh = parseFloat(day.end);
        if (curH < sh) {
          const left = Math.round((sh - curH) * 60);
          preds.push({ type:'green', icon:'⏰',
            title: `Shift in ${fmtMins(left)}`,
            sub: `Clock in at ${day.start}, out at ${day.end}. ${hrs.toFixed(1)}h, about R${pay.toFixed(0)} today.`
          });
          if (left <= 60) preds.push({ type:'amber', icon:'⚡',
            title: 'Boss, get moving — less than an hour!',
            sub: "Eat something, grab your stuff, sort transport. Don't be late."
          });
          if (sh >= 16 && curH < 14) preds.push({ type:'beer', icon:'🍺',
            title: 'Afternoon free — go grab a cold one',
            sub: `Shift only at ${day.start}. Head out now, be back by ${p2(sh-1|0)}:30.`
          });
          if (sh >= 20 && curH < 17) preds.push({ type:'beer', icon:'🍺',
            title: 'Late shift tonight — go grab a beer first',
            sub: `Plenty of afternoon. Drink responsibly, shift ends at ${day.end}.`
          });
        } else if (curH >= sh && curH < eh) {
          const mLeft   = Math.round((eh - curH) * 60);
          const earned  = ((curH - sh) * rate).toFixed(0);
          preds.push({ type:'green', icon:'✔',
            title: `On shift — ${fmtMins(mLeft)} to go`,
            sub: `You've stacked R${earned} so far. Keep it up, boss.`
          });
        } else {
          preds.push({ type:'blue', icon:'✓',
            title: 'Shift done! Go rest, boss',
            sub: `${hrs.toFixed(1)}h of work, roughly R${pay.toFixed(0)} earned. You deserve to chill.`
          });
          _beerAfterShift(curH, preds, pay);
        }
        _taskSuggestions(day, curH, preds);
      }
    }

    if (off === 1 && day.work) {
      preds.push({ type:'blue', icon:'📅',
        title: `Tomorrow: ${day.start} – ${day.end}`,
        sub: `${dayLabel(date,1)}, ${hrs.toFixed(1)}h, est. R${pay.toFixed(0)}.${day.note?' Note: '+day.note:''} Don't stay out too late tonight.`
      });
      if (!getDay(now).work) preds.push({ type:'amber', icon:'⚠',
        title: `Work tomorrow at ${day.start}`,
        sub: "You're off today. Get to bed on time tonight."
      });
    }
  }

  if (wkHrs > 0) {
    preds.push({ type:'blue', icon:'📊',
      title: `${days}-day forecast: R${wkPay.toFixed(0)} across ${wkDays} shift${wkDays!==1?'s':''}`,
      sub: `${wkHrs.toFixed(0)} hours total. ${wkHrs>=40?'Solid week!':wkHrs>=30?'Good week.':'Light — maybe pick up extra if you can.'}`
    });
  }

  const colMap = { green:'green', amber:'amber', blue:'blue', red:'red', beer:'beer' };
  predWrap.innerHTML = preds.length
    ? preds.map(p => `
      <div class="pred-item">
        <div class="pred-icon ${colMap[p.type]||'blue'}">${p.icon}</div>
        <div class="pred-text">
          <div class="pred-title ${colMap[p.type]||'blue'}">${p.title}</div>
          <div class="pred-sub">${p.sub}</div>
        </div>
      </div>`).join('')
    : '<p class="empty-msg">Add your shifts above and I\'ll tell you what\'s up</p>';

}

function _beerAfterShift(curH, preds, pay) {
  if (curH >= 14 && curH < 19) {
    preds.push({ type:'beer', icon:'🍺',
      title: `You earned it — go grab a cold one`,
      sub: `Shift's done, it's only ${p2(curH|0)}:${p2(Math.round((curH%1)*60))}. Plenty of afternoon left. Go chill, boss.`
    });
  }
  if (pay >= 150) {
    preds.push({ type:'amber', icon:'💰',
      title: `Good shift — save some of that`,
      sub: `R${pay.toFixed(0)} today. Put away at least R${Math.round(pay*0.2)} before you spend anything.`
    });
  }
}

function _beerOnDayOff(now, curH, preds, tomorrow) {
  if (curH >= 14 && curH < 20) {
    const tmrw = tomorrow.work ? `— back home by 22:00, shift tomorrow at ${tomorrow.start}` : '';
    preds.push({ type:'beer', icon:'🍺',
      title: 'Day off at a good time — go grab a beer bro',
      sub: `It's ${p2(now.getHours())}:${p2(now.getMinutes())}. Go enjoy yourself ${tmrw}.`
    });
  }
  if (curH >= 11 && curH < 14) {
    preds.push({ type:'beer', icon:'🍺',
      title: 'Lunchtime and you\'re off — go chill',
      sub: 'Grab something to eat, sit with family, or just take it easy.'
    });
  }
}

function _taskSuggestions(day, curH, preds) {
  const tasks    = typeof getHomeTasks === 'function' ? getHomeTasks().filter(t => !t.done) : [];
  if (!tasks.length) return;
  const sh = parseFloat(day.start), eh = parseFloat(day.end);

  if (sh > 8 && curH < sh - 1) {
    const freeH   = +(sh - Math.max(6.5, curH)).toFixed(1);
    const mtasks  = tasks.filter(t => t.time==='morning' || (!t.time && t.bestTime==='morning'));
    const mins    = mtasks.reduce((a,t) => a+(t.duration||0), 0);
    if (mtasks.length && freeH >= 1) {
      preds.push({ type: mins <= freeH*60 ? 'green' : 'amber', icon:'🌅',
        title: mins <= freeH*60
          ? `${freeH}h free — can knock out ${mtasks.length} task${mtasks.length>1?'s':''} before work`
          : `${freeH}h before shift — time for some tasks`,
        sub: mtasks.slice(0,3).map(t=>(t.emoji||'')+''+t.text).join(', ') + `. ~${mins}min total.`
      });
    }
  }

  const freeEve = +(22 - eh).toFixed(0);
  if (freeEve >= 2 && curH < eh) {
    const etasks = tasks.filter(t => t.time==='evening' || t.time==='afternoon' || (!t.time && (t.bestTime==='evening'||t.bestTime==='afternoon')));
    if (etasks.length) preds.push({ type:'blue', icon:'🌙',
      title: `After shift: ${etasks.length} task${etasks.length>1?'s':''} lined up`,
      sub: etasks.slice(0,3).map(t=>(t.emoji||'')+' '+t.text).join(', ')+`. ${freeEve}h free after ${day.end}.`
    });
  }
}

function initSchedule() {
  const rateEl = document.getElementById('tt-rate');
  const saved  = S.get('tt-rate'); if (rateEl && saved) rateEl.value = saved;
  renderCalendar();
  renderPredictions();
  // Refresh predictions every 5 min
  setInterval(() => {
    if (document.getElementById('page-schedule')?.classList.contains('active')) renderPredictions();
  }, 300000);
}
