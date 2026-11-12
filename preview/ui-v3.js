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
 shell.innerHTML='<div class="opl-frame"><div class="opl-head"><span class="opl-brand">OWN PACE LAB</span><button class="opl-icon" id="opl-settings">소리</button></div><div class="opl-toprow"><button id="opl-back">← 수업 선택</button><span class="opl-muted" style="margin:0">수업 구성</span></div><h1>'+esc(LESSON_META.name||'복싱 수업')+'</h1><div class="opl-total-row"><span>전체 수업</span><strong>'+fmtLocal(TOTAL)+'</strong></div><div class="opl-flat-list">'+groups.map((g,k)=>
 '<div class="opl-flat-group"><div class="opl-flat-row"><span class="opl-flat-index">'+String(k+1).padStart(2,'0')+'</span><span class="opl-flat-body"><strong>'+esc(g.title)+'</strong><small>'+esc(g.meta)+'</small></span><time>'+fmtLocal(g.seconds)+'</time></div></div>'
 ).join('')+'</div><button class="opl-text-btn" id="opl-detail-toggle" aria-expanded="false">세부 동작 보기 ⌄</button><div class="opl-detail-all" id="opl-detail-all" hidden>'+groups.map(g=>
 '<section class="opl-detail-section"><strong>'+esc(g.title)+'</strong>'+g.items.map(s=>'<div class="opl-flat-step"><span>'+esc(s.move||s.tag||'운동')+'</span><time>'+fmtLocal(s.dur)+'</time></div>').join('')+'</section>').join('')+'</div><div class="opl-bottom"><button class="opl-action" id="opl-start">수업 시작</button><button class="opl-quiet-action" id="opl-sound-check">종소리 확인</button></div></div>';
 el('opl-back').onclick=()=>{page='home';renderShell()};
 el('opl-settings').onclick=()=>soundSettings();
 el('opl-detail-toggle').onclick=()=>{const target=el('opl-detail-all'),show=target.hidden;target.hidden=!show;el('opl-detail-toggle').textContent=show?'세부 동작 닫기 ⌃':'세부 동작 보기 ⌄';el('opl-detail-toggle').setAttribute('aria-expanded',String(show))};
 el('opl-sound-check').onclick=()=>testBell();
 el('opl-start').onclick=()=>{shell.hidden=true;if(!running)el('go').click()};
}
function testBell(){
 sound=true;
 setLabels();
 unlockAudio(['bell']);
 bell();
 const msg=el('opl-sound-result');
 if(msg)msg.textContent='종소리가 안 들리면 기기 미디어 음량·무음 모드를 확인하세요.';
}
function soundSettings(){returnPage=page;page='sound';renderShell()}
function settingRow(id,title,sub,enabled){
 return '<div class="opl-setting"><div><strong>'+title+'</strong>'+(sub?'<small>'+sub+'</small>':'')+'</div><button class="opl-switch '+(enabled?'on':'')+'" data-set="'+id+'" aria-pressed="'+enabled+'">'+(enabled?'켜짐':'꺼짐')+'</button></div>';
}
function soundPage(){
 shell.innerHTML='<div class="opl-frame"><div class="opl-head"><span class="opl-brand">OWN PACE LAB</span></div><div class="opl-toprow"><button id="opl-back">← 돌아가기</button></div><h1>소리</h1><p class="opl-muted">수업을 시작하기 전에 종소리를 확인하세요.</p><div class="opl-settings">'+settingRow('snd','복싱 종소리','라운드 전환과 종료',sound)+settingRow('voice','한국어 음성','다음 동작 안내',voiceOn)+settingRow('mix','다른 앱 음악과 함께','음악은 별도 앱에서 재생',mixMode)+settingRow('duck','휴식 중 음악 줄이기','일부 아이폰에서만 작동 · 실험 기능',duckOn)+'</div><button class="opl-action" id="opl-try-bell">종소리 듣기</button><p class="opl-footnote" id="opl-sound-result">음악을 틀지 않은 상태에서도 종소리가 나야 정상입니다.</p><button class="opl-quiet-action" id="opl-finish">확인</button></div>';
 el('opl-back').onclick=el('opl-finish').onclick=()=>{page=returnPage;renderShell()};
 el('opl-try-bell').onclick=()=>testBell();
 shell.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>{el(b.dataset.set).click();soundPage()});
}
function renderShell(){
 shell.hidden=false;
 if(page==='home')home();
 else if(page==='sound')soundPage();
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
