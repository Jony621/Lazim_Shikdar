import './style.css';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const state = {
  lang: 'en',
  tender: null,
  requirements: [],
  files: [],
  busy: false,
  message: '',
  messageType: 'info'
};

const t = {
  en: {
    app: 'Tender Package Builder', subtitle: 'Build a checked, ordered tender PDF package — entirely in your browser.',
    load: 'Load requirements.json', upload: 'Upload PDF files', choose: 'Choose JSON', add: 'Add PDFs',
    tender: 'Tender Details', requirements: 'Document Checklist', uploads: 'Uploaded Files',
    match: 'Match', expiry: 'Expiry date', status: 'Status', file: 'File', pages: 'Pages',
    remove: 'Remove', generate: 'Generate Package', download: 'Download package',
    missing: 'Missing', expiryNeeded: 'Expiry date needed', expired: 'Expired',
    notProvided: 'Not provided', ok: 'OK', duplicate: 'Duplicate', noFiles: 'No files uploaded yet.',
    noReq: 'Load a requirements.json file to begin.', ready: 'Ready', blocking: 'Blocking',
    total: 'Total', matched: 'Matched', included: 'Included', deadline: 'Submission deadline',
    bidder: 'Bidder', entity: 'Procuring entity', made: 'Package made', language: 'Language',
    drop: 'Drop PDFs here or click to browse', limits: 'Up to 30 PDF files • 50 MB total',
    generated: 'Package generated successfully.', invalidJson: 'Invalid requirements.json format.',
    invalidPdf: 'Only PDF files are accepted.', tooMany: 'Maximum 30 files.', tooLarge: 'Total size cannot exceed 50 MB.',
    badPdf: 'This PDF could not be read. It may be damaged or password-protected.',
    duplicateHint: 'Same PDF content as another uploaded file.',
    select: 'Select document…', clear: 'Unmatch', cover: 'Cover page',
    includedDocs: 'Included documents'
  },
  bn: {
    app: 'টেন্ডার প্যাকেজ বিল্ডার', subtitle: 'ব্রাউজারের মধ্যেই যাচাই ও সঠিক ক্রমে টেন্ডার PDF প্যাকেজ তৈরি করুন।',
    load: 'requirements.json লোড করুন', upload: 'PDF ফাইল আপলোড', choose: 'JSON নির্বাচন', add: 'PDF যোগ করুন',
    tender: 'টেন্ডারের তথ্য', requirements: 'ডকুমেন্ট চেকলিস্ট', uploads: 'আপলোড করা ফাইল',
    match: 'ম্যাচ', expiry: 'মেয়াদ শেষ', status: 'স্ট্যাটাস', file: 'ফাইল', pages: 'পৃষ্ঠা',
    remove: 'মুছুন', generate: 'প্যাকেজ তৈরি করুন', download: 'প্যাকেজ ডাউনলোড',
    missing: 'অনুপস্থিত', expiryNeeded: 'মেয়াদ শেষের তারিখ দরকার', expired: 'মেয়াদ শেষ',
    notProvided: 'দেওয়া হয়নি', ok: 'ঠিক আছে', duplicate: 'ডুপ্লিকেট', noFiles: 'এখনো কোনো ফাইল আপলোড হয়নি।',
    noReq: 'শুরু করতে requirements.json লোড করুন।', ready: 'প্রস্তুত', blocking: 'সমস্যা আছে',
    total: 'মোট', matched: 'ম্যাচ হয়েছে', included: 'অন্তর্ভুক্ত', deadline: 'জমাদানের শেষ তারিখ',
    bidder: 'বিডার', entity: 'ক্রয়কারী প্রতিষ্ঠান', made: 'প্যাকেজ তৈরির তারিখ', language: 'ভাষা',
    drop: 'এখানে PDF ছেড়ে দিন অথবা ব্রাউজ করতে ক্লিক করুন', limits: 'সর্বোচ্চ ৩০টি PDF • মোট ৫০ MB',
    generated: 'প্যাকেজ সফলভাবে তৈরি হয়েছে।', invalidJson: 'requirements.json ফরম্যাট সঠিক নয়।',
    invalidPdf: 'শুধু PDF ফাইল গ্রহণ করা হবে।', tooMany: 'সর্বোচ্চ ৩০টি ফাইল।', tooLarge: 'মোট ফাইল ৫০ MB-এর বেশি হতে পারবে না।',
    badPdf: 'PDF পড়া যায়নি। ফাইলটি নষ্ট বা পাসওয়ার্ড-সুরক্ষিত হতে পারে।',
    duplicateHint: 'অন্য আপলোড করা ফাইলের সঙ্গে একই PDF কনটেন্ট।',
    select: 'ডকুমেন্ট নির্বাচন করুন…', clear: 'ম্যাচ বাতিল', cover: 'কভার পৃষ্ঠা',
    includedDocs: 'অন্তর্ভুক্ত ডকুমেন্ট'
  }
};

