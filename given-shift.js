// given-shift.js — clock in/out, history

let shiftTimer = null;
let shiftStart = S.get('sh-start', null);

function getRate() { return parseFloat(document.getElementById('sh-rate')?.value) || parseFloat(S.get('sh-rate',25)) || 25; }
function elapsedSecs() { return shiftStart ? Math.floor((Date.now()-shiftStart)/1000) : 0; }

function updateShiftUI() {
  const secs = elapsedSecs(), rate = getRate();
  const h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60);
  const el = id => document.getElementById(id);
  if(el('sh-timer'))  el('sh-timer').textContent  = fmtSecs(secs);
  if(el('sh-earned')) el('sh-earned').textContent = 'R'+(secs/3600*rate).toFixed(2);
  if(el('td-hours'))  el('td-hours').textContent  = h+'h'+(m?' '+m+'m':'');

  const hist    = S.get('sh-hist',[]);
  const weekSecs= hist.filter(r=>Date.now()-new Date(r.date).getTime()<7*864e5).reduce((a,r)=>a+r.secs,0)+secs;
  const weekPay = weekSecs/3600*rate;
  if(el('wk-pay'))  el('wk-pay').textContent  = 'R'+weekPay.toFixed(2);
  if(el('wk-hrs'))  el('wk-hrs').textContent  = Math.floor(weekSecs/3600)+'h '+Math.floor((weekSecs%3600)/60)+'m';
  if(el('td-pay'))  el('td-pay').textContent  = 'R'+Math.floor(weekPay);
}

function toggleShift() {
  const el = id => document.getElementById(id);
  if (!shiftStart) {
    shiftStart = Date.now(); S.set('sh-start', shiftStart);
    el('sh-dot')?.classList.add('on');
    if(el('sh-status-txt')){ el('sh-status-txt').textContent='ON SHIFT'; el('sh-status-txt').style.color='var(--neon)'; }
    if(el('sh-in')) el('sh-in').textContent = fmtTime(shiftStart);
    if(el('sh-sub')) el('sh-sub').textContent = "You're on the clock. Stack that paper, boss 💪";
    if(el('sh-btn')){ el('sh-btn').textContent='Clock Out'; el('sh-btn').className='btn btn-danger'; }
    if(el('td-shift')) el('td-shift').textContent='ON';
    shiftTimer = setInterval(updateShiftUI, 1000);
  } else {
    const secs=elapsedSecs(), rate=getRate(), pay=(secs/3600*rate).toFixed(2);
    const hist=S.get('sh-hist',[]);
    hist.unshift({date:new Date().toDateString(),secs,pay:parseFloat(pay)});
    if(hist.length>30)hist.pop();
    S.set('sh-hist',hist); shiftStart=null; S.set('sh-start',null);
    clearInterval(shiftTimer);
    el('sh-dot')?.classList.remove('on');
    if(el('sh-status-txt')){ el('sh-status-txt').textContent='OFFLINE'; el('sh-status-txt').style.color='var(--muted)'; }
    if(el('sh-timer')) el('sh-timer').textContent='00:00:00';
    if(el('sh-in')) el('sh-in').textContent='--:--';
    if(el('sh-earned')) el('sh-earned').textContent='R0.00';
    if(el('sh-sub')) el('sh-sub').textContent=`Done, boss! You earned R${pay} today 🙌 Go rest bro.`;
    if(el('sh-btn')){ el('sh-btn').textContent='Clock In'; el('sh-btn').className='btn btn-neon'; }
    if(el('td-shift')) el('td-shift').textContent='OFF';
    renderShiftHistory(); updateShiftUI();
  }
}

function renderShiftHistory() {
  const hist=S.get('sh-hist',[]), el=document.getElementById('sh-history');
  if(!el) return;
  if(!hist.length){ el.innerHTML='<p class="empty-msg">No shifts logged yet bro</p>'; return; }
  el.innerHTML = hist.map(r => {
    const h=Math.floor(r.secs/3600), m=Math.floor((r.secs%3600)/60);
    return `<div class="history-row">
      <span class="history-date">${r.date}</span>
      <span style="color:var(--muted);font-size:0.8rem;">${h}h ${m}m</span>
      <span class="history-pay">R${r.pay.toFixed(2)}</span>
    </div>`;
  }).join('');
}

function clearShiftHistory() {
  if(!confirm('Clear all shift history?')) return;
  S.set('sh-hist',[]); renderShiftHistory(); updateShiftUI();
}

function initShift() {
  const rateEl=document.getElementById('sh-rate');
  const saved=S.get('sh-rate'); if(rateEl&&saved) rateEl.value=saved;
  if(shiftStart) {
    const el=id=>document.getElementById(id);
    el('sh-dot')?.classList.add('on');
    if(el('sh-status-txt')){ el('sh-status-txt').textContent='ON SHIFT'; el('sh-status-txt').style.color='var(--neon)'; }
    if(el('sh-in')) el('sh-in').textContent=fmtTime(shiftStart);
    if(el('sh-btn')){ el('sh-btn').textContent='Clock Out'; el('sh-btn').className='btn btn-danger'; }
    if(el('td-shift')) el('td-shift').textContent='ON';
    shiftTimer=setInterval(updateShiftUI,1000);
  }
  renderShiftHistory();
  updateShiftUI();
}
