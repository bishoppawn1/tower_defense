// Sandbox waves run through the same entrance, combat and reward code as defense.
const lab=document.querySelector('#lab');
const labForm=document.querySelector('#labForm'),groups=document.querySelector('#testGroups');
const testNumber=document.querySelector('#testNumber'),launchTest=document.querySelector('#launchTest');
const kinds={normal:'Walker',runner:'Runner',brute:'Brute',armor:'Armored',shock:'Insulated',
  fire:'Fireproof',cold:'Frostproof',toxic:'Hazmat',blast:'Blastproof'};
const maxCustomSize=5000;
let customWave=false;

function readGroups(){
  return [...groups.children].map(row=>({
    kind:row.querySelector('[name=kind]').value,
    tier:Number(row.querySelector('[name=tier]').value),
    count:row.querySelector('[name=count]').valueAsNumber
  }));
}
function refreshLab(){
  testNumber.disabled=customWave;
  const entries=readGroups();
  const total=customWave?entries.reduce((sum,row)=>sum+row.count,0):
    testNumber.validity.valid?waveSize(testNumber.valueAsNumber,activeMap):0;
  const valid=customWave?entries.length>0&&entries.every(row=>Number.isInteger(row.count)&&row.count>0)&&total<=maxCustomSize:testNumber.validity.valid;
  document.querySelector('#presetEditor').hidden=customWave;
  document.querySelector('#customEditor').hidden=!customWave;
  for(const input of groups.querySelectorAll('input,select'))input.disabled=!customWave;
  document.querySelector('#presetTab').setAttribute('aria-pressed',String(!customWave));
  document.querySelector('#customTab').setAttribute('aria-pressed',String(customWave));
  document.querySelector('#testCount').textContent=valid?total.toLocaleString()+' zombies':
    customWave?'Choose 1 to 5,000 zombies in total.':'Choose a wave from 1 to 250.';
  launchTest.disabled=!valid||running;
  launchTest.hidden=running;
  document.querySelector('#stopTest').hidden=!running;
}
function addGroup(){
  const row=document.createElement('div');row.className='test-group';
  row.innerHTML=`<div class="group-title"><span>Zombie group</span><button type="button" class="remove-group" aria-label="Remove zombie group">×</button></div>
    <div class="group-fields"><label>Type<select name="kind"></select></label>
    <label>Tier<select name="tier"></select></label>
    <label>Count<input name="count" type="number" min="1" max="${maxCustomSize}" value="24" required></label></div>`;
  const type=row.querySelector('[name=kind]'),tier=row.querySelector('[name=tier]');
  for(const [key,label] of Object.entries(kinds))type.add(new Option(label,key));
  enemyTiers.forEach((_,i)=>tier.add(new Option(String(i+1),String(i+1))));
  row.querySelector('.remove-group').onclick=()=>{row.remove();refreshLab();};
  groups.append(row);refreshLab();
  return row;
}
function openLab(){
  upgradeDialog.hidden=true;
  lab.hidden=false;refreshLab();document.querySelector('#closeLab').focus();
}
function closeLab(){
  lab.hidden=true;
}
function resetTestField(){
  enemies=[];soldiers=[];projectiles=[];effects=[];waveQueue=[];spawn=0;
  for(const t of towers){
    t.cool=0;t.locked=null;t.focus=1;t.recoil=0;t.plumeTime=0;
    if(t.type==='minigun')t.spin=0;
  }
  for(const fork of activeMap.forks)for(const edge of fork.outgoing)edge.entries=0;
}
function finishTest(stopped){
  const remaining=enemies.length+waveQueue.length;
  const result=(stopped?'Stopped':'Complete')+' · '+sandboxRun.defeated+' defeated · '+sandboxRun.breached+' breached'+
    (stopped?' · '+remaining+' remaining':'');
  running=false;resetTestField();
  document.querySelector('#testResult').textContent=result;
  status.textContent=result;refreshLab();ui();
}
labForm.onsubmit=event=>{
  event.preventDefault();
  if(!sandbox||running||launchTest.disabled||!labForm.reportValidity())return;
  resetTestField();
  let roster,label;
  if(customWave){
    roster=[];
    for(const {kind,tier,count} of readGroups())for(let i=0;i<count;i++)roster.push({kind,tier});
    shuffle(roster);label='Custom wave';
  }else{
    wave=testNumber.valueAsNumber;roster=waveRoster(wave,activeMap);label='Wave '+wave;
  }
  sandboxRun={custom:customWave,defeated:0,breached:0};
  document.querySelector('#testResult').textContent='';
  closeLab();launchWave(roster,label+' · '+roster.length+' incoming');
  document.querySelector('#start').focus();
};
document.querySelector('#stopTest').onclick=()=>{if(sandbox&&running)finishTest(true);};
document.querySelector('#presetTab').onclick=()=>{customWave=false;refreshLab();};
document.querySelector('#customTab').onclick=()=>{customWave=true;refreshLab();};
document.querySelector('#closeLab').onclick=()=>{closeLab();document.querySelector('#start').focus();};
document.querySelector('#addGroup').onclick=()=>addGroup().querySelector('select').focus();
document.querySelector('#leaveLab').onclick=()=>location.reload();
labForm.oninput=refreshLab;
lab.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
    event.stopPropagation();closeLab();document.querySelector('#start').focus();
  }
});
addGroup();
