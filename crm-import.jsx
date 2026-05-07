// Excel/CSV Import Screen
const { useState: useState4, useRef: useRef4, useCallback } = React;

// ── DUPLICATE DETECTION ────────────────────────────────────────────
function normalizePhone(p) { return (p||'').replace(/[\s\-\+\(\)\.]/g,''); }
function normalizeCompany(c) { return (c||'').toLowerCase().replace(/[^a-z0-9]/g,''); }

function findDuplicate(newContact, existingContacts) {
  const ph = normalizePhone(newContact.phone);
  const co = normalizeCompany(newContact.company);
  return existingContacts.find(c => {
    const phoneMatch = ph.length > 4 && ph === normalizePhone(c.phone);
    const companyMatch = co.length > 2 && co === normalizeCompany(c.company);
    return phoneMatch || companyMatch;
  }) || null;
}

const FIELD_MAP_OPTIONS = [
  { value:'', label:'— Skip —' },
  { value:'company', label:'Company Name' },
  { value:'contactPerson', label:'Contact Person (full name)' },
  { value:'firstName', label:'First Name' },
  { value:'lastName', label:'Last Name' },
  { value:'title', label:'Job Title' },
  { value:'phone', label:'Phone Number' },
  { value:'altPhone', label:'Alt Phone' },
  { value:'email', label:'Email Address' },
  { value:'notes', label:'Notes' },
  { value:'website', label:'Website' },
  { value:'address', label:'Address' },
];

const AUTO_MAP = {
  company:       ['company name','company','business name','organisation','organization','trading name','store'],
  firstName:     ['first name'],
  lastName:      ['last name','surname','family name'],
  contactPerson: ['contact person','full name','contact','person','owner'],
  title:         ['title','job title','position','role','designation'],
  phone:         ['work direct phone','direct phone','work phone','phone number','phone','telephone','tel','mobile phone','mobile','cell'],
  altPhone:      ['corporate phone','other phone','home phone','alternate phone','alt phone'],
  email:         ['email','e-mail','email address','mail'],
  notes:         ['notes','note','comments','description','remarks'],
  website:       ['website','url','web','site','domain'],
  address:       ['company address','address','location','street','physical address'],
};

function autoDetect(header) {
  const h = header.toLowerCase().trim();
  for (const [field, keywords] of Object.entries(AUTO_MAP)) {
    if (keywords.some(k => h.includes(k))) return field;
  }
  return '';
}

