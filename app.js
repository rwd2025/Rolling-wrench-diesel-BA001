(() => {
  'use strict';

  const STORE = 'RWD_BA001_GREEN_COMMAND_V1';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const uid = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = (v) => '$' + Number(v || 0).toFixed(2);
  const now = () => new Date().toLocaleString();
  const fmtClock = (sec) => {
    sec = Math.max(0, Math.floor(sec || 0));
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const defaultState = {
    view: 'home',
    priorView: 'home',
    active: { customer: '', unit: '', vin: '' },
    settings: {
      shopName: 'Rolling Wrench Diesel', phone: '260-502-6222', email: '', address: '', website: 'www.rollingwrenchdiesel.com',
      laborRate: 135, serviceCall: 250, mileageRate: 0, shopSupplies: 0, partsMarkup: 10, taxRate: 0,
      quotePrefix: 'Q-', invoicePrefix: 'INV-', workOrderPrefix: 'WO-', warranty: 'Parts and labor subject to inspection. Price may vary if additional damage is found.',
      autoNumber: true, highContrast: false, greenGlow: true, pinLock: false, autoBackup: true,
      ocrAutoVin: true, ocrAutoParts: true, ocrAutoPrices: true, savePhotos: true, supabaseUrl: '', supabaseKey: ''
    },
    counters: { quote: 1, invoice: 1, workOrder: 1 },
    customers: [], units: [], parts: [], kits: [], quotes: [], workOrders: [], invoices: [], ocr: [], schedule: [], pm: [], memory: [], gps: [],
    clocks: { A:{name:'Job A',sec:0,run:false,start:0}, B:{name:'Job B',sec:0,run:false,start:0}, C:{name:'Job C',sec:0,run:false,start:0} }
  };

  function deepMerge(a, b) {
    for (const k in b) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k]) deepMerge(a[k], b[k]);
      else a[k] = b[k];
    }
    return a;
  }
  function load() { try { return deepMerge(structuredClone(defaultState), JSON.parse(localStorage.getItem(STORE) || '{}')); } catch { return structuredClone(defaultState); } }
  let state = load();
  function save() { localStorage.setItem(STORE, JSON.stringify(state)); }
  function toast(msg) { const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(window.__ba001Toast); window.__ba001Toast = setTimeout(() => t.classList.remove('show'), 1700); }
  function nav(view) { state.priorView = state.view; state.view = view; save(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function back() { nav(state.view === 'home' ? 'home' : 'home'); }
  function nextNumber(type) { const n = state.counters[type] || 1; state.counters[type] = n + 1; save(); return n; }

  const screens = [
    ['vin','VIN DECODE','VIN','Decode and save truck/unit info'],
    ['parts','PARTS BY VIN','PARTS','Find parts, cross refs, prices'],
    ['kits','FILTER KITS','KITS','Build PM and job kits'],
    ['jobkits','JOB KITS','JOB','Common repair parts kits'],
    ['ocr','OCR SCAN','OCR','Take or upload pictures'],
    ['customers','CUSTOMERS','CUST','Customer records'],
    ['units','UNITS','UNIT','Trucks, trailers, equipment'],
    ['quotes','QUOTES','QUOTE','Quote with signature/send'],
    ['workOrders','WORK ORDERS','WO','Labor, parts, photos'],
    ['invoices','INVOICES','INV','Invoice with signature/send'],
    ['clock','TIME CLOCK','TIME','A / B / C clocks'],
    ['schedule','SCHEDULE','SCH','Today and upcoming jobs'],
    ['pm','PM TRACKING','PM','Service reminders'],
    ['gps','GPS','GPS','Location and mileage'],
    ['memory','REPAIR MEMORY','MEM','Saved repairs and parts'],
    ['reports','REPORTS','REP','Shop totals and records'],
    ['fault','FAULT DOCTOR','SOON','Under construction'],
    ['settings','SETTINGS','SET','Every option']
  ];

  const commonJobs = {
    'Wheel Seal Job': ['Wheel seal', 'Inner bearing', 'Outer bearing', 'Hub cap gasket', 'Gear oil', 'Cotter pin / hardware'],
    'King Pin Job': ['King pin kit', 'Bushings', 'Thrust bearing', 'Shims', 'Seals', 'Grease'],
    'Clutch Job': ['Clutch kit', 'Pilot bearing', 'Release bearing', 'Flywheel bolts', 'Input shaft kit', 'Transmission fluid'],
    'Water Pump Job': ['Water pump', 'Gaskets/O-rings', 'Belt', 'Coolant', 'Thermostats if needed'],
    'Brake Job': ['Brake shoes/pads', 'Drums/rotors if needed', 'Hardware kit', 'Cam bushings if needed', 'Slack adjuster if needed'],
    'Air Bag Job': ['Air bag', 'Air line fittings', 'Mounting hardware', 'DOT air line if needed'],
    'Starter Job': ['Starter', 'Battery cable ends', 'Mounting bolts', 'Electrical cleaner'],
    'Alternator Job': ['Alternator', 'Belt', 'Pulley if needed', 'Battery test notes']
  };

  const pmKits = {
    'Cummins ISX / X15': ['Oil filter', 'Fuel filter', 'Fuel/water separator', 'Crankcase filter', 'DEF filter if due', 'Oil capacity note'],
    'Detroit DD13 / DD15': ['Oil filter', 'Fuel filter kit', 'Water separator', 'DEF filter if due', 'Air filter if due', 'Oil capacity note'],
    'PACCAR MX': ['Oil filter', 'Fuel filter', 'Water separator', 'Crankcase filter if equipped', 'DEF filter if due'],
    'Volvo D13 / Mack MP8': ['Oil filter', 'Fuel filters', 'Water separator', 'Crankcase filter', 'DEF filter if due'],
    'International A26 / MaxxForce': ['Oil filter', 'Fuel filter', 'Water separator', 'Crankcase filter if equipped', 'DEF filter if due']
  };

  function layout(content) {
    return `
      <div class="rwd-bg" aria-hidden="true">RWD</div>
      <header class="app-top no-print">
        <button class="top-btn" data-back>BACK</button>
        <div class="brand-title"><b>${esc(state.settings.shopName)}</b><span>BA001 Command Center</span></div>
        <button class="top-btn" data-nav="settings">SETTINGS</button>
      </header>
      <main class="app-shell">${content}</main>
      <div id="toast" class="toast"></div>
    `;
  }

  function hero() {
    const activeSec = ['A','B','C'].reduce((sum,k) => {
      const c = state.clocks[k]; return sum + Number(c.sec || 0) + (c.run ? Math.floor((Date.now() - c.start) / 1000) : 0);
    }, 0);
    const todayStr = new Date().toISOString().slice(0,10);
    const todayJobs = state.schedule.filter(x => String(x.date || '').startsWith(todayStr)).slice(0,3);
    return `<section class="hero-row">
      <button class="hero-btn clock-hero" data-nav="clock"><span>ACTIVE JOB CLOCK</span><b>${fmtClock(activeSec)}</b><small>Tap to open A / B / C clocks</small></button>
      <button class="hero-btn schedule-hero" data-nav="schedule"><span>TODAY'S SCHEDULE</span><b>${todayJobs.length || '0'} Jobs</b><small>${todayJobs[0] ? esc(todayJobs[0].customer || todayJobs[0].job || 'Scheduled') : 'Tap to add schedule'}</small></button>
    </section>`;
  }

  function home() {
    const main = ['vin','parts','kits','jobkits','ocr','customers','units','quotes','workOrders','invoices','clock','schedule','pm','gps','memory','reports','fault','settings'];
    return `${hero()}<section class="screen-panel"><div class="panel-head"><h1>Shop Command Buttons</h1><p>VIN, parts, kits, quotes, work orders, invoices, schedule, and field tools.</p></div><div class="button-grid">${main.map(key => {
      const s = screens.find(x => x[0] === key);
      return `<button class="command-btn ${['vin','parts','kits','jobkits'].includes(key) ? 'priority' : ''}" data-nav="${s[0]}"><span class="btn-icon">${s[2]}</span><b>${s[1]}</b><small>${s[3]}</small></button>`;
    }).join('')}</div></section>`;
  }

  function screen(title, body, footer='') {
    return `<section class="screen-panel"><div class="screen-head"><button class="mini-btn" data-back>BACK</button><div><h1>${title}</h1><p>${esc(state.active.customer || 'No active customer')} • ${esc(state.active.unit || 'No active unit')} • ${esc(state.active.vin || 'No VIN')}</p></div><button class="mini-btn" data-nav="settings">SETTINGS</button></div>${body}${footer}</section>`;
  }

  function actions(saveId, clearId, extra='') { return `<div class="action-row"><button class="action save" id="${saveId}">SAVE</button><button class="action clear" id="${clearId}">CLEAR</button>${extra}<button class="action" data-back>CANCEL</button></div>`; }
  function input(id, label, value='', type='text', placeholder='') { return `<label>${label}<input id="${id}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}"></label>`; }
  function area(id, label, value='', placeholder='') { return `<label class="wide">${label}<textarea id="${id}" placeholder="${esc(placeholder)}">${esc(value)}</textarea></label>`; }
  function records(arr, empty='No records saved yet.') { return `<div class="records">${arr.length ? arr.slice().reverse().map(r => `<article class="record"><b>${esc(r.title || r.name || r.customer || r.unit || r.number || r.vin || 'Saved Record')}</b><span>${esc(r.created || r.date || '')}</span><p>${esc(r.notes || r.description || r.job || r.summary || '')}</p></article>`).join('') : `<p class="empty">${empty}</p>`}</div>`; }

  function vinPage() { return screen('VIN Decode Center', `
    <div class="form-grid">${input('vin_vin','VIN',state.active.vin,'text','17 character VIN')}${input('vin_customer','Customer',state.active.customer)}${input('vin_unit','Unit / Truck #',state.active.unit)}${input('vin_engine','Engine / ESN')}${input('vin_trans','Transmission')}${input('vin_miles','Mileage / Hours')}${area('vin_notes','Build Notes','','PTO, dump truck, axle, glider, engine serial, tag notes')}</div>
    <div class="action-row"><button class="action primary" id="decodeVin">DECODE VIN</button><button class="action save" id="saveVinUnit">SAVE UNIT</button><button class="action" id="vinToParts">PARTS BY VIN</button><button class="action clear" id="clearVin">CLEAR</button></div>
    <div id="vinOutput" class="result-box"></div>${records(state.units)}`); }

  function partsPage() { return screen('Parts By VIN', `
    <div class="form-grid">${input('part_vin','VIN',state.active.vin)}${input('part_engine','Engine / ESN')}${input('part_number','Part Number')}${input('part_desc','Description','','text','filter, wheel seal, water pump')}${input('part_qty','Qty','1','number')}${input('part_cost','Cost','','number')}${input('part_sell','Sell Price','','number')}${input('part_cross','Cross References')}</div>
    ${actions('savePart','clearParts','<button class="action primary" id="researchParts">PARTS RESEARCH</button><button class="action" id="sendPartsQuote">SEND TO QUOTE</button>')}
    <div id="partsOutput" class="result-box"></div>${records(state.parts)}`); }

  function kitsPage() { return screen('Filter / PM Kits', `
    <div class="split"><div class="sub-card"><h2>Filter Kit By Engine</h2><label>Engine<select id="pm_engine">${Object.keys(pmKits).map(k => `<option>${k}</option>`).join('')}</select></label><label>VIN / Unit<input id="pm_vin" value="${esc(state.active.vin || state.active.unit)}"></label><button class="action primary full" id="buildPmKit">BUILD PM KIT</button></div><div class="sub-card"><h2>Send Kit</h2><button class="action full" id="kitToQuote">SEND LATEST KIT TO QUOTE</button><button class="action full" id="kitToWorkOrder">SEND LATEST KIT TO WORK ORDER</button></div></div>
    <div id="kitOutput" class="result-box"></div>${records(state.kits)}`); }

  function jobKitsPage() { return screen('Job Parts Kits', `
    <div class="form-grid one"><label>Job Type<select id="job_type">${Object.keys(commonJobs).map(k => `<option>${k}</option>`).join('')}</select></label>${input('job_unit','VIN / Unit',state.active.vin || state.active.unit)}${area('job_notes','Job Notes')}</div>
    <div class="action-row"><button class="action primary" id="buildJobKit">BUILD JOB KIT</button><button class="action" id="jobKitQuote">SEND TO QUOTE</button><button class="action" id="jobKitWo">SEND TO WORK ORDER</button><button class="action clear" id="clearJobKit">CLEAR</button></div>
    <div id="jobKitOutput" class="result-box"></div>${records(state.kits)}`); }

  function ocrPage() { return screen('OCR Scan', `
    <p class="hint">Use camera or saved pictures. OCR text can be pasted after your phone/browser reads it. The app extracts VINs, part numbers, prices, and notes.</p>
    <div class="photo-row"><label class="photo-btn">TAKE PHOTO<input id="takePhoto" type="file" accept="image/*" capture="environment"></label><label class="photo-btn">UPLOAD SAVED PHOTO<input id="uploadPhoto" type="file" accept="image/*"></label></div>
    <div id="photoPreview" class="photo-preview"></div>
    ${area('ocr_text','OCR / Photo Text','','Paste receipt, part label, VIN plate, invoice, or handwritten note text')}
    <div class="action-row"><button class="action primary" id="readOcr">READ OCR</button><button class="action" id="voiceOcr">VOICE NOTE</button><button class="action clear" id="clearOcr">CLEAR</button></div>
    <div class="send-grid"><button id="ocrToParts">SEND TO PARTS</button><button id="ocrToQuote">SEND TO QUOTE</button><button id="ocrToWo">SEND TO WORK ORDER</button><button id="ocrToInvoice">SEND TO INVOICE</button><button id="ocrToUnit">SEND TO UNIT / VIN</button><button id="saveOcr">SAVE OCR DATA</button></div>
    <div id="ocrOutput" class="result-box"></div>${records(state.ocr)}`); }

  function simplePage(key, title, fields) { return screen(title, `<div class="form-grid">${fields.map(f => f === 'notes' ? area(`${key}_${f}`, f.toUpperCase()) : input(`${key}_${f}`, f.toUpperCase())).join('')}</div>${actions(`save_${key}`,`clear_${key}`)}${records(state[key])}`); }

  function docPage(key, title) {
    const isQuote = key === 'quotes', isInvoice = key === 'invoices';
    return screen(title, `
      <div class="form-grid">${input(`${key}_customer`,'Customer',state.active.customer)}${input(`${key}_unit`,'Unit',state.active.unit)}${input(`${key}_vin`,'VIN',state.active.vin)}${input(`${key}_labor`,'Labor Hours','','number')}${input(`${key}_rate`,'Labor Rate',state.settings.laborRate,'number')}${input(`${key}_parts`,'Parts Total','','number')}${input(`${key}_service`,'Service Call',state.settings.serviceCall,'number')}${input(`${key}_tax`,'Tax %',state.settings.taxRate,'number')}${area(`${key}_notes`,'Notes / Scope')}</div>
      <div class="signature-card"><h2>Customer Signature</h2><canvas class="sig-pad" id="${key}_sig" width="900" height="260"></canvas><div class="action-row"><button class="action" id="clearSig_${key}">CLEAR SIGNATURE</button></div></div>
      <div class="action-row"><button class="action save" id="save_${key}">SAVE ${isQuote ? 'QUOTE' : isInvoice ? 'INVOICE' : 'WORK ORDER'}</button><button class="action clear" id="clear_${key}">CLEAR</button><button class="action primary" id="send_${key}">SEND TO CUSTOMER</button>${isQuote ? '<button class="action" id="quoteToWo">CONVERT TO WORK ORDER</button>' : ''}${key === 'workOrders' ? '<button class="action" id="woToInvoice">CONVERT TO INVOICE</button>' : ''}<button class="action" data-back>BACK</button></div>
      <div id="${key}_preview" class="result-box"></div>${records(state[key])}`); }

  function clockPage() { return screen('Time Clock', `<div class="clock-grid">${['A','B','C'].map(k => { const c = state.clocks[k]; const sec = Number(c.sec || 0) + (c.run ? Math.floor((Date.now() - c.start) / 1000) : 0); return `<div class="clock-card"><input class="clock-name" data-clock-name="${k}" value="${esc(c.name)}"><b>${fmtClock(sec)}</b><div><button class="action save" data-start="${k}">START</button><button class="action" data-pause="${k}">PAUSE</button><button class="action clear" data-stop="${k}">STOP/CLEAR</button></div></div>`; }).join('')}</div>`); }

  function reportsPage() { const totalQuotes = state.quotes.reduce((s,x)=>s+Number(x.total||0),0), totalInv = state.invoices.reduce((s,x)=>s+Number(x.total||0),0); return screen('Reports', `<div class="report-grid"><div><b>${state.customers.length}</b><span>Customers</span></div><div><b>${state.units.length}</b><span>Units</span></div><div><b>${state.quotes.length}</b><span>Quotes</span><small>${money(totalQuotes)}</small></div><div><b>${state.invoices.length}</b><span>Invoices</span><small>${money(totalInv)}</small></div><div><b>${state.parts.length}</b><span>Parts</span></div><div><b>${state.kits.length}</b><span>Kits</span></div></div>`); }

  function settingsPage() { return screen('Settings', `
    <div class="settings-sections">
      <h2>Shop Settings</h2><div class="form-grid">${input('set_shopName','Shop Name',state.settings.shopName)}${input('set_phone','Phone',state.settings.phone)}${input('set_email','Email',state.settings.email)}${input('set_website','Website',state.settings.website)}${input('set_address','Address',state.settings.address)}</div>
      <h2>Pricing</h2><div class="form-grid">${input('set_laborRate','Labor Rate',state.settings.laborRate,'number')}${input('set_serviceCall','Service Call',state.settings.serviceCall,'number')}${input('set_mileageRate','Mileage Rate',state.settings.mileageRate,'number')}${input('set_shopSupplies','Shop Supplies %',state.settings.shopSupplies,'number')}${input('set_partsMarkup','Parts Markup %',state.settings.partsMarkup,'number')}${input('set_taxRate','Tax %',state.settings.taxRate,'number')}</div>
      <h2>Documents</h2><div class="form-grid">${input('set_quotePrefix','Quote Prefix',state.settings.quotePrefix)}${input('set_invoicePrefix','Invoice Prefix',state.settings.invoicePrefix)}${input('set_workOrderPrefix','Work Order Prefix',state.settings.workOrderPrefix)}${area('set_warranty','Terms / Warranty',state.settings.warranty)}</div>
      <h2>OCR / VIN / Parts</h2><div class="toggle-grid">${toggle('ocrAutoVin','Auto VIN Detection')}${toggle('ocrAutoParts','Auto Part Detection')}${toggle('ocrAutoPrices','Auto Price Detection')}${toggle('savePhotos','Save Photos')}${toggle('autoNumber','Auto Numbering')}${toggle('autoBackup','Auto Backup')}</div>
      <h2>Display / Security / Sync</h2><div class="toggle-grid">${toggle('highContrast','High Contrast')}${toggle('greenGlow','RWD Green Glow')}${toggle('pinLock','PIN Lock Placeholder')}</div><div class="form-grid">${input('set_supabaseUrl','Supabase URL',state.settings.supabaseUrl)}${input('set_supabaseKey','Supabase Key',state.settings.supabaseKey)}</div>
    </div>
    <div class="action-row"><button class="action save" id="saveSettings">SAVE SETTINGS</button><button class="action clear" id="exportData">EXPORT BACKUP</button><button class="action clear" id="clearAllData">CLEAR ALL DATA</button></div>`); }

  function toggle(key, label) { return `<label class="toggle"><input type="checkbox" id="set_${key}" ${state.settings[key] ? 'checked' : ''}><span>${label}</span></label>`; }

  function faultPage() { return screen('Fault Doctor', `<div class="under"><b>UNDER CONSTRUCTION</b><p>Fault Doctor is parked for now. Use Work Orders and Repair Memory for fault notes until this feature is ready.</p></div>`); }

  const pages = { home, vin: vinPage, parts: partsPage, kits: kitsPage, jobkits: jobKitsPage, ocr: ocrPage, customers: () => simplePage('customers','Customers',['name','phone','email','address','notes']), units: () => simplePage('units','Units / Trucks / Equipment',['unit','vin','engine','transmission','mileage','notes']), quotes: () => docPage('quotes','Quotes'), workOrders: () => docPage('workOrders','Work Orders'), invoices: () => docPage('invoices','Invoices'), clock: clockPage, schedule: () => simplePage('schedule','Schedule',['date','time','customer','unit','job','notes']), pm: () => simplePage('pm','PM Tracking',['unit','vin','service','due','mileage','notes']), gps: () => simplePage('gps','GPS Service Calls',['customer','unit','address','miles','notes']), memory: () => simplePage('memory','Repair Memory',['unit','vin','repair','parts','result','notes']), reports: reportsPage, settings: settingsPage, fault: faultPage };

  function render() {
    let root = $('#app');
    if (!root) { root = document.createElement('div'); root.id = 'app'; document.body.appendChild(root); }
    document.body.classList.toggle('high-contrast', !!state.settings.highContrast);
    document.body.classList.toggle('no-glow', !state.settings.greenGlow);
    root.innerHTML = layout((pages[state.view] || pages.home)());
    bind();
  }

  function bind() {
    $$('[data-nav]').forEach(el => el.addEventListener('click', () => nav(el.dataset.nav)));
    $$('[data-back]').forEach(el => el.addEventListener('click', back));

    $('#decodeVin')?.addEventListener('click', () => {
      const vin = $('#vin_vin').value.trim().toUpperCase();
      const year = vin.length === 17 ? decodeYear(vin[9]) : 'UNKNOWN';
      $('#vinOutput').innerHTML = `<b>VIN RESULT</b><p>VIN: ${esc(vin || 'UNKNOWN')}</p><p>Year estimate: ${esc(year)}</p><p>Save build info to unit, then use Parts By VIN / Filter Kits.</p>`;
    });
    $('#saveVinUnit')?.addEventListener('click', () => {
      const rec = { id: uid(), created: now(), unit: $('#vin_unit').value, vin: $('#vin_vin').value.toUpperCase(), customer: $('#vin_customer').value, engine: $('#vin_engine').value, transmission: $('#vin_trans').value, mileage: $('#vin_miles').value, notes: $('#vin_notes').value, title: $('#vin_unit').value || $('#vin_vin').value };
      state.units.push(rec); state.active = { customer: rec.customer, unit: rec.unit, vin: rec.vin }; save(); toast('Unit saved'); render();
    });
    $('#vinToParts')?.addEventListener('click', () => { state.active.vin = $('#vin_vin').value.toUpperCase(); save(); nav('parts'); });
    $('#clearVin')?.addEventListener('click', () => clearInputs('vin'));

    $('#researchParts')?.addEventListener('click', () => { $('#partsOutput').innerHTML = '<b>PARTS RESEARCH CHECKLIST</b><p>Verify VIN, engine serial, axle/trans tag, OEM number, supersession, cross-reference, vendor stock, and customer approval before ordering.</p>'; });
    $('#savePart')?.addEventListener('click', () => { const rec = { id: uid(), created: now(), vin: $('#part_vin').value, engine: $('#part_engine').value, number: $('#part_number').value, description: $('#part_desc').value, qty: $('#part_qty').value, cost: $('#part_cost').value, sell: $('#part_sell').value, cross: $('#part_cross').value, title: $('#part_number').value || $('#part_desc').value, notes: $('#part_cross').value }; state.parts.push(rec); save(); toast('Part saved'); render(); });
    $('#sendPartsQuote')?.addEventListener('click', () => makeQuickQuote('Parts quote', state.parts.slice(-5).map(p => `${p.qty || 1} x ${p.number || p.description} ${p.sell ? money(p.sell) : ''}`).join('\n')));
    $('#clearParts')?.addEventListener('click', () => clearInputs('parts'));

    $('#buildPmKit')?.addEventListener('click', () => { const engine = $('#pm_engine').value; const items = pmKits[engine] || []; saveKit(`PM Kit - ${engine}`, items, $('#pm_vin').value); $('#kitOutput').innerHTML = kitHtml(`PM Kit - ${engine}`, items); });
    $('#kitToQuote')?.addEventListener('click', () => { const k = state.kits.at(-1); if (k) makeQuickQuote(k.title, k.items.join('\n')); });
    $('#kitToWorkOrder')?.addEventListener('click', () => { const k = state.kits.at(-1); if (k) makeQuickWorkOrder(k.title, k.items.join('\n')); });
    $('#buildJobKit')?.addEventListener('click', () => { const name = $('#job_type').value; const items = commonJobs[name] || []; saveKit(name, items, $('#job_unit').value); $('#jobKitOutput').innerHTML = kitHtml(name, items); });
    $('#jobKitQuote')?.addEventListener('click', () => { const k = state.kits.at(-1); if (k) makeQuickQuote(k.title, k.items.join('\n')); });
    $('#jobKitWo')?.addEventListener('click', () => { const k = state.kits.at(-1); if (k) makeQuickWorkOrder(k.title, k.items.join('\n')); });

    $('#takePhoto')?.addEventListener('change', previewPhoto);
    $('#uploadPhoto')?.addEventListener('change', previewPhoto);
    $('#readOcr')?.addEventListener('click', parseOcr);
    $('#voiceOcr')?.addEventListener('click', voiceNote);
    $('#clearOcr')?.addEventListener('click', () => { $('#ocr_text').value = ''; $('#photoPreview').innerHTML = ''; $('#ocrOutput').innerHTML = ''; });
    $('#saveOcr')?.addEventListener('click', () => { const out = parseOcr(false); state.ocr.push({ id: uid(), created: now(), title: out.vins[0] || out.parts[0] || 'OCR Scan', notes: $('#ocr_text').value, summary: JSON.stringify(out) }); save(); toast('OCR saved'); render(); });
    $('#ocrToParts')?.addEventListener('click', () => { const out = parseOcr(false); out.parts.forEach(n => state.parts.push({ id: uid(), created: now(), number: n, vin: out.vins[0] || state.active.vin, title: n, notes: 'From OCR' })); save(); toast('Sent OCR parts'); nav('parts'); });
    $('#ocrToQuote')?.addEventListener('click', () => makeQuickQuote('OCR quote', $('#ocr_text').value));
    $('#ocrToWo')?.addEventListener('click', () => makeQuickWorkOrder('OCR work order', $('#ocr_text').value));
    $('#ocrToInvoice')?.addEventListener('click', () => makeQuickInvoice('OCR invoice', $('#ocr_text').value));
    $('#ocrToUnit')?.addEventListener('click', () => { const out = parseOcr(false); state.active.vin = out.vins[0] || state.active.vin; save(); toast('VIN sent to unit'); nav('vin'); });

    ['customers','units','schedule','pm','gps','memory'].forEach(key => {
      $(`#save_${key}`)?.addEventListener('click', () => saveSimple(key));
      $(`#clear_${key}`)?.addEventListener('click', () => $$(`[id^="${key}_"]`).forEach(i => i.value = ''));
    });

    ['quotes','workOrders','invoices'].forEach(key => {
      const canvas = $(`#${key}_sig`); if (canvas) setupSignature(canvas);
      $(`#clearSig_${key}`)?.addEventListener('click', () => { const c = $(`#${key}_sig`); c.getContext('2d').clearRect(0,0,c.width,c.height); });
      $(`#save_${key}`)?.addEventListener('click', () => saveDoc(key));
      $(`#clear_${key}`)?.addEventListener('click', () => $$(`[id^="${key}_"]`).forEach(i => { if (i.tagName === 'INPUT' || i.tagName === 'TEXTAREA') i.value = ''; }));
      $(`#send_${key}`)?.addEventListener('click', () => sendDoc(key));
    });
    $('#quoteToWo')?.addEventListener('click', () => { const q = state.quotes.at(-1); if (!q) return toast('No quote saved'); makeQuickWorkOrder(`From ${q.number}`, q.notes, q); });
    $('#woToInvoice')?.addEventListener('click', () => { const w = state.workOrders.at(-1); if (!w) return toast('No work order saved'); makeQuickInvoice(`From ${w.number}`, w.notes, w); });

    $$('[data-start]').forEach(b => b.addEventListener('click', () => clockStart(b.dataset.start)));
    $$('[data-pause]').forEach(b => b.addEventListener('click', () => clockPause(b.dataset.pause)));
    $$('[data-stop]').forEach(b => b.addEventListener('click', () => { state.clocks[b.dataset.stop].sec = 0; state.clocks[b.dataset.stop].run = false; save(); render(); }));
    $$('.clock-name').forEach(i => i.addEventListener('change', () => { state.clocks[i.dataset.clockName].name = i.value; save(); }));

    $('#saveSettings')?.addEventListener('click', saveSettings);
    $('#exportData')?.addEventListener('click', exportData);
    $('#clearAllData')?.addEventListener('click', () => { if (confirm('Clear all BA001 local data?')) { localStorage.removeItem(STORE); state = structuredClone(defaultState); save(); render(); } });
  }

  function decodeYear(ch) { const map = {A:2010,B:2011,C:2012,D:2013,E:2014,F:2015,G:2016,H:2017,J:2018,K:2019,L:2020,M:2021,N:2022,P:2023,R:2024,S:2025,T:2026,V:2027,W:2028,X:2029,Y:2030,1:2001,2:2002,3:2003,4:2004,5:2005,6:2006,7:2007,8:2008,9:2009}; return map[ch] || 'UNKNOWN'; }
  function saveKit(title, items, unit) { state.kits.push({ id: uid(), created: now(), title, items, unit, notes: items.join(', ') }); save(); toast('Kit built and saved'); }
  function kitHtml(title, items) { return `<b>${esc(title)}</b><ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`; }
  function parseOcr(show = true) { const text = $('#ocr_text')?.value || ''; const vins = [...new Set((text.match(/\b[A-HJ-NPR-Z0-9]{17}\b/gi) || []).map(x => x.toUpperCase()))]; const parts = [...new Set((text.match(/\b[A-Z0-9][A-Z0-9\-]{4,20}\b/gi) || []).filter(x => !vins.includes(x.toUpperCase())).slice(0,20))]; const prices = text.match(/\$?\b\d{1,5}\.\d{2}\b/g) || []; const out = { vins, parts, prices }; if (show) $('#ocrOutput').innerHTML = `<b>OCR RESULTS</b><p>VINs: ${vins.join(', ') || 'None found'}</p><p>Parts: ${parts.join(', ') || 'None found'}</p><p>Prices: ${prices.join(', ') || 'None found'}</p>`; return out; }
  function previewPhoto(e) { const file = e.target.files?.[0]; if (!file) return; const url = URL.createObjectURL(file); $('#photoPreview').innerHTML = `<img src="${url}" alt="Selected photo"><p>${esc(file.name)} ready. Use OCR text box after reading.</p>`; }
  function voiceNote() { const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return toast('Voice not supported on this browser'); const rec = new SR(); rec.lang = 'en-US'; rec.onresult = (e) => { $('#ocr_text').value += ' ' + e.results[0][0].transcript; toast('Voice added'); }; rec.start(); }
  function clearInputs(scope) { $$('input,textarea,select').forEach(i => { if (i.id && i.id.includes(scope)) i.value = ''; }); }
  function saveSimple(key) { const rec = { id: uid(), created: now() }; $$(`[id^="${key}_"]`).forEach(i => rec[i.id.replace(`${key}_`, '')] = i.value); rec.title = rec.name || rec.unit || rec.customer || rec.date || rec.repair || key; state[key].push(rec); if (key === 'customers') state.active.customer = rec.name || state.active.customer; if (key === 'units') { state.active.unit = rec.unit || state.active.unit; state.active.vin = rec.vin || state.active.vin; } save(); toast('Saved'); render(); }
  function docTotal(key) { const labor = Number($(`#${key}_labor`)?.value || 0) * Number($(`#${key}_rate`)?.value || state.settings.laborRate); const parts = Number($(`#${key}_parts`)?.value || 0); const service = Number($(`#${key}_service`)?.value || 0); const sub = labor + parts + service; return sub + sub * Number($(`#${key}_tax`)?.value || 0) / 100; }
  function saveDoc(key) { const type = key === 'quotes' ? 'quote' : key === 'invoices' ? 'invoice' : 'workOrder'; const prefix = key === 'quotes' ? state.settings.quotePrefix : key === 'invoices' ? state.settings.invoicePrefix : state.settings.workOrderPrefix; const rec = { id: uid(), created: now(), number: prefix + String(nextNumber(type)).padStart(4,'0'), customer: $(`#${key}_customer`).value, unit: $(`#${key}_unit`).value, vin: $(`#${key}_vin`).value, labor: $(`#${key}_labor`).value, rate: $(`#${key}_rate`).value, parts: $(`#${key}_parts`).value, service: $(`#${key}_service`).value, tax: $(`#${key}_tax`).value, notes: $(`#${key}_notes`).value, total: docTotal(key), title: '' }; rec.title = `${rec.number} ${rec.customer || ''}`; state[key].push(rec); state.active.customer = rec.customer || state.active.customer; state.active.unit = rec.unit || state.active.unit; state.active.vin = rec.vin || state.active.vin; save(); toast(`${rec.number} saved`); $(`#${key}_preview`).innerHTML = `<b>${esc(rec.number)} SAVED</b><p>Total: ${money(rec.total)}</p><p>Ready to send to customer.</p>`; }
  function sendDoc(key) { const doc = state[key].at(-1); if (!doc) return toast('Save first'); const text = `${state.settings.shopName} ${doc.number}\nCustomer: ${doc.customer}\nUnit: ${doc.unit}\nTotal: ${money(doc.total)}\n${state.settings.phone}`; if (navigator.share) navigator.share({ title: doc.number, text }).catch(() => navigator.clipboard?.writeText(text)); else navigator.clipboard?.writeText(text); toast('Customer send/share ready'); }
  function makeQuickQuote(title, notes) { const rec = { id: uid(), created: now(), number: state.settings.quotePrefix + String(nextNumber('quote')).padStart(4,'0'), customer: state.active.customer, unit: state.active.unit, vin: state.active.vin, notes, total: 0, title }; state.quotes.push(rec); save(); toast('Quote created'); nav('quotes'); }
  function makeQuickWorkOrder(title, notes, from = {}) { const rec = { id: uid(), created: now(), number: state.settings.workOrderPrefix + String(nextNumber('workOrder')).padStart(4,'0'), customer: from.customer || state.active.customer, unit: from.unit || state.active.unit, vin: from.vin || state.active.vin, notes, total: from.total || 0, title }; state.workOrders.push(rec); save(); toast('Work order created'); nav('workOrders'); }
  function makeQuickInvoice(title, notes, from = {}) { const rec = { id: uid(), created: now(), number: state.settings.invoicePrefix + String(nextNumber('invoice')).padStart(4,'0'), customer: from.customer || state.active.customer, unit: from.unit || state.active.unit, vin: from.vin || state.active.vin, notes, total: from.total || 0, title }; state.invoices.push(rec); save(); toast('Invoice created'); nav('invoices'); }
  function clockStart(k) { const c = state.clocks[k]; if (!c.run) { c.run = true; c.start = Date.now(); save(); } render(); }
  function clockPause(k) { const c = state.clocks[k]; if (c.run) { c.sec += Math.floor((Date.now() - c.start) / 1000); c.run = false; c.start = 0; save(); } render(); }
  function saveSettings() { Object.keys(state.settings).forEach(k => { const el = $(`#set_${k}`); if (!el) return; state.settings[k] = el.type === 'checkbox' ? el.checked : el.value; }); save(); toast('Settings saved'); render(); }
  function exportData() { const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'BA001-backup.json'; a.click(); }
  function setupSignature(canvas) { const ctx = canvas.getContext('2d'); ctx.lineWidth = 4; ctx.lineCap = 'round'; let drawing = false; const pos = (e) => { const r = canvas.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e; return { x: (p.clientX-r.left) * canvas.width/r.width, y: (p.clientY-r.top) * canvas.height/r.height }; }; const start = e => { drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault(); }; const move = e => { if (!drawing) return; const p = pos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); e.preventDefault(); }; const end = () => { drawing = false; }; canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); window.addEventListener('mouseup', end); canvas.addEventListener('touchstart', start, {passive:false}); canvas.addEventListener('touchmove', move, {passive:false}); canvas.addEventListener('touchend', end); }

  document.addEventListener('DOMContentLoaded', render);
  if (document.readyState !== 'loading') render();
  setInterval(() => { if (state.view === 'home' || state.view === 'clock') render(); }, 1000);
})();
