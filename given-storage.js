// given-storage.js

const S = {
  get: (k, d=null) => { const v=localStorage.getItem('gv_'+k); if(v===null)return d; try{return JSON.parse(v);}catch{return v;} },
  set: (k, v) => localStorage.setItem('gv_'+k, typeof v==='object'?JSON.stringify(v):v)
};

function p2(n) { return String(n).padStart(2,'0'); }
function fmtSecs(s) { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60; return `${p2(h)}:${p2(m)}:${p2(ss)}`; }
function fmtTime(ts) { const d=new Date(ts); return `${p2(d.getHours())}:${p2(d.getMinutes())}`; }
function fmtMins(m) { if(m<60)return m+' min'; return Math.floor(m/60)+'h'+(m%60?' '+m%60+'min':''); }
function shiftHrs(start,end) {
  if(!start||!end)return 0;
  const [sh,sm]=start.split(':').map(Number),[eh,em]=end.split(':').map(Number);
  let mins=(eh*60+em)-(sh*60+sm); if(mins<0)mins+=1440; return mins/60;
}
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const DAYS_SHORT=['MON','TUE','WED','THU','FRI','SAT','SUN'];
const DAYS_FULL=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const JS_TO_IDX={1:0,2:1,3:2,4:3,5:4,6:5,0:6};
function todayDayIdx(){return JS_TO_IDX[new Date().getDay()];}
