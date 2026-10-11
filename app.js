'use strict';
const KEY='health65.entries.v1', SETTINGS='health65.settings.v1';
const $=id=>document.getElementById(id);
const localDay=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
let entries=safeRead(KEY,{}),settings=safeRead(SETTINGS,{start:80,goal:65});
const weekdays=['日','月','火','水','木','金','土'];
const dayOf=date=>new Date(`${date}T12:00:00`).getDay();
const planFor=date=>{const d=dayOf(date),golf=d>=1&&d<=5,strength=d===2||d===5;const dinners=['鶏鍋＋豆腐','焼き鳥5本＋サラダ','赤身焼肉300g＋野菜','焼き鳥5本＋冷奴','豚しゃぶ＋野菜','赤身焼肉300g＋野菜','焼き鳥5本＋サラダ'];return [{emoji:'⛳',title:'ゴルフ',detail:golf?'打ちっぱなし60分。最初は軽くスイング':'練習休養日。散歩やストレッチで調整'},{emoji:'🚶',title:'ウォーキング',detail:'7,000〜10,000歩。余裕があれば早歩き10〜15分'},{emoji:'💪',title:'筋トレ',detail:strength?'15〜20分：椅子スクワット・壁腕立て・バードドッグ・かかと上げ・肩甲骨寄せ':'今日は休養。肩や股関節を軽く動かす'},{emoji:'🍜',title:'食事とビール',detail:`昼は豚骨ラーメン（スープは半分残す目標）。夜は${dinners[d]}。ビールは2本を目標`}];};
const num=id=>{const s=$(id).value.trim();return s===''?null:Number(s)};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderPlan(){const date=$('entryDate').value||localDay();$('dayBadge').textContent=weekdays[dayOf(date)]+'曜日';$('planCards').innerHTML=planFor(date).map(p=>`<div class="plan-card"><span class="emoji">${p.emoji}</span><div><strong>${p.title}</strong><p>${p.detail}</p></div></div>`).join('');}
function fillForm(){const e=entries[$('entryDate').value]||{};['weight','steps','golf','beer'].forEach(k=>$(k).value=e[k]??'');['strength','ramen','soup'].forEach(k=>$(k).checked=!!e[k]);$('dinner').value=e.dinner||'';$('memo').value=e.memo||'';$('saveMessage').textContent='';renderPlan();}
function save(){const date=$('entryDate').value;if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;const e={date,weight:num('weight'),steps:num('steps'),golf:num('golf'),beer:num('beer'),strength:$('strength').checked,ramen:$('ramen').checked,soup:$('soup').checked,dinner:$('dinner').value,memo:$('memo').value.trim()};if((e.weight!==null&&(e.weight<30||e.weight>250))||(e.steps!==null&&(e.steps<0||e.steps>100000))||(e.golf!==null&&(e.golf<0||e.golf>600))||(e.beer!==null&&(e.beer<0||e.beer>30))){$('saveMessage').textContent='入力値を確認してください';return;}entries[date]=e;localStorage.setItem(KEY,JSON.stringify(entries));$('saveMessage').textContent='✓ 保存しました';renderAll();}
function recentEntries(){return Object.values(entries).filter(e=>e&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)).sort((a,b)=>a.date.localeCompare(b.date));}
function renderHero(){const weighed=recentEntries().filter(e=>typeof e.weight==='number');const latest=weighed.at(-1)?.weight??settings.start;const denom=settings.start-settings.goal;const pct=denom>0?Math.max(0,Math.min(100,(settings.start-latest)/denom*100)):0;$('latestWeight').innerHTML=`${latest.toFixed(1)} <span>kg</span>`;$('progressFill').style.width=pct+'%';$('remaining').textContent=latest>settings.goal?`あと${(latest-settings.goal).toFixed(1)}kg`:'目標達成！';$('progressPct').textContent=`${Math.round(pct)}% 達成`;}
function renderHistory(){const all=recentEntries();$('historyList').innerHTML=all.length?all.slice(-20).reverse().map(e=>`<div class="history-row"><div><strong>${esc(e.date)}　${e.weight??'—'} kg</strong><p>歩数 ${e.steps??'—'} ／ ゴルフ ${e.golf??'—'}分 ／ ビール ${e.beer??'—'}本</p></div><span class="pill">${e.strength?'筋トレ✓':'記録'}</span></div>`).join(''):'<div class="panel muted">まだ記録がありません。</div>';renderChart(all.filter(e=>typeof e.weight==='number'));}
function renderChart(rows){const svg=$('weightChart');if(!rows.length){svg.style.display='none';$('chartEmpty').style.display='block';return;}svg.style.display='block';$('chartEmpty').style.display='none';const data=rows.slice(-35),values=data.map(e=>e.weight),avg=data.map((e,i)=>{const chunk=data.slice(Math.max(0,i-6),i+1);return chunk.reduce((s,x)=>s+x.weight,0)/chunk.length});const lo=Math.floor(Math.min(...values,...avg,settings.goal)-1),hi=Math.ceil(Math.max(...values,...avg,settings.start)+1),range=Math.max(1,hi-lo);const x=i=>30+(data.length===1?140:i*285/(data.length-1)),y=v=>166-(v-lo)/range*137;const line=arr=>arr.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');let out='';for(let i=0;i<=4;i++){const v=lo+range*i/4;out+=`<line class="gridline" x1="28" x2="324" y1="${y(v)}" y2="${y(v)}"/><text x="0" y="${y(v)+3}">${v.toFixed(0)}</text>`;}out+=`<path class="dotline" d="${line(values)}"/><path class="line" d="${line(avg)}"/>`;out+=values.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="3"/>`).join('');out+=`<text x="30" y="188">${data[0].date.slice(5)}</text><text x="275" y="188">${data.at(-1).date.slice(5)}</text>`;svg.innerHTML=out;}
function renderInsights(){const today=localDay(),start=new Date(`${today}T12:00:00`);start.setDate(start.getDate()-6);const first=`${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`;const a=recentEntries().filter(e=>e.date>=first&&e.date<=today);const weights=a.filter(e=>typeof e.weight==='number').map(e=>e.weight);const beers=a.filter(e=>typeof e.beer==='number').map(e=>e.beer);const avg=v=>v.length?(v.reduce((x,y)=>x+y,0)/v.length).toFixed(1):'—';const golf=a.filter(e=>e.golf>0).length,strength=a.filter(e=>e.strength).length,steps=a.filter(e=>e.steps>=7000).length;$('stats').innerHTML=[['平均体重',avg(weights)+' kg'],['ビール平均',avg(beers)+' 本'],['ゴルフ実施',golf+' 日'],['筋トレ実施',strength+' 日'],['7,000歩以上',steps+' 日'],['記録した日',a.length+' / 7']].map(([k,v])=>`<div class="stat"><small>${k}</small><strong>${v}</strong></div>`).join('');$('insightText').textContent=a.length?`直近7日間で${a.length}日記録しました。体重は単日の上下ではなく7日平均で判断しましょう。筋トレは週2回、ビールはまず1日2本以下を目標に。`:'最初の記録を入力すると、週間の集計が表示されます。';}
function renderAll(){renderHero();renderHistory();renderInsights();}
function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function csv(){const cols=['date','weight','steps','golf','strength','ramen','soup','dinner','beer','memo'];const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';const lines=[cols.join(','),...recentEntries().map(e=>cols.map(k=>quote(e[k])).join(','))];download('65kg-records.csv','\ufeff'+lines.join('\r\n'),'text/csv;charset=utf-8');}
function backup(){download('65kg-backup.json',JSON.stringify({version:1,settings,entries,workoutChecks},null,2),'application/json');}
function restore(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);if(data.version!==1||!data.entries||typeof data.entries!=='object'||Array.isArray(data.entries))throw Error('format');if(!confirm('現在の記録をバックアップ内容で置き換えますか？'))return;const clean={};for(const [k,v] of Object.entries(data.entries)){if(!/^\d{4}-\d{2}-\d{2}$/.test(k)||!v||typeof v!=='object')continue;clean[k]={date:k,weight:valid(v.weight,30,250),steps:valid(v.steps,0,100000),golf:valid(v.golf,0,600),beer:valid(v.beer,0,30),strength:!!v.strength,ramen:!!v.ramen,soup:!!v.soup,dinner:String(v.dinner||'').slice(0,100),memo:String(v.memo||'').slice(0,500)};}entries=clean;workoutChecks=(data.workoutChecks&&typeof data.workoutChecks==='object'&&!Array.isArray(data.workoutChecks))?data.workoutChecks:{};localStorage.setItem(WORKOUT_KEY,JSON.stringify(workoutChecks));renderWorkout();const s=data.settings||{};settings={start:valid(s.start,30,250)??80,goal:valid(s.goal,30,250)??65};localStorage.setItem(KEY,JSON.stringify(entries));localStorage.setItem(SETTINGS,JSON.stringify(settings));$('startWeight').value=settings.start;$('goalWeight').value=settings.goal;fillForm();renderAll();alert('復元しました');}catch{alert('バックアップファイルを確認してください')}};reader.readAsText(file);}
function valid(v,min,max){return typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max?v:null;}

