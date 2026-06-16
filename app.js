(function(){
  const modules = [
    ['vin','🔍','VIN DECODE','Decode / save unit'],
    ['parts','🔧','PARTS BY VIN','OEM + cross refs'],
    ['filters','🧰','FILTER KITS','PM filters + fluids'],
    ['jobkits','🛠️','JOB KITS','Parts kits for jobs'],
    ['ocr','📷','OCR SCAN','Take/upload photos'],
    ['customers','👥','CUSTOMERS','Fleet contacts'],
    ['units','🚛','UNITS','Trucks + equipment'],
    ['memory','🧠','REPAIR MEMORY','Saved fixes'],
    ['quotes','▣','QUOTES','Estimate + signature'],
    ['workorders','▤','WORK ORDERS','Job workflow'],
    ['invoices','▥','INVOICES','Bill + signature'],
    ['schedule','📅','SCHEDULE','Calendar + jobs'],
    ['clock','⏱️','TIME CLOCK','A / B / C jobs'],
    ['gps','📍','GPS','Pin drop + mileage'],
    ['reports','▦','REPORTS','Shop reports'],
    ['settings','⚙️','SETTINGS','All options'],
    ['fault','🚧','FAULT DOCTOR','Under construction']
  ];
  function save(key,obj){ const arr=JSON.parse(localStorage.getItem(key)||'[]'); arr.unshift({...obj, savedAt:new Date().toISOString()}); localStorage.setItem(key,JSON.stringify(arr)); return arr[0]; }
  function shareText(title,text){ if(navigator.share){navigator.share({title,text}).catch(()=>{});} else {navigator.clipboard?.writeText(text); alert('Copied to clipboard');} }
  function field(label,type='text'){return `<label><span>${label}</span><input data-field="${label}" type="${type}" placeholder="${label}"></label>`}
  function standardScreen(id,title,body,actions=''){
    return `<section class="rwd-screen" id="screen-${id}"><div class="rwd-screen-head"><button class="rwd-back" data-home>← BACK</button><div class="rwd-screen-title">${title}</div><button class="rwd-settings" data-open="settings">SETTINGS</button></div>${body}<div class="rwd-actions"><button class="rwd-save" data-save="${id}">SAVE</button><button class="rwd-clear" data-clear="${id}">CLEAR</button>${actions||'<button class="rwd-action" data-home>CANCEL</button>'}</div></section>`;
  }
  function init(){
    document.body.innerHTML = `<main class="rwd-shell"><div id="rwd-home"><div class="rwd-top"><div class="rwd-brand"><h1>ROLLING WRENCH DIESEL</h1><p>BA001 Command Center</p></div></div><div class="rwd-hero-row"><button class="rwd-hero" data-open="clock"><div class="label">Current Job Clock</div><div class="big" id="rwd-clock">--:--</div><div class="sub">Tap for A / B / C time clock</div></button><button class="rwd-hero" data-open="schedule"><div class="label">Today's Schedule</div><div class="big">SCHEDULE</div><div class="sub">Open jobs + reminders</div></button></div><div class="rwd-grid">${modules.map(m=>`<button class="rwd-tile" data-open="${m[0]}"><div class="rwd-icon">${m[1]}</div><div class="rwd-title">${m[2]}</div><div class="rwd-desc">${m[3]}</div></button>`).join('')}</div></div><div id="rwd-screens">${screens()}</div></main>`;
    bind(); setInterval(()=>{ const el=document.getElementById('rwd-clock'); if(el) el.textContent=new Date().toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});},1000);
  }
  function screens(){
    const simple = id => `<div class="rwd-form">${field('Customer')}${field('Unit / VIN')}${field('Notes')}<textarea data-field="Description" placeholder="Description / notes"></textarea></div>`;
    return [
      standardScreen('vin','VIN DECODE CENTER',`<div class="rwd-form">${field('VIN')}${field('Customer')}${field('Unit Number')}${field('Engine')}${field('Transmission')}<textarea data-field="Build Info" placeholder="Decoded build info / notes"></textarea></div>`,'<button class="rwd-action" data-action="vin-save-unit">SAVE TO UNIT</button>'),
      standardScreen('parts','PARTS BY VIN',`<div class="rwd-form">${field('VIN')}${field('Engine Serial')}${field('Part Number')}${field('Description')}<textarea data-field="Cross References" placeholder="OEM, cross refs, superseded numbers"></textarea></div>`,'<button class="rwd-action" data-action="parts-to-quote">ADD TO QUOTE</button>'),
      standardScreen('filters','FILTER / PM KITS',simple('filters'),'<button class="rwd-action" data-action="kit-to-quote">ADD PM KIT</button>'),
      standardScreen('jobkits','JOB PARTS KITS',simple('jobkits'),'<button class="rwd-action" data-action="kit-to-wo">ADD JOB KIT</button>'),
      standardScreen('ocr','OCR SCAN',`<div class="rwd-form"><input class="rwd-file" id="rwd-camera" type="file" accept="image/*" capture="environment"><input class="rwd-file" id="rwd-upload" type="file" accept="image/*"><button class="rwd-action" data-pick="camera">TAKE PHOTO</button><button class="rwd-action" data-pick="upload">UPLOAD SAVED PHOTO</button><textarea data-field="OCR Results" placeholder="OCR results / VIN / part numbers / prices"></textarea></div>`,'<button class="rwd-action" data-action="ocr-send">SEND DATA</button>'),
      standardScreen('customers','CUSTOMERS',`<div class="rwd-form">${field('Name')}${field('Phone','tel')}${field('Email','email')}${field('Address')}<textarea data-field="Notes" placeholder="Customer notes"></textarea></div>`),
      standardScreen('units','UNITS / EQUIPMENT',`<div class="rwd-form">${field('Unit Number')}${field('VIN')}${field('Type')}${field('Engine')}${field('Transmission')}<textarea data-field="Service History" placeholder="Service history"></textarea></div>`),
      standardScreen('memory','REPAIR MEMORY',simple('memory')),
      standardScreen('quotes','QUOTES',`<div class="rwd-form">${field('Quote Number')}${field('Customer')}${field('VIN / Unit')}${field('Labor')}${field('Parts')}<textarea data-field="Quote Details" placeholder="Quote details"></textarea><canvas class="rwd-signature" width="600" height="160" style="width:100%;background:#fff;border-radius:12px"></canvas></div>`,'<button class="rwd-action" data-action="share-quote">SEND QUOTE</button>'),
      standardScreen('workorders','WORK ORDERS',simple('workorders'),'<button class="rwd-action" data-action="wo-to-invoice">TO INVOICE</button>'),
      standardScreen('invoices','INVOICES',`<div class="rwd-form">${field('Invoice Number')}${field('Customer')}${field('VIN / Unit')}${field('Labor')}${field('Parts')}<textarea data-field="Invoice Details" placeholder="Invoice details"></textarea><canvas class="rwd-signature" width="600" height="160" style="width:100%;background:#fff;border-radius:12px"></canvas></div>`,'<button class="rwd-action" data-action="share-invoice">SEND INVOICE</button>'),
      standardScreen('schedule','SCHEDULE',simple('schedule')),
      standardScreen('clock','TIME CLOCK',`<div class="rwd-form"><button class="rwd-action">START JOB A</button><button class="rwd-action">PAUSE JOB A</button><button class="rwd-action">STOP JOB A</button><button class="rwd-action">START JOB B</button><button class="rwd-action">START JOB C</button></div>`),
      standardScreen('gps','GPS / PIN DROP',simple('gps'),'<button class="rwd-action" data-action="gps">USE LOCATION</button>'),
      standardScreen('reports','REPORTS',`<div class="rwd-form"><button class="rwd-action">QUOTE REPORTS</button><button class="rwd-action">INVOICE REPORTS</button><button class="rwd-action">PM REPORTS</button></div>`),
      standardScreen('settings','SETTINGS',`<div class="rwd-form">${['Shop Name','Phone','Email','Address','Labor Rate','Service Call Fee','Mileage Rate','Parts Markup %','Tax %','Quote Prefix','Invoice Prefix','Terms','Warranty Statement','OCR Auto Detect','VIN Auto Save','Default Vendor','Theme','PIN Lock','Backup / Restore'].map(x=>field(x)).join('')}</div>`),
      `<section class="rwd-screen" id="screen-fault"><div class="rwd-screen-head"><button class="rwd-back" data-home>← BACK</button><div class="rwd-screen-title">FAULT DOCTOR</div><button class="rwd-settings" data-open="settings">SETTINGS</button></div><div class="rwd-under"><h2>UNDER CONSTRUCTION</h2><p>Fault Doctor is parked for a later BA001 update.</p></div></section>`
    ].join('');
  }
  function bind(){
    document.addEventListener('click',e=>{
      const open=e.target.closest('[data-open]'); if(open){show(open.dataset.open); return;}
      if(e.target.closest('[data-home]')){home(); return;}
      const clear=e.target.closest('[data-clear]'); if(clear){document.querySelectorAll(`#screen-${clear.dataset.clear} input,#screen-${clear.dataset.clear} textarea`).forEach(i=>i.value=''); return;}
      const saveBtn=e.target.closest('[data-save]'); if(saveBtn){const s=document.getElementById('screen-'+saveBtn.dataset.save); const data={}; s.querySelectorAll('[data-field]').forEach(i=>data[i.dataset.field]=i.value); save('rwd_'+saveBtn.dataset.save,data); alert('Saved'); return;}
      const pick=e.target.closest('[data-pick]'); if(pick){document.getElementById(pick.dataset.pick==='camera'?'rwd-camera':'rwd-upload').click(); return;}
      const act=e.target.closest('[data-action]'); if(act){ handleAction(act.dataset.action); }
    });
    document.addEventListener('change',e=>{ if(e.target.id==='rwd-camera'||e.target.id==='rwd-upload'){ const t=document.querySelector('#screen-ocr textarea'); if(t) t.value += `\nPhoto added: ${e.target.files?.[0]?.name||'image'}`; }});
  }
  function handleAction(a){
    if(a==='share-quote') return shareText('Rolling Wrench Diesel Quote','Rolling Wrench Diesel quote is ready for review/signature.');
    if(a==='share-invoice') return shareText('Rolling Wrench Diesel Invoice','Rolling Wrench Diesel invoice is ready for review/signature.');
    if(a==='gps' && navigator.geolocation) return navigator.geolocation.getCurrentPosition(p=>alert(`Location saved: ${p.coords.latitude}, ${p.coords.longitude}`),()=>alert('Location permission needed'));
    alert('Added to workflow');
  }
  function show(id){ document.getElementById('rwd-home').style.display='none'; document.querySelectorAll('.rwd-screen').forEach(s=>s.classList.remove('active')); document.getElementById('screen-'+id)?.classList.add('active'); window.scrollTo(0,0); }
  function home(){ document.querySelectorAll('.rwd-screen').forEach(s=>s.classList.remove('active')); document.getElementById('rwd-home').style.display='block'; window.scrollTo(0,0); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