const $ = (s) => document.querySelector(s);
const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tr = k => t[state.lang][k] ?? k;

function render() {
  document.documentElement.lang = state.lang === 'bn' ? 'bn' : 'en';
  document.title = tr('app');
  const reqs = state.requirements;
  const statuses = reqs.map(r => getStatus(r));
  const blocking = statuses.filter(s => s.blocking).length;
  const matched = reqs.filter(r => r.fileId).length;

  $('#app').innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">TB</div>
          <div><h1>${tr('app')}</h1><p>${tr('subtitle')}</p></div>
        </div>
        <div class="actions">
          <button class="ghost" id="langBtn">${state.lang === 'en' ? 'বাংলা' : 'English'}</button>
          <label class="button secondary">${tr('load')}<input id="jsonInput" type="file" accept=".json,application/json" hidden></label>
          <label class="button primary">${tr('add')}<input id="pdfInput" type="file" accept="application/pdf,.pdf" multiple hidden></label>
        </div>
      </header>

      ${state.message ? `<div class="toast ${state.messageType}">${esc(state.message)}</div>` : ''}

      ${state.tender ? `
      <section class="hero">
        <div>
          <div class="eyebrow">${esc(state.tender.tender_id || '')}</div>
          <h2>${esc(state.tender.title || 'Tender')}</h2>
          <p>${esc(state.tender.procuring_entity || '')}</p>
        </div>
        <div class="hero-meta">
          <span>${tr('bidder')}<b>${esc(state.tender.bidder || '—')}</b></span>
          <span>${tr('deadline')}<b>${esc(state.tender.submission_deadline || '—')}</b></span>
        </div>
      </section>

      <section class="stats">
        <div><small>${tr('total')}</small><strong>${reqs.length}</strong></div>
        <div><small>${tr('matched')}</small><strong>${matched}</strong></div>
        <div><small>${tr('included')}</small><strong>${reqs.filter(r => r.fileId && !getStatus(r).blocking).length}</strong></div>
        <div class="${blocking ? 'badstat' : 'goodstat'}"><small>${blocking ? tr('blocking') : tr('ready')}</small><strong>${blocking}</strong></div>
      </section>

      <main class="grid">
        <section class="panel checklist">
          <div class="panel-head"><div><h3>${tr('requirements')}</h3><p>1 → ${reqs.length}</p></div>
          <button class="button generate" id="generateBtn" ${blocking || state.busy ? 'disabled' : ''}>${state.busy ? 'Building…' : tr('generate')}</button></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>#</th><th>${tr('status')}</th><th>${tr('file')}</th><th>${tr('expiry')}</th></tr></thead>
              <tbody>
                ${reqs.map((r,i) => renderRequirement(r,i,statuses[i])).join('')}
              </tbody>
            </table>
          </div>
        </section>

        <aside class="panel uploads">
          <div class="panel-head"><div><h3>${tr('uploads')}</h3><p>${state.files.length}/30</p></div></div>
          <label class="dropzone" id="dropzone">
            <div class="upload-icon">↑</div><strong>${tr('drop')}</strong><span>${tr('limits')}</span>
            <input id="pdfInput2" type="file" accept="application/pdf,.pdf" multiple hidden>
          </label>
          <div class="file-list">${state.files.length ? state.files.map(renderFile).join('') : `<div class="empty">${tr('noFiles')}</div>`}</div>
        </aside>
      </main>
      ` : `
      <section class="empty-start">
        <div class="empty-logo">TB</div>
        <h2>${tr('noReq')}</h2>
        <p>${tr('load')} to start.</p>
        <label class="button primary">${tr('choose')}<input id="jsonInput2" type="file" accept=".json,application/json" hidden></label>
      </section>`}
    </div>`;

  bindEvents();
}

function renderRequirement(r, i, s) {
  const file = state.files.find(f => f.id === r.fileId);
  const title = state.lang === 'bn' ? (r.title_bn || r.title_en) : r.title_en;
  return `<tr>
    <td><span class="order">${r.order ?? i+1}</span></td>
    <td><span class="status ${s.cls}"><i></i>${s.label}</span></td>
    <td>
      <div class="doc-title"><b>${esc(title)}</b>${r.mandatory ? '<em>Required</em>' : '<em class="optional">Optional</em>'}</div>
      <select data-req="${esc(r.id)}">
        <option value="">${tr('select')}</option>
        ${state.files.map(f => `<option value="${esc(f.id)}" ${r.fileId===f.id?'selected':''} ${f.duplicate && r.fileId!==f.id?'disabled':''}>${esc(f.name)}${f.duplicate?' • '+tr('duplicate'):''}</option>`).join('')}
      </select>
    </td>
    <td>${r.has_expiry && file ? `<input class="date-input" type="date" data-expiry="${esc(r.id)}" value="${esc(r.expiryDate||'')}">` : (r.has_expiry ? '<span class="muted">—</span>' : '<span class="muted">Not required</span>')}</td>
  </tr>`;
}

function renderFile(f) {
  const usedBy = state.requirements.find(r => r.fileId === f.id);
  return `<div class="file-row ${f.duplicate ? 'dupe' : ''}">
    <div class="file-type">PDF</div>
    <div class="file-info"><b title="${esc(f.name)}">${esc(f.name)}</b><span>${f.pages ?? '—'} ${tr('pages')}${f.duplicate ? ' • '+tr('duplicate') : ''}</span></div>
    <button class="icon-btn" data-remove="${esc(f.id)}" title="${tr('remove')}">×</button>
  </div>`;
}

function getStatus(r) {
  const file = state.files.find(f => f.id === r.fileId);
  if (!file) return r.mandatory
    ? {label:tr('missing'),cls:'missing',blocking:true}
    : {label:tr('notProvided'),cls:'neutral',blocking:false};
  if (file.duplicate) return {label:tr('duplicate'),cls:'duplicate',blocking:true};
  if (r.has_expiry && !r.expiryDate) return {label:tr('expiryNeeded'),cls:'missing',blocking:true};
  if (r.has_expiry && r.expiryDate < state.tender.submission_deadline) return {label:tr('expired'),cls:'expired',blocking:true};
  return {label:tr('ok'),cls:'ok',blocking:false};
}

async function loadJSON(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data?.tender || !Array.isArray(data.requirements)) throw new Error();
    state.tender = data.tender;
    state.requirements = data.requirements.map(r => ({...r, fileId:null, expiryDate:''})).sort((a,b)=>(a.order||0)-(b.order||0));
    state.files = [];
    flash(state.lang === 'en' ? 'Requirements loaded.' : 'Requirements লোড হয়েছে।','success');
  } catch { flash(tr('invalidJson'),'error'); }
  render();
}

async function addPDFs(fileList) {
  const incoming = [...fileList];
  if (!incoming.length) return;
  if (state.files.length + incoming.length > 30) { flash(tr('tooMany'),'error'); return; }
  const currentBytes = state.files.reduce((a,f)=>a+f.size,0);
  const addBytes = incoming.reduce((a,f)=>a+f.size,0);
  if (currentBytes + addBytes > 50*1024*1024) { flash(tr('tooLarge'),'error'); return; }

  for (const file of incoming) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) { flash(`${file.name}: ${tr('invalidPdf')}`,'error'); continue; }
    try {
      const buf = await file.arrayBuffer();
      const hash = await sha256(buf);
      const pdf = await pdfjsLib.getDocument({data:buf.slice(0)}).promise;
      const duplicate = state.files.some(f => f.hash === hash);
      state.files.push({id: crypto.randomUUID(), name:file.name, size:file.size, bytes:buf, pages:pdf.numPages, hash, duplicate});
      if (duplicate) state.files.forEach(f => { if (f.hash===hash) f.duplicate=true; });
    } catch { flash(`${file.name}: ${tr('badPdf')}`,'error'); }
  }
  render();
}

async function sha256(buf) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

function flash(message,type='info') {
  state.message=message; state.messageType=type;
  setTimeout(()=>{ if(state.message===message){state.message=''; render();}}, 3500);
}

function bindEvents() {
  $('#langBtn')?.addEventListener('click',()=>{state.lang=state.lang==='en'?'bn':'en';render();});
  ['#jsonInput','#jsonInput2'].forEach(sel=>$(sel)?.addEventListener('change',e=>e.target.files[0]&&loadJSON(e.target.files[0])));
  ['#pdfInput','#pdfInput2'].forEach(sel=>$(sel)?.addEventListener('change',e=>addPDFs(e.target.files)));
  $('#dropzone')?.addEventListener('dragover',e=>{e.preventDefault();$('#dropzone').classList.add('drag')});
  $('#dropzone')?.addEventListener('dragleave',()=>$('#dropzone').classList.remove('drag'));
  $('#dropzone')?.addEventListener('drop',e=>{e.preventDefault();$('#dropzone').classList.remove('drag');addPDFs(e.dataTransfer.files)});
  document.querySelectorAll('select[data-req]').forEach(sel=>sel.addEventListener('change',e=>{
    const r=state.requirements.find(x=>x.id===e.target.dataset.req);
    const old = r.fileId;
    if (old && old !== e.target.value) { const oldReq=state.requirements.find(x=>x.fileId===e.target.value); if(oldReq) oldReq.fileId=null; }
    r.fileId=e.target.value||null;
    render();
  }));
  document.querySelectorAll('input[data-expiry]').forEach(inp=>inp.addEventListener('change',e=>{
    const r=state.requirements.find(x=>x.id===e.target.dataset.expiry); r.expiryDate=e.target.value; render();
  }));
  document.querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click',()=>{
    const id=btn.dataset.remove;
    state.requirements.forEach(r=>{if(r.fileId===id){r.fileId=null;r.expiryDate='';}});
    state.files=state.files.filter(f=>f.id!==id);
    state.files.forEach(f=>{f.duplicate=state.files.some(x=>x.id!==f.id&&x.hash===f.hash);});
    render();
  }));
  $('#generateBtn')?.addEventListener('click', generatePackage);
}

async function generatePackage() {
  state.busy=true; render();
  try {
    const out = await PDFDocument.create();
    const font = await out.embedFont(StandardFonts.Helvetica);
    const bold = await out.embedFont(StandardFonts.HelveticaBold);
    const included = state.requirements.filter(r=>r.fileId && !getStatus(r).blocking);
    const cover = out.addPage([595.28,841.89]);
    const {width,height}=cover.getSize();
    const navy=rgb(0.03,0.07,0.12);
    cover.drawRectangle({x:0,y:height-115,width,height:115,color:navy});
    cover.drawText('TENDER PACKAGE', {x:42,y:height-62,size:24,font:bold,color:rgb(1,1,1)});
    cover.drawText(state.tender.tender_id || '', {x:42,y:height-91,size:11,font,color:rgb(.75,.85,.95)});
    let y=height-155;
    const meta = [
      ['Tender Title',state.tender.title],['Procuring Entity',state.tender.procuring_entity],
      ['Bidder',state.tender.bidder],['Submission Deadline',state.tender.submission_deadline],
      ['Package Made',new Date().toISOString().slice(0,10)]
    ];
    for (const [k,v] of meta) {
      cover.drawText(k,{x:42,y,size:9,font:bold,color:rgb(.35,.4,.46)});
      cover.drawText(String(v||'—'),{x:190,y,size:11,font,color:rgb(.08,.1,.13)});
      y-=31;
    }
    y-=10;
    cover.drawText('Included Documents',{x:42,y,size:14,font:bold,color:navy}); y-=25;
    for (const r of included) {
      const title = r.title_en || r.title_bn || r.id;
      cover.drawText(`${r.order}. ${title}`,{x:52,y,size:10,font,color:rgb(.1,.12,.15)});
      y-=19;
      if(y<70) break;
    }

    for (const r of included) {
      const f=state.files.find(x=>x.id===r.fileId);
      const src=await PDFDocument.load(f.bytes);
      const pages=await out.copyPages(src,src.getPageIndices());
      pages.forEach(p=>out.addPage(p));
    }

    // Add footer to every page after all pages exist, preserving content bounds.
    const total=out.getPageCount();
    out.getPages().forEach((p,i)=>{
      const {width}=p.getSize();
      const text=`${state.tender.tender_id} | Page ${i+1} of ${total}`;
      p.drawRectangle({x:0,y:0,width,height:22,color:rgb(1,1,1),opacity:.92});
      p.drawText(text,{x:width/2-font.widthOfTextAtSize(text,8)/2,y:7,size:8,font,color:rgb(.25,.29,.34)});
    });

    const bytes=await out.save();
    const blob=new Blob([bytes],{type:'application/pdf'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`${state.tender.tender_id}_Package.pdf`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    flash(tr('generated'),'success');
  } catch(e) {
    console.error(e); flash(state.lang==='en'?'Could not generate the PDF. Check the uploaded files.':'PDF তৈরি করা যায়নি। আপলোড করা ফাইলগুলো পরীক্ষা করুন।','error');
  } finally { state.busy=false; render(); }
}

render();