// v2: exercise checklists are kept in a separate localStorage key, preserving v1 entries.
const WORKOUT_KEY='health65.workout.v2';
let workoutChecks=safeRead(WORKOUT_KEY,{});
const exercises=[
 {id:'squat',icon:'🪑',name:'椅子スクワット',dose:'12回 × 2セット',target:'太もも・お尻',how:'足を肩幅に開き、椅子へゆっくり腰を下ろして立ち上がる。膝はつま先と同じ向きに。',tip:'反動を使わず、痛みのない深さで行う。'},
 {id:'pushup',icon:'🙌',name:'壁腕立て伏せ',dose:'12回 × 2セット',target:'胸・腕',how:'壁に両手をつき、体を一直線に保って胸を壁へ近づけ、押し戻す。',tip:'腰を反らさず、肩が痛む場合は角度を調整。'},
 {id:'birddog',icon:'🧘',name:'バードドッグ',dose:'左右各8回 × 2セット',target:'背中・体幹',how:'四つんばいで右手と左脚を伸ばし2秒保つ。反対側も同様に。',tip:'骨盤を傾けず、腰を反らさない。'},
 {id:'calf',icon:'🦶',name:'かかと上げ',dose:'15回 × 2セット',target:'ふくらはぎ',how:'壁や椅子に手を添え、両かかとをゆっくり上げ下げする。',tip:'ふらつく場合は必ず支えを使う。'},
 {id:'scapula',icon:'🪽',name:'肩甲骨寄せ',dose:'10〜15回 × 2セット',target:'肩甲骨周辺',how:'肘を軽く曲げて後ろへ引き、肩甲骨を寄せて3秒保って戻す。',tip:'肩をすくめず、胸を軽く開く。強い筋力負荷ではなく動きを整える種目。'},
 {id:'shoulder',icon:'↔️',name:'肩のストレッチ',dose:'左右20秒 × 2回',target:'肩まわりの柔軟性',how:'片腕を胸の前に伸ばし、反対の腕でやさしく引き寄せる。',tip:'反動をつけず、痛みのない範囲で。ゴルフ練習後におすすめ。'}
];
function renderWorkout(){
 const date=$('workoutDate').value||localDay(),scheduled=[2,5].includes(dayOf(date));
 $('workoutTitle').textContent=scheduled?'筋トレ予定日':'今日は筋トレ休養日';
 $('workoutIntro').textContent=scheduled?'各種目を終えたらチェックしてください。完了状況はこのスマホに保存されます。':'火曜・金曜が基本の筋トレ日です。振替で実施する場合も、下のメニューを使えます。';
 const completed=Array.isArray(workoutChecks[date])?workoutChecks[date]:[];
 $('workoutExercises').innerHTML=exercises.map((e,i)=>`<article class="exercise-card"><div class="exercise-top"><span class="exercise-icon">${e.icon}</span><div class="exercise-title"><strong>${i+1}. ${e.name}</strong><small>${e.target}</small></div></div><div class="exercise-dose">${e.dose}</div><p>${e.how}</p><p class="exercise-tip">ポイント：${e.tip}</p><label class="exercise-check"><input type="checkbox" data-exercise="${e.id}" ${completed.includes(e.id)?'checked':''}> この種目を完了</label></article>`).join('');
 const count=exercises.filter(e=>completed.includes(e.id)).length;
 $('workoutCount').textContent=`${count} / ${exercises.length} 種目完了`;
 $('workoutProgress').style.width=`${count/exercises.length*100}%`;
}
function initWorkout(){
 $('workoutDate').value=localDay();renderWorkout();
 $('workoutDate').addEventListener('change',renderWorkout);
 $('workoutExercises').addEventListener('change',e=>{
  const id=e.target.dataset.exercise;if(!id)return;
  const date=$('workoutDate').value;
  const set=new Set(Array.isArray(workoutChecks[date])?workoutChecks[date]:[]);
  e.target.checked?set.add(id):set.delete(id);
  workoutChecks[date]=[...set];localStorage.setItem(WORKOUT_KEY,JSON.stringify(workoutChecks));renderWorkout();
 });
 $('resetWorkout').addEventListener('click',()=>{
  if(!confirm('この日の筋トレチェックをリセットしますか？'))return;
  delete workoutChecks[$('workoutDate').value];localStorage.setItem(WORKOUT_KEY,JSON.stringify(workoutChecks));renderWorkout();
 });
}

