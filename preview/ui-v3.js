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
function preview(){
 const groups=SECTIONS.map((s,k)=>{
 const start=s.start,end=k+1<SECTIONS.length?SECTIONS[k+1].start:TOTAL;
 return {title:nm(s.sec).trim(),seconds:Math.max(0,end-start),sec:s.sec};
 });
 shell.innerHTML='<div class="opl-frame"><div class="opl-head"><span class="opl-brand">OWN PACE LAB</span><button class="opl-icon" id="opl-settings" aria-label="소리 설정">소리 ⚙</button></div><div class="opl-toprow"><button id="opl-back">← 수업 목록</button><span class="opl-muted" style="margin:0">수업 구성</span></div><h1>'+esc(LESSON_META.name||'복싱 수업')+'</h1><p class="opl-muted">검수된 수업 데이터를 그대로 불러옵니다.</p><div class="opl-total">'+fmtLocal(TOTAL)+'</div><div class="opl-items">'+groups.map((g,k)=>'<div class="opl-item"><span class="opl-dot"></span><span><strong>'+esc(g.title)+'</strong><small>'+esc((PLAN.find(x=>x.sec===g.sec)||{}).move||'')+'</small></span><time>'+fmtLocal(g.seconds)+'</time></div>').join('')+'</div><button class="opl-action" id="opl-start">▶ 수업 시작</button><p class="opl-footnote">시작 전 블루투스 스피커·종소리·외부 음악 앱을 확인하세요.</p></div>';
 el('opl-back').onclick=()=>{page='home';renderShell()};
 el('opl-settings').onclick=()=>soundSettings();
 el('opl-start').onclick=()=>{
  shell.hidden=true;
  if(!started&&!running) el('go').click();
  else if(!running)el('go').click();
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
