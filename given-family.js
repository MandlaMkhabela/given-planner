// given-family.js

function toggleAddFam() {
  const f=document.getElementById('fam-add-form');
  f.style.display=f.style.display==='none'?'block':'none';
}

function renderFamily() {
  const members=S.get('fam-members',[]), el=document.getElementById('fam-list');
  if(!el) return;
  if(!members.length){ el.innerHTML='<p class="empty-msg">Add your people — family, friends, whoever matters</p>'; return; }
  el.innerHTML=members.map((m,i)=>`
    <div class="fam-card">
      <div class="fam-hdr">
        <div class="fam-emo">${esc(m.emoji||'👤')}</div>
        <div><div class="fam-nm">${esc(m.name)}</div><div class="fam-role">${esc(m.role||'')}</div></div>
        <button class="fam-del" onclick="delFam(${i})">✕</button>
      </div>
      <textarea class="inp" rows="2" placeholder="Notes, reminders, anything about them…"
        oninput="saveFamNote(${i},this.value)">${esc(m.note||'')}</textarea>
    </div>`).join('');
}

function addFamMember() {
  const name=document.getElementById('fam-name-inp').value.trim();
  if(!name) return;
  const members=S.get('fam-members',[]);
  members.push({
    name,
    role:document.getElementById('fam-role-inp').value.trim(),
    emoji:document.getElementById('fam-emoji-inp').value.trim()||'👤',
    note:''
  });
  S.set('fam-members',members);
  ['fam-name-inp','fam-role-inp','fam-emoji-inp'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('fam-add-form').style.display='none';
  renderFamily();
}

function delFam(i){if(!confirm('Remove?'))return;const m=S.get('fam-members',[]);m.splice(i,1);S.set('fam-members',m);renderFamily();}
function saveFamNote(i,v){const m=S.get('fam-members',[]);if(m[i])m[i].note=v;S.set('fam-members',m);}