function init(){const now=localDay();$('todayLabel').textContent=new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(new Date());$('entryDate').value=now;initWorkout();$('startWeight').value=settings.start;$('goalWeight').value=settings.goal;fillForm();renderAll();$('entryDate').addEventListener('change',fillForm);$('entryForm').addEventListener('submit',e=>{e.preventDefault();save()});document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===b.dataset.page));if(b.dataset.page==='workout')renderWorkout();window.scrollTo(0,0);}));$('saveSettings').addEventListener('click',()=>{const start=Number($('startWeight').value),goal=Number($('goalWeight').value);if(!valid(start,30,250)||!valid(goal,30,250)||goal>=start){alert('開始時体重より低い目標体重を入力してください');return;}settings={start,goal};localStorage.setItem(SETTINGS,JSON.stringify(settings));renderAll();alert('保存しました');});$('exportCsv').addEventListener('click',csv);$('exportJson').addEventListener('click',backup);$('importJson').addEventListener('change',e=>{restore(e.target.files[0]);e.target.value='';});$('clearData').addEventListener('click',()=>{if(confirm('すべての記録を削除しますか？元に戻せません。')){entries={};localStorage.setItem(KEY,'{}');fillForm();renderAll();}});let deferred=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('installBtn').hidden=false;});$('installBtn').addEventListener('click',async()=>{if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;$('installBtn').hidden=true;}});if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});}
init();
