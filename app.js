const $=(id)=>document.getElementById(id);

const FLUIDS={
  seawater:{rho:1025,mu:0.00108,label:'Sea Water · 20°C'},
  water:{rho:998.2,mu:0.001002,label:'Fresh Water · 20°C'},
  chilled:{rho:999.9,mu:0.00143,label:'Chilled Water · 7°C'}
};

const ROUGHNESS={cunifer:0.0015,stainless:0.0015,carbon:0.045,hdpe:0.0015}; // mm
const K={elbow:0.9,butterfly:0.6,nrv:2.0,strainer:2.5};

function val(id){return Number($(id).value)||0}
function fmt(n,d=2){return Number.isFinite(n)?n.toLocaleString(undefined,{maximumFractionDigits:d,minimumFractionDigits:d}):'—'}

function frictionFactor(re,eps,D){
  if(re<=0) return 0;
  if(re<2300) return 64/re;
  const rr=eps/D;
  return 0.25/Math.pow(Math.log10(rr/3.7+5.74/Math.pow(re,0.9)),2);
}

function calculate(){
  const fluid=FLUIDS[$('fluid').value];
  const q=val('flow')/3600;
  const D=val('diameter')/1000;
  const L=val('length');
  const elevation=val('elevation');
  const g=9.80665;
  const area=Math.PI*D*D/4;
  const velocity=area>0?q/area:0;
  const reynolds=fluid.mu>0?(fluid.rho*velocity*D/fluid.mu):0;
  const eps=(ROUGHNESS[$('material').value]||0.01)/1000;
  const f=frictionFactor(reynolds,eps,D);
  const dyn=velocity*velocity/(2*g);
  const major=D>0?f*(L/D)*dyn:0;
  const kTotal=val('elbow')*K.elbow+val('butterfly')*K.butterfly+val('nrv')*K.nrv+val('strainer')*K.strainer;
  const minor=kTotal*dyn;
  const staticHead=elevation;
  const totalHead=Math.max(0,major+minor+staticHead);
  const pressureBar=fluid.rho*g*totalHead/100000;

  $('velocity').textContent=fmt(velocity,2);
  $('reynolds').textContent=Math.round(reynolds).toLocaleString();
  $('regime').textContent=reynolds<2300?'Laminar':reynolds<4000?'Transitional':'Turbulent';
  $('friction').textContent=fmt(f,4);
  $('dynamicHead').textContent=fmt(dyn,3);
  $('pipeLoss').textContent=`${fmt(major,2)} m`;
  $('fittingLoss').textContent=`${fmt(minor,2)} m`;
  $('staticLoss').textContent=`${fmt(staticHead,2)} m`;
  $('totalHead').textContent=fmt(totalHead,2);
  $('totalPressure').textContent=fmt(pressureBar,2);
  $('lossTotalLabel').textContent=`${fmt(totalHead,2)} m total`;
  $('diagramFlow').textContent=`${fmt(val('flow'),1)} m³/h`;
  $('diagramLine').textContent=`Ø${fmt(val('diameter'),0)} mm`;
  $('diagramPump').textContent=`${fmt(totalHead,1)} m`;

  const parts=[Math.max(0,major),Math.max(0,minor),Math.max(0,staticHead)];
  const denom=Math.max(parts.reduce((a,b)=>a+b,0),0.0001);
  $('pipeBar').style.width=`${Math.max(2,parts[0]/denom*100)}%`;
  $('fittingBar').style.width=`${Math.max(2,parts[1]/denom*100)}%`;
  $('staticBar').style.width=`${Math.max(2,parts[2]/denom*100)}%`;

  const status=$('resultStatus');
  const box=$('engineeringCheck');
  const icon=box.querySelector('.check-icon');
  box.classList.remove('warning','danger');

  if(velocity>3.0){
    status.textContent='High velocity';
    status.className='chip';
    box.classList.add('danger');
    icon.textContent='!';
    $('checkText').textContent=`Velocity is ${fmt(velocity,2)} m/s. Consider increasing the internal diameter or checking the project velocity criterion.`;
  }else if(velocity>2.5){
    status.textContent='Review velocity';
    status.className='chip';
    box.classList.add('warning');
    icon.textContent='!';
    $('checkText').textContent=`Velocity is ${fmt(velocity,2)} m/s. This may be acceptable, but verify the system-specific design criterion.`;
  }else if(velocity<0.5 && velocity>0){
    status.textContent='Low velocity';
    status.className='chip';
    box.classList.add('warning');
    icon.textContent='!';
    $('checkText').textContent=`Velocity is ${fmt(velocity,2)} m/s. Check whether the selected line size is unnecessarily large.`;
  }else{
    status.textContent='Within target';
    status.className='chip success';
    icon.textContent='✓';
    $('checkText').textContent=`Velocity is ${fmt(velocity,2)} m/s. No generic velocity warning is triggered for this prototype check.`;
  }
}

function applyPreset(name){
  document.querySelectorAll('#systemPresets button').forEach(b=>b.classList.toggle('active',b.dataset.preset===name));
  if(name==='seawater'){
    $('fluid').value='seawater'; $('material').value='cunifer'; $('flow').value=45; $('diameter').value=80; $('length').value=38; $('elevation').value=4.2;
    $('elbow').value=6; $('butterfly').value=2; $('nrv').value=1; $('strainer').value=1;
  }
  if(name==='chilled'){
    $('fluid').value='chilled'; $('material').value='carbon'; $('flow').value=72; $('diameter').value=100; $('length').value=64; $('elevation').value=2.5;
    $('elbow').value=10; $('butterfly').value=4; $('nrv').value=1; $('strainer').value=1;
  }
  if(name==='fresh'){
    $('fluid').value='water'; $('material').value='stainless'; $('flow').value=18; $('diameter').value=65; $('length').value=42; $('elevation').value=8;
    $('elbow').value=8; $('butterfly').value=3; $('nrv').value=1; $('strainer').value=0;
  }
  calculate();
}

$('calculateBtn').addEventListener('click',calculate);
$('resetBtn').addEventListener('click',()=>applyPreset('seawater'));
document.querySelectorAll('#systemPresets button').forEach(btn=>btn.addEventListener('click',()=>applyPreset(btn.dataset.preset)));
document.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',calculate));

calculate();
