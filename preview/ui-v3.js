/* Own Pace LAB coach shell. Keeps the existing engine, lesson JSON and bell audio intact. */
(function(){
'use strict';
const doc=document;
const el=id=>doc.getElementById(id);
const shell=doc.createElement('div');
shell.id='opl-shell';
shell.setAttribute('role','region');
shell.setAttribute('aria-label','수업 선택');
doc.body.appendChild(shell);
let page='home';
let returnPage='home';
const fmtLocal=s=>{s=Math.max(0,Math.round(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isArchive=l=>/지난 버전|이전|초안/.test(l.name||'');
function card(l){return '<button class="opl-card '+(l.id===LESSON?'selected':'')+'" data-lesson="'+esc(l.id)+'"><span class="opl-card-text"><strong>'+esc(l.name)+'</strong><small>'+(l.id===LESSON?'현재 선택한 수업':'수업 불러오기')+'</small></span><span class="opl-arrow" aria-hidden="true">›</span></button>'}
function home(){
 const current=IDX.lessons.filter(l=>!isArchive(l));
 const old=IDX.lessons.filter(isArchive);
 shell.innerHTML='<div class="opl-frame"><div class="opl-head"><span class="opl-brand">OWN PACE LAB</span><button class="opl-icon" id="opl-settings" aria-label="소리 설정">소리 ⚙</button></div><h1>오늘 수업</h1><p class="opl-muted">수업을 선택하고 시작하세요.</p>'+
 current.map(card).join('')+
 (old.length?'<details style="margin-top:12px"><summary style="color:#aebaae;font-size:13px;cursor:pointer;padding:12px 0">이전 수업 보기</summary>'+old.map(card).join('')+'</details>':'')+
 '</div>';
 shell.querySelectorAll('[data-lesson]').forEach(b=>b.addEventListener('click',()=>selectLesson(b.dataset.lesson)));
 el('opl-settings').addEventListener('click',()=>soundSettings());
}
function selectLesson(id){
 if(id!==LESSON){
   if(running){ alert('수업을 멈춘 뒤 변경해 주세요.');return; }
   try{localStorage.setItem('ownpace-preview-lesson',id);localStorage.removeItem('ownpace-preview-timer')}catch(e){}
   location.reload();return;
 }
 page='preview';renderShell();
}
function mode(values){const ct=new Map();for(const v of values)ct.set(v,(ct.get(v)||0)+1);return [...ct].sort((a,b)=>b[1]-a[1])[0]?.[0]||0}
function sectionDetails(sec,index){
  const end=index+1<SECTIONS.length?SECTIONS[index+1].start:TOTAL;
  const items=PLAN.filter(s=>s.sec===sec.sec);
  const rounds=new Set(items.filter(s=>s.rd&&s.type!=='rest'&&s.type!=='talk').map(s=>s.rd));
  const work=items.filter(s=>['base','up','finish','work'].includes(s.type));
  const rest=items.filter(s=>s.type==='rest');
  const talk=items.filter(s=>s.type==='talk');
  const w=mode(work.map(s=>s.dur)),r=mode(rest.map(s=>s.dur));
  const meta=[];
  if(rounds.size)meta.push(rounds.size+'라운드');
  else if(work.length)meta.push('운동 '+work.length+'동작');
  if(w)meta.push('운동 '+fmtLocal(w));
  if(r)meta.push('휴식 '+fmtLocal(r));
  if(talk.length)meta.push('설명 '+fmtLocal(talk.reduce((sum,s)=>sum+s.dur,0)));
  if(!meta.length)meta.push('구간 '+items.length+'단계');
  return {title:nm(sec.sec).trim(),seconds:Math.max(0,end-sec.start),sec:sec.sec,items,meta:meta.join(' · ')};
}
function preview(){
 const groups=SECTIONS.map(sectionDetails);
 shell.innerHTML='<div class="opl-frame"><div class="opl-head"><span class="opl-brand">OWN PACE LAB</span><button class="opl-icon" id="opl-settings" aria-label="소리 설정">소리 설정</button></div><div class="opl-toprow"><button id="opl-back">← 수업 선택</button><span class="opl-muted" style="margin:0">수업 구성</span></div><h1>'+esc(LESSON_META.name||'복싱 수업')+'</h1><div class="opl-total-row"><span>전체 수업</span><strong>'+fmtLocal(TOTAL)+'</strong></div><p class="opl-muted">구간을 누르면 세부 동작과 시간을 볼 수 있어요.</p><div class="opl-items">'+groups.map(g=>
  '<details class="opl-detail"><summary><span class="opl-dot"></span><span class="opl-summary-main"><strong>'+esc(g.title)+'</strong><small>'+esc(g.meta)+'</small></span><time>'+fmtLocal(g.seconds)+'</time><span class="opl-expand">⌄</span></summary><div class="opl-step-list">'+g.items.map((s,j)=>
  '<div class="opl-step"><span>'+esc(s.move||s.tag||('동작 '+(j+1)))+'</span><small>'+esc(s.type==='rest'?'휴식':s.type==='talk'?'안내':'운동')+'</small><time>'+fmtLocal(s.dur)+'</time></div>').join('')+'</div></details>'
 ).join('')+'</div><div class="opl-bottom"><button class="opl-action" id="opl-start">▶ 수업 시작</button><button class="opl-sound-test" id="opl-test-bell">종소리 테스트 🔔</button><p class="opl-footnote">수업 전 종소리를 확인하세요. 음악 파일을 별도로 넣을 필요는 없어요.</p></div></div>';
 el('opl-back').onclick=()=>{page='home';renderShell()};
 el('opl-settings').onclick=()=>soundSettings();
 el('opl-test-bell').onclick=()=>{sound=true;unlockAudio(['bell']);bell();};
 el('opl-start').onclick=()=>{
  // Run the original timer and bell engine inside the user's button gesture.
  shell.hidden=true;
  if(!running)el('go').click();
 };
}
function soundSettings(){
 returnPage=page;
 shell.hidden=true;
 openMenu();
 el('menu').classList.add('opl-sound-only');
}
function renderShell(){
 shell.hidden=false;
 if(page==='home')home();
 else preview();
}
const menuClose=el('close');
menuClose.addEventListener('click',()=>{
 const wasSound=el('menu').classList.contains('opl-sound-only');
 el('menu').classList.remove('opl-sound-only');
 if(wasSound&&!started){page=returnPage;renderShell()}
});
const originalOpen=el('list').onclick;
if(typeof originalOpen==='function')el('list').onclick=function(e){el('menu').classList.remove('opl-sound-only');return originalOpen.call(this,e)};
if(started){shell.hidden=true}
else renderShell();
// Make the existing main-screen footer a clear, thumb-friendly set of actions.
el('prev').setAttribute('aria-label','이전 구간');
el('nextBtn').setAttribute('aria-label','다음 구간');
el('list').setAttribute('aria-label','수업 흐름 및 설정');
// Keep audio-mode choices explicit: another app's music volume is not directly controlled by the browser.
})();
