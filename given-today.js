// given-today.js

function renderPriorities() {
  const items=S.get('priorities',[]), el=document.getElementById('priority-list');
  if(!el) return;
  if(!items.length){ el.innerHTML='<p class="empty-msg">Nothing set yet — what\'s the plan today?</p>'; return; }
  el.innerHTML=items.map((it,i)=>`
    <div class="cl-item${it.done?' done':''}" onclick="toggleP(${i})">
      <div class="ckbox">${it.done?'✓':''}</div>
      <span>${esc(it.text)}</span>
      <button class="cl-del" onclick="event.stopPropagation();delP(${i})">×</button>
    </div>`).join('');
  const left=items.filter(i=>!i.done).length;
  const el2=document.getElementById('td-tasks'); if(el2) el2.textContent=left;
}
function addPriority() {
  const inp=document.getElementById('priority-inp'), t=inp.value.trim(); if(!t) return;
  const items=S.get('priorities',[]);
  if(items.length>=3){ inp.placeholder='Max 3 priorities!'; setTimeout(()=>inp.placeholder='Add a priority…',2000); return; }
  items.push({text:t,done:false}); S.set('priorities',items); inp.value=''; renderPriorities();
}
function toggleP(i){const a=S.get('priorities',[]);a[i].done=!a[i].done;S.set('priorities',a);renderPriorities();}
function delP(i){const a=S.get('priorities',[]);a.splice(i,1);S.set('priorities',a);renderPriorities();}

function initToday() {
  const mn=document.getElementById('morning-note');
  const v=S.get('morning-note'); if(mn&&v) mn.value=v;
  renderPriorities();
}