function ImportLeads({ onImport, existingContacts = [] }) {
  const [step, setStep] = useState4('upload'); // upload | map | preview | done
  const [rawData, setRawData] = useState4(null);
  const [headers, setHeaders] = useState4([]);
  const [mapping, setMapping] = useState4({});
  const [preview, setPreview] = useState4([]);
  const [duplicateRows, setDuplicateRows] = useState4({}); // index -> existing contact
  const [skipDuplicates, setSkipDuplicates] = useState4(true);
  const [importing, setImporting] = useState4(false);
  const [importCount, setImportCount] = useState4(0);
  const [dragOver, setDragOver] = useState4(false);
  const fileRef = useRef4();

  const parseFile = async (file) => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv')) {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l=>l.trim());
      const headers = lines[0].split(',').map(h=>h.replace(/^"|"$/g,'').trim());
      const rows = lines.slice(1).map(line => {
        const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g) || line.split(',');
        return cols.map(c=>c.replace(/^"|"$/g,'').trim());
      }).filter(r=>r.some(c=>c));
      return { headers, rows };
    } else {
      // Excel via SheetJS
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type:'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
      const headers = (json[0]||[]).map(h=>String(h).trim());
      const rows = json.slice(1).filter(r=>r.some(c=>String(c).trim())).map(r=>r.map(c=>String(c)));
      return { headers, rows };
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    const parsed = await parseFile(file);
    setHeaders(parsed.headers);
    setRawData(parsed.rows);
    const autoMapping = {};
    parsed.headers.forEach((h,i) => { autoMapping[i] = autoDetect(h); });
    setMapping(autoMapping);
    setStep('map');
  };

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const buildPreview = () => {
    const rows = (rawData||[]).slice(0,5).map(row => {
      const obj = {};
      Object.entries(mapping).forEach(([colIdx, field]) => {
        if (field) {
          const val = (row[colIdx] || '').replace(/^'+/, '').trim();
          if (val && !obj[field]) obj[field] = val;
        }
      });
      const contactPerson = obj.contactPerson || [obj.firstName, obj.lastName].filter(Boolean).join(' ') || '';
      return { ...obj, contactPerson };
    });
    // Detect duplicates across ALL rows (not just preview)
    const allRows = (rawData||[]).map((row, i) => {
      const obj = {};
      Object.entries(mapping).forEach(([colIdx, field]) => {
        if (field) {
          const val = (row[colIdx] || '').replace(/^'+/, '').trim();
          if (val && !obj[field]) obj[field] = val;
        }
      });
      const contactPerson = obj.contactPerson || [obj.firstName, obj.lastName].filter(Boolean).join(' ') || '';
      return { idx: i, ...obj, contactPerson };
    });
    const dupMap = {};
    allRows.forEach(({ idx, ...row }) => {
      const dup = findDuplicate(row, existingContacts);
      if (dup) dupMap[idx] = dup;
    });
    setDuplicateRows(dupMap);
    setPreview(rows);
    setStep('preview');
  };

  const doImport = () => {
    setImporting(true);
    const newContacts = (rawData||[]).map((row,i) => {
      // Skip duplicates if user chose to
      if (skipDuplicates && duplicateRows[i]) return null;

      // First non-empty value wins when multiple columns map to the same field
      const obj = {};
      Object.entries(mapping).forEach(([colIdx, field]) => {
        if (field) {
          const val = (row[colIdx] || '').replace(/^'+/, '').trim(); // strip Apollo's leading apostrophe
          if (val && !obj[field]) obj[field] = val;
        }
      });

      // Combine First Name + Last Name into contactPerson if separate columns were mapped
      const contactPerson = obj.contactPerson ||
        [obj.firstName, obj.lastName].filter(Boolean).join(' ') || '';

      return {
        id: 'imp_' + Date.now() + '_' + i,
        company: obj.company || 'Unknown Company',
        contactPerson,
        title: obj.title || '',
        phone: obj.phone || '',
        altPhone: obj.altPhone || '',
        email: obj.email || '',
        notes: [obj.notes, obj.website?`Website: ${obj.website}`:'', obj.address?`Address: ${obj.address}`:''].filter(Boolean).join('\n'),
        stage: 'New Lead',
        services: [],
        quoteAmount: 0,
        lastCallDate: null,
        nextActionDate: null,
        nextAction: 'First call — intro',
        callLog: [],
        assignedTo: 'u1',
      };
    }).filter(c => c && (c.company !== 'Unknown Company' || c.phone));
    setTimeout(() => {
      onImport(newContacts);
      setImportCount(newContacts.length);
      setImporting(false);
      setStep('done');
    }, 600);
  };

  const reset = () => { setStep('upload'); setRawData(null); setHeaders([]); setMapping({}); setPreview([]); };

  return (
    <div style={{ padding:'28px 32px', maxWidth:820 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:700, color:'#1A1D2E', margin:0 }}>Import Leads</h1>
        <p style={{ color:'#6B7280', fontSize:13, margin:'4px 0 0' }}>Upload an Excel or CSV file from your Google Maps scraper — we'll map the columns and import them as New Leads.</p>
      </div>

      {/* Progress Steps */}
      <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:28 }}>
        {[['upload','1','Upload File'],['map','2','Map Columns'],['preview','3','Preview'],['done','4','Done']].map(([s,n,l],i,arr) => {
          const idx = ['upload','map','preview','done'].indexOf(step);
          const si = ['upload','map','preview','done'].indexOf(s);
          const active = si===idx, done2 = si<idx;
          return (
            <React.Fragment key={s}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background:done2?NAVY:active?GOLD:' #E5E7EB', color:done2||active?'#fff':' #9CA3AF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
                  {done2?'✓':n}
                </div>
                <span style={{ fontSize:12, fontWeight:active?700:500, color:active?'#1A1D2E':'#9CA3AF' }}>{l}</span>
              </div>
              {i<arr.length-1 && <div style={{ flex:1, height:1, background:'#E5E7EB', margin:'0 12px' }}></div>}
            </React.Fragment>
          );
        })}
      </div>

      {/* STEP 1: Upload */}
      {step==='upload' && (
        <div
          onDragOver={e=>{e.preventDefault();setDragOver(true);}}
          onDragLeave={()=>setDragOver(false)}
          onDrop={handleDrop}
          onClick={()=>fileRef.current.click()}
          style={{ border:`2px dashed ${dragOver?NAVY:'#D1D5DB'}`, borderRadius:16, padding:'56px 32px', textAlign:'center', cursor:'pointer', background:dragOver?`${NAVY}08`:'#fff', transition:'all 0.2s' }}>
          <div style={{ width:56, height:56, borderRadius:12, background:`${NAVY}12`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" size={28} color={NAVY} />
          </div>
          <div style={{ fontSize:16, fontWeight:700, color:'#1A1D2E', marginBottom:6 }}>Drop your file here or click to browse</div>
          <div style={{ fontSize:13, color:'#9CA3AF' }}>Supports <strong>.xlsx</strong>, <strong>.xls</strong>, and <strong>.csv</strong> files</div>
          <div style={{ marginTop:20, display:'inline-block', padding:'8px 20px', background:NAVY, color:'#fff', borderRadius:8, fontSize:13, fontWeight:600 }}>Choose File</div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])} />
        </div>
      )}

      {/* STEP 2: Map Columns */}
      {step==='map' && (
        <div>
          <div style={{ background:'#fff', border:'1px solid #E9EBF0', borderRadius:12, overflow:'hidden', marginBottom:20 }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #F3F4F6', background:'#F8F9FC' }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#1A1D2E' }}>Column Mapping</div>
              <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>{rawData?.length} rows detected · {headers.length} columns · We auto-detected what we could</div>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid #F3F4F6' }}>
                  <th style={{ padding:'10px 16px', fontSize:11, fontWeight:700, color:'#9CA3AF', textAlign:'left', textTransform:'uppercase', letterSpacing:'0.04em' }}>Your Column</th>
                  <th style={{ padding:'10px 16px', fontSize:11, fontWeight:700, color:'#9CA3AF', textAlign:'left', textTransform:'uppercase', letterSpacing:'0.04em' }}>Sample Data</th>
                  <th style={{ padding:'10px 16px', fontSize:11, fontWeight:700, color:'#9CA3AF', textAlign:'left', textTransform:'uppercase', letterSpacing:'0.04em' }}>Map To CRM Field</th>
                </tr>
              </thead>
              <tbody>
                {headers.map((h,i) => {
                  const sample = (rawData||[]).slice(0,3).map(r=>r[i]).filter(Boolean).join(' / ');
                  const mapped = mapping[i]||'';
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid #F9FAFB' }}>
                      <td style={{ padding:'10px 16px', fontSize:13, fontWeight:600, color:'#374151' }}>{h}</td>
                      <td style={{ padding:'10px 16px', fontSize:12, color:'#9CA3AF', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sample||'—'}</td>
                      <td style={{ padding:'10px 16px' }}>
                        <select value={mapped} onChange={e=>setMapping(p=>({...p,[i]:e.target.value}))} style={{ padding:'6px 10px', border:`1.5px solid ${mapped?NAVY:'#E5E7EB'}`, borderRadius:7, fontSize:12, outline:'none', background:mapped?`${NAVY}08`:'#fff', color:mapped?NAVY:'#6B7280', fontWeight:mapped?600:400 }}>
                          {FIELD_MAP_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={reset} style={{ padding:'8px 18px', border:'1.5px solid #E5E7EB', borderRadius:8, background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>← Back</button>
            <button onClick={buildPreview} style={{ padding:'8px 20px', border:'none', borderRadius:8, background:NAVY, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>Preview Import →</button>
          </div>
        </div>
      )}

      {/* STEP 3: Preview */}
      {step==='preview' && (
        <div>
          {/* Duplicate warning banner */}
          {Object.keys(duplicateRows).length > 0 && (
            <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'flex-start', gap:10 }}>
              <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" size={16} color='#C2410C' />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#C2410C' }}>{Object.keys(duplicateRows).length} duplicate{Object.keys(duplicateRows).length>1?'s':''} detected</div>
                <div style={{ fontSize:12, color:'#92400E', marginTop:2 }}>These leads already exist in your CRM (matched by phone or company name).</div>
                <div style={{ marginTop:10, display:'flex', gap:8 }}>
                  <button onClick={()=>setSkipDuplicates(true)} style={{ padding:'5px 12px', borderRadius:7, border:'none', background:skipDuplicates?'#C2410C':'#FED7AA', color:skipDuplicates?'#fff':'#92400E', fontSize:12, fontWeight:700, cursor:'pointer' }}>Skip duplicates ({Object.keys(duplicateRows).length})</button>
                  <button onClick={()=>setSkipDuplicates(false)} style={{ padding:'5px 12px', borderRadius:7, border:'none', background:!skipDuplicates?'#374151':'#E5E7EB', color:!skipDuplicates?'#fff':'#6B7280', fontSize:12, fontWeight:700, cursor:'pointer' }}>Import anyway</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ background:'#fff', border:'1px solid #E9EBF0', borderRadius:12, overflow:'hidden', marginBottom:20 }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #F3F4F6', background:'#F8F9FC', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:'#1A1D2E' }}>Import Preview</div>
                <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>Showing first 5 of {rawData?.length} rows — all will be added as <strong>New Lead</strong></div>
              </div>
              <span style={{ background:'#ECFDF5', color:'#065F46', fontSize:12, fontWeight:700, borderRadius:99, padding:'3px 10px' }}>
                {skipDuplicates ? rawData?.length - Object.keys(duplicateRows).length : rawData?.length} leads
              </span>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid #F3F4F6' }}>
                    {['','Company','Contact','Phone','Email','Notes'].map(h=>(
                      <th key={h} style={{ padding:'9px 14px', fontSize:11, fontWeight:700, color:'#9CA3AF', textAlign:'left', textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row,i)=>{
                    const dup = duplicateRows[i];
                    const skipped = dup && skipDuplicates;
                    return (
                      <tr key={i} style={{ borderBottom:'1px solid #F9FAFB', opacity: skipped ? 0.45 : 1, background: dup ? '#FFFBEB' : 'transparent' }}>
                        <td style={{ padding:'9px 14px', width:24 }}>
                          {dup && <span title={`Duplicate of: ${dup.company}`} style={{ fontSize:13 }}>⚠️</span>}
                        </td>
                        <td style={{ padding:'9px 14px', fontSize:12, fontWeight:600, color:'#1A1D2E' }}>
                          {row.company||'—'}
                          {dup && <div style={{ fontSize:10, color:'#D97706', marginTop:2 }}>Exists as "{dup.company}"</div>}
                        </td>
                        <td style={{ padding:'9px 14px', fontSize:12, color:'#374151' }}>{row.contactPerson||'—'}</td>
                        <td style={{ padding:'9px 14px', fontSize:12, color:'#6B7280', fontFamily:'monospace' }}>{row.phone||'—'}</td>
                        <td style={{ padding:'9px 14px', fontSize:12, color:'#6B7280' }}>{row.email||'—'}</td>
                        <td style={{ padding:'9px 14px', fontSize:12, color:'#9CA3AF', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.notes||'—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={()=>setStep('map')} style={{ padding:'8px 18px', border:'1.5px solid #E5E7EB', borderRadius:8, background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>← Back</button>
            <button onClick={doImport} disabled={importing} style={{ padding:'8px 24px', border:'none', borderRadius:8, background:importing?'#6B7280':GOLD, color:NAVY, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
              {importing ? '⏳ Importing…' : `✓ Import ${skipDuplicates ? (rawData?.length - Object.keys(duplicateRows).length) : rawData?.length} Leads`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Done */}
      {step==='done' && (
        <div style={{ textAlign:'center', padding:'48px 32px', background:'#fff', borderRadius:16, border:'1px solid #E9EBF0' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'#ECFDF5', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:28 }}>✓</div>
          <h2 style={{ fontSize:20, fontWeight:800, color:'#1A1D2E', marginBottom:8 }}>{importCount} leads imported!</h2>
          <p style={{ color:'#6B7280', fontSize:14, marginBottom:24 }}>All contacts added as <strong>New Lead</strong> and ready in your Call Queue.</p>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={reset} style={{ padding:'9px 20px', border:'1.5px solid #E5E7EB', borderRadius:8, background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>Import Another File</button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ImportLeads });
