// given-app.js — bootstrap, nav, date

// Date line
(()=>{
  const n=new Date();
  const D=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('date-line').textContent=
    `${D[n.getDay()]} ${n.getDate()} ${M[n.getMonth()]} — ${p2(n.getHours())}:${p2(n.getMinutes())}`;
})();

// Nav
function go(name) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab,.bb').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+name)?.classList.add('active');
  document.getElementById('bb-'+name)?.classList.add('active');
  document.querySelectorAll('.tab').forEach(t=>{
    if(t.getAttribute('onclick')?.includes("'"+name+"'")) t.classList.add('active');
  });
  if(name==='today') { renderPriorities(); renderHomeTasks(); updateShiftUI(); }
  if(name==='schedule') renderPredictions();
}

// Init all modules
initShift();
initSchedule();
initToday();
renderFamily();
renderHomeTasks();
renderBills();
initPlans();
initNotes();
