// given-plans.js — goals, savings, gratitude

const PLAN_COLS={money:'c-amber',family:'c-blue',work:'c-green',health:'c-pink',self:'c-neon2'};
const PLAN_LBLS={money:'💰 Money',family:'👨‍👧 Family',work:'💼 Work',health:'💪 Health',self:'🌱 Self'};
const PLAN_ORDER=['this week','this month','1 month','2 months','3 months','6 months','1 year','2 years','5 years','life goal'];

function renderPlans() {
  const plans=S.get('plans',[]), el=document.getElementById('plans-list');
  if(!el) return;
  if(!plans.length){ el.innerHTML='<p class="empty-msg">What do you want from life? Write it down.</p>'; return; }
  const sorted=[...plans.entries()].sort((a,b)=>PLAN_ORDER.indexOf(a[1].when)-PLAN_ORDER.indexOf(b[1].when));
  el.innerHTML=sorted.map(([origIdx,p])=>`
    <div class="plan-item${p.done?' done':''}">
      <div class="plan-done" onclick="togglePlan(${origIdx})">${p.done?'✓':''}</div>
      <div class="plan-left">
        <span class="plan-text">${esc(p.text)}</span>
        <div class="plan-meta">
          <span class="plan-tag ${PLAN_COLS[p.cat]||'c-muted'}">${PLAN_LBLS[p.cat]||p.cat}</span>
          <span class="plan-when">${p.when}</span>
        </div>
      </div>
      <button class="cl-del" onclick="delPlan(${origIdx})">×</button>
    </div>`).join('');
}
function addPlan(){
  const text=document.getElementById('plan-text-inp').value.trim(); if(!text)return;
  const plans=S.get('plans',[]);
  plans.push({text,cat:document.getElementById('plan-cat-inp').value,when:document.getElementById('plan-when-inp').value,done:false});
  S.set('plans',plans); document.getElementById('plan-text-inp').value=''; renderPlans();
}
function togglePlan(i){const a=S.get('plans',[]);a[i].done=!a[i].done;S.set('plans',a);renderPlans();}
function delPlan(i){const a=S.get('plans',[]);a.splice(i,1);S.set('plans',a);renderPlans();}

function updateSavBar() {
  const target=parseFloat(document.getElementById('sav-target')?.value)||0;
  const current=parseFloat(document.getElementById('sav-current')?.value)||0;
  const pct=target>0?Math.min(100,Math.round(current/target*100)):0;
  const fill=document.getElementById('sav-fill'); if(fill) fill.style.width=pct+'%';
  const pctEl=document.getElementById('sav-pct'); if(pctEl) pctEl.textContent=pct+'%';
  const leftEl=document.getElementById('sav-left'); if(leftEl) leftEl.textContent='R'+Math.max(0,target-current).toFixed(0)+' to go';
}

function initPlans() {
  const fields=[['sav-target','sav-target'],['sav-current','sav-current'],['gratitude','gratitude']];
  fields.forEach(([id,key])=>{const el=document.getElementById(id),v=S.get(key);if(el&&v!==null)el.value=v;});
  renderPlans(); updateSavBar();
}
