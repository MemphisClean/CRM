// Contact Detail Panel + Call Log Modal + Add/Edit Contact Modal
const { useState: useState3, useRef } = React;

const detailServiceOptions = window.CRM_DATA.services;
const detailOutcomeOptions = window.CRM_DATA.outcomes;
const detailStages = window.CRM_DATA.stages;

// ─── Recording Player ─────────────────────────────────────────────────────────
function RecordingPlayer({ callSid, currentUser }) {
  const [state,    setState]    = useState3('idle'); // idle|loading|notfound|ready|error
  const [audioUrl, setAudioUrl] = useState3(null);

  // Only admins can access recordings
  if (!callSid || !currentUser || currentUser.role !== 'admin') return null;

  const load = async () => {
    setState('loading');
    try {
      const settings = await (typeof fetchVoiceSettings === 'function' ? fetchVoiceSettings() : Promise.resolve({}));
      const tokenUrl = settings.tokenUrl;
      if (!tokenUrl) { setState('error'); return; }

      const recResp = await fetch(`${tokenUrl}?action=recordings&callSid=${encodeURIComponent(callSid)}`);
      if (!recResp.ok) { setState('error'); return; }
      const recData = await recResp.json();
      if (!recData.sid) { setState('notfound'); return; }

      const playResp = await fetch(`${tokenUrl}?action=play&sid=${encodeURIComponent(recData.sid)}`);
      if (!playResp.ok) { setState('error'); return; }
      const playData = await playResp.json();
      if (!playData.audio) { setState('error'); return; }

      const binary = atob(playData.audio);
      const bytes  = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(blob));
      setState('ready');
    } catch { setState('error'); }
  };

  if (state === 'idle') return (
    <button onClick={load} style={{ marginTop:5, marginLeft:13, fontSize:11, color:NAVY, background:`${NAVY}12`, border:`1px solid ${NAVY}25`, borderRadius:6, padding:'3px 9px', cursor:'pointer', fontWeight:600, display:'inline-flex', alignItems:'center', gap:4 }}>
      🎙 Play Recording
    </button>
  );
  if (state === 'loading') return (
    <span style={{ marginTop:5, marginLeft:13, fontSize:11, color:'#9CA3AF', display:'flex', alignItems:'center', gap:5 }}>
      <span style={{ display:'inline-block', width:10, height:10, border:'1.5px solid #D1D5DB', borderTopColor:'#6B7280', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}></span>
      Loading recording…
    </span>
  );
  if (state === 'notfound') return (
    <div style={{ marginTop:5, marginLeft:13, fontSize:11, color:'#9CA3AF', display:'flex', alignItems:'center', gap:6 }}>
      Recording still processing…
      <button onClick={load} style={{ fontSize:11, color:NAVY, background:'none', border:'none', cursor:'pointer', textDecoration:'underline', padding:0, fontWeight:600 }}>Retry</button>
    </div>
  );
  if (state === 'error') return (
    <div style={{ marginTop:5, marginLeft:13, fontSize:11, color:'#F43F5E', display:'flex', alignItems:'center', gap:6 }}>
      Could not load recording
      <button onClick={()=>setState('idle')} style={{ fontSize:11, color:NAVY, background:'none', border:'none', cursor:'pointer', textDecoration:'underline', padding:0 }}>Try again</button>
    </div>
  );
  if (state === 'ready' && audioUrl) return (
    <div style={{ marginTop:5, marginLeft:13 }}>
      <audio controls src={audioUrl} style={{ width:'100%', height:32 }} />
    </div>
  );
  return null;
}

// ─── Person Row (one contact at a company) ───────────────────────────────────
function PersonRow({ name, title, phone, altPhone, email, isPrimary, isLast, onCall, onEmail, onEdit, onRemove }) {
  return (
    <div style={{ padding:'12px 16px', borderBottom: isLast ? 'none' : '1px solid #F3F4F6' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#1A1D2E' }}>{name || '—'}</span>
            {isPrimary && <span style={{ fontSize:10, fontWeight:700, background:`${NAVY}14`, color:NAVY, borderRadius:4, padding:'1px 6px' }}>Primary</span>}
          </div>
          {title && <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>{title}</div>}
        </div>
        <div style={{ display:'flex', gap:4, flexShrink:0, marginLeft:8 }}>
          {phone && (
            <button onClick={onCall} style={{ padding:'4px 9px', background:GOLD, border:'none', borderRadius:6, color:NAVY, fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
              <Icon path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" size={11} color={NAVY} />
              Call
            </button>
          )}
          {email && (
            <button onClick={onEmail} style={{ padding:'4px 9px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:6, color:'#065F46', fontSize:11, fontWeight:700, cursor:'pointer' }}>
              Email
            </button>
          )}
          <button onClick={onEdit} style={{ padding:'4px 9px', background:'#F8F9FC', border:'1px solid #E5E7EB', borderRadius:6, color:'#374151', fontSize:11, fontWeight:600, cursor:'pointer' }}>
            Edit
          </button>
          {!isPrimary && (
            <button onClick={onRemove} title="Remove this contact" style={{ padding:'4px 7px', background:'#FFF5F5', border:'1px solid #FEE2E2', borderRadius:6, color:'#DC2626', fontSize:12, fontWeight:700, cursor:'pointer', lineHeight:1 }}>×</button>
          )}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
        {phone && (
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#374151' }}>
            <Icon path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" size={12} color='#9CA3AF' />
            {phone}
          </div>
        )}
        {altPhone && (
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#374151' }}>
            <Icon path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" size={12} color='#F7B91E' />
            {altPhone}
            <span style={{ fontSize:10, fontWeight:700, color:'#F7B91E', background:'#FEF9EC', border:'1px solid #FDE68A', borderRadius:4, padding:'1px 5px' }}>ALT</span>
          </div>
        )}
        {email && (
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#374151' }}>
            <Icon path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" size={12} color='#9CA3AF' />
            {email}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Person Form Modal (add / edit a person at a company) ─────────────────────
function PersonFormModal({ person, onSave, onClose }) {
  const blank = { name:'', title:'', phone:'', altPhone:'', email:'' };
  const [form, setForm] = useState3(person ? { ...person } : blank);
  const set = (k,v) => setForm(p => ({...p, [k]:v}));
  const canSave = form.name.trim() && (form.phone.trim() || form.email.trim());

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:250, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:440, padding:'28px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'#1A1D2E' }}>{person ? 'Edit Contact' : 'Add Contact'}</h2>
            <p style={{ margin:'3px 0 0', fontSize:12, color:'#6B7280' }}>Person at this company</p>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'#F3F4F6', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:16, color:'#6B7280' }}>×</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Full Name *</label>
            <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Jane Smith" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Title</label>
            <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Facilities Manager" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Phone</label>
              <input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+1 555 000 0000" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Alt Phone</label>
              <input value={form.altPhone||''} onChange={e=>set('altPhone',e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Email</label>
            <input value={form.email||''} onChange={e=>set('email',e.target.value)} placeholder="jane@company.com" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
          </div>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', border:'1.5px solid #E5E7EB', borderRadius:8, background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
          <button onClick={() => canSave && onSave({ ...form, id: form.id || ('p_'+Date.now()) })} disabled={!canSave} style={{ padding:'8px 20px', border:'none', borderRadius:8, background:canSave?NAVY:'#E5E7EB', color:canSave?'#fff':'#9CA3AF', fontSize:13, fontWeight:700, cursor:canSave?'pointer':'not-allowed' }}>
            {person ? 'Save Changes' : 'Add Person'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CallLogModal({ contact, onSave, onClose, prefilledDuration, prefilledCallSid }) {
  const [form, setForm] = useState3({
    outcome: '', duration: prefilledDuration || '', notes: '', nextAction: '', nextActionDate: ''
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const canSave = form.outcome;

  const handleSave = () => {
    if (!canSave) return;
    const entry = {
      id: 'cl' + Date.now(),
      date: new Date().toISOString(),
      duration: form.duration || '—',
      outcome: form.outcome,
      notes: form.notes,
      nextAction: form.nextAction,
      nextActionDate: form.nextActionDate ? new Date(form.nextActionDate).toISOString() : null,
      callSid: prefilledCallSid || null,
    };

    // Determine new stage based on outcome — use if/else so rules don't overwrite each other
    let newStage = contact.stage;
    if (form.outcome === 'Answered — Not Interested') {
      newStage = 'Lost';
    } else if (form.outcome.includes('Interested') && !form.outcome.includes('Not')) {
      // Any "Interested" outcome promotes to Interested from New Lead or Called
      if (contact.stage === 'New Lead' || contact.stage === 'Called') newStage = 'Interested';
    } else if (form.outcome.includes('Answered') && !form.outcome.includes('Not')) {
      // Other answered outcomes (Callback etc.) move New Lead → Called
      if (contact.stage === 'New Lead') newStage = 'Called';
    }

    onSave(entry, form.nextAction, form.nextActionDate ? new Date(form.nextActionDate).toISOString() : null, newStage);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:480, padding:'28px 28px 24px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'#1A1D2E' }}>Log Call</h2>
            <p style={{ margin:'3px 0 0', fontSize:12, color:'#6B7280' }}>{contact.company} · {contact.contactPerson}</p>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'#F3F4F6', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:16, color:'#6B7280' }}>×</button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Outcome *</label>
            <select value={form.outcome} onChange={e=>set('outcome',e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', background:'#fff' }}>
              <option value="">Select outcome…</option>
              {detailOutcomeOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Duration</label>
            <input value={form.duration} onChange={e=>set('duration',e.target.value)} placeholder="e.g. 05:32" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Notes</label>
            <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="What happened on this call?" rows={3} style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Next Action</label>
              <input value={form.nextAction} onChange={e=>set('nextAction',e.target.value)} placeholder="e.g. Call back Monday" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Follow-up Date</label>
              <input type="datetime-local" value={form.nextActionDate} onChange={e=>set('nextActionDate',e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', border:'1.5px solid #E5E7EB', borderRadius:8, background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={!canSave} style={{ padding:'8px 20px', border:'none', borderRadius:8, background:canSave?NAVY:'#E5E7EB', color:canSave?'#fff':'#9CA3AF', fontSize:13, fontWeight:700, cursor:canSave?'pointer':'not-allowed' }}>Save Call Log</button>
        </div>
      </div>
    </div>
  );
}

function normalizePhone3(p) { return (p||'').replace(/[\s\-\+\(\)\.]/g,''); }
function normalizeCompany3(c) { return (c||'').toLowerCase().replace(/[^a-z0-9]/g,''); }

function AddContactModal({ onSave, onClose, editContact, existingContacts = [] }) {
  const blank = { company:'', contactPerson:'', title:'', phone:'', altPhone:'', email:'', stage:'New Lead', services:[], quoteAmount:'', notes:'', nextAction:'', nextActionDate:'' };
  const [form, setForm] = useState3(editContact ? {
    ...editContact, quoteAmount: editContact.quoteAmount || '',
    nextActionDate: editContact.nextActionDate ? new Date(editContact.nextActionDate).toISOString().slice(0,16) : '',
    services: editContact.services || [],
  } : blank);
  const [dupWarning, setDupWarning] = useState3(null);
  const [forceAdd, setForceAdd] = useState3(false);
  const set = (k,v) => { setForm(p=>({...p,[k]:v})); setDupWarning(null); setForceAdd(false); };
  const toggleService = s => set('services', form.services.includes(s) ? form.services.filter(x=>x!==s) : [...form.services,s]);

  const handleSave = () => {
    if (!form.company || !form.contactPerson || !form.phone) return;
    // Check for duplicates unless editing or user confirmed
    if (!editContact && !forceAdd) {
      const others = existingContacts.filter(c => c.id !== editContact?.id);
      const dup = others.find(c => {
        const phoneMatch = normalizePhone3(form.phone).length > 4 && normalizePhone3(form.phone) === normalizePhone3(c.phone);
        const companyMatch = normalizeCompany3(form.company).length > 2 && normalizeCompany3(form.company) === normalizeCompany3(c.company);
        return phoneMatch || companyMatch;
      });
      if (dup) { setDupWarning(dup); return; }
    }
    onSave({
      ...form,
      id: editContact ? editContact.id : 'c' + Date.now(),
      quoteAmount: Number(form.quoteAmount)||0,
      nextActionDate: form.nextActionDate ? new Date(form.nextActionDate).toISOString() : null,
      lastCallDate: editContact ? editContact.lastCallDate : null,
      callLog: editContact ? editContact.callLog : [],
      assignedTo: editContact ? editContact.assignedTo : 'u1',
    });
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:560, maxHeight:'85vh', overflowY:'auto', padding:'28px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'#1A1D2E' }}>{editContact?'Edit Contact':'Add New Contact'}</h2>
          <button onClick={onClose} style={{ border:'none', background:'#F3F4F6', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:16, color:'#6B7280' }}>×</button>
        </div>

        {/* Duplicate warning */}
        {dupWarning && (
          <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#C2410C', marginBottom:4 }}>⚠️ Possible duplicate</div>
            <div style={{ fontSize:12, color:'#92400E' }}>A contact already exists with a matching phone or company name: <strong>{dupWarning.company}</strong> ({dupWarning.contactPerson})</div>
            <div style={{ display:'flex', gap:8, marginTop:10 }}>
              <button onClick={()=>{ setForceAdd(true); setDupWarning(null); setTimeout(handleSave,0); }} style={{ padding:'5px 12px', borderRadius:7, border:'none', background:'#C2410C', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>Add anyway</button>
              <button onClick={()=>setDupWarning(null)} style={{ padding:'5px 12px', borderRadius:7, border:'1.5px solid #FED7AA', background:'transparent', color:'#92400E', fontSize:12, fontWeight:600, cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Company Name *</label>
              <input value={form.company} onChange={e=>set('company',e.target.value)} placeholder="e.g. Growthpoint Properties" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Contact Person *</label>
              <input value={form.contactPerson} onChange={e=>set('contactPerson',e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Title</label>
              <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Facilities Manager" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Phone *</label>
              <input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+27 11 000 0000" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Alternate Phone</label>
              <input value={form.altPhone||''} onChange={e=>set('altPhone',e.target.value)} placeholder="+27 82 000 0000" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Email</label>
              <input value={form.email} onChange={e=>set('email',e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Pipeline Stage</label>
              <select value={form.stage} onChange={e=>set('stage',e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', background:'#fff' }}>
                {detailStages.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Quote Amount (R/mo)</label>
              <input type="number" value={form.quoteAmount} onChange={e=>set('quoteAmount',e.target.value)} placeholder="0" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:8 }}>Services of Interest</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {detailServiceOptions.map(s => (
                <button key={s} onClick={()=>toggleService(s)} style={{ padding:'5px 12px', borderRadius:99, border:`1.5px solid ${form.services.includes(s)?NAVY:'#E5E7EB'}`, background:form.services.includes(s)?NAVY+'18':'#fff', color:form.services.includes(s)?NAVY:'#6B7280', fontSize:12, fontWeight:600, cursor:'pointer' }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Next Action</label>
              <input value={form.nextAction} onChange={e=>set('nextAction',e.target.value)} placeholder="e.g. Intro call" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Follow-up Date</label>
              <input type="datetime-local" value={form.nextActionDate} onChange={e=>set('nextActionDate',e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Notes</label>
            <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3} style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }} />
          </div>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', border:'1.5px solid #E5E7EB', borderRadius:8, background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSave} style={{ padding:'8px 20px', border:'none', borderRadius:8, background:NAVY, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>{editContact?'Save Changes':'Add Contact'}</button>
        </div>
      </div>
    </div>
  );
}

function ContactDetail({ contact, onClose, onUpdate, onLogCall, currentUser, onStartCall, onStartManualCall }) {
  const [showCallModal,   setShowCallModal]   = useState3(false);
  const [showEditModal,   setShowEditModal]   = useState3(false);
  const [showEmailModal,  setShowEmailModal]  = useState3(false);
  const [emailTarget,     setEmailTarget]     = useState3(null);
  const [showPersonModal, setShowPersonModal] = useState3(false);
  const [editingPerson,   setEditingPerson]   = useState3(null);

  const handleAddPerson = (person) => {
    const updated = { ...contact, additionalContacts: [...(contact.additionalContacts||[]), person] };
    onUpdate(updated);
    setShowPersonModal(false);
  };

  const handleEditPerson = (person) => {
    if (person.id === '_primary') {
      // Editing primary contact — handled by Edit modal
      setShowEditModal(true);
      setShowPersonModal(false);
      return;
    }
    const updated = { ...contact, additionalContacts: (contact.additionalContacts||[]).map(p => p.id === person.id ? person : p) };
    onUpdate(updated);
    setShowPersonModal(false);
    setEditingPerson(null);
  };

  const handleRemovePerson = (personId) => {
    const updated = { ...contact, additionalContacts: (contact.additionalContacts||[]).filter(p => p.id !== personId) };
    onUpdate(updated);
  };

  const callPerson = (person) => {
    const callContact = person
      ? { ...contact, contactPerson: person.name, phone: person.phone, altPhone: person.altPhone||'' }
      : contact;
    onStartCall && onStartCall(callContact);
  };
  const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-ZA',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) : '—';
  const fmtTime = iso => iso ? new Date(iso).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'}) : '';
  const outcomeColor = o => o.includes('Interested')&&!o.includes('Not')?'#10B981':o.includes('Not')?'#F43F5E':o.includes('Callback')?'#F97316':'#6B7280';
  const fmtR = n => n>=1000?`R${(n/1000).toFixed(0)}k/mo`:`R${n}/mo`;


  const handleEmailSent = (emailRecord) => {
    const updated = {
      ...contact,
      emailLog: [...(contact.emailLog || []), emailRecord],
    };
    onUpdate(updated);
    setShowEmailModal(false);
  };

  const handleLogSave = (entry, nextAction, nextActionDate, newStage) => {
    const updated = {
      ...contact,
      callLog: [...contact.callLog, entry],
      lastCallDate: entry.date,
      nextAction: nextAction || contact.nextAction,
      nextActionDate: nextActionDate || contact.nextActionDate,
      stage: newStage,
    };
    onUpdate(updated);
    setShowCallModal(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex' }} onClick={onClose}>
      {/* Backdrop */}
      <div style={{ flex:1, background:'rgba(0,0,0,0.3)' }}></div>
      {/* Panel */}
      <div style={{ width:480, background:'#F8F9FC', height:'100vh', overflowY:'auto', boxShadow:'-8px 0 40px rgba(0,0,0,0.15)', display:'flex', flexDirection:'column' }} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{ background:NAVY, padding:'20px 24px', color:'#fff' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div>
              <h2 style={{ margin:0, fontSize:18, fontWeight:800 }}>{contact.company}</h2>
              <div style={{ fontSize:13, opacity:0.75, marginTop:3 }}>{contact.contactPerson}{contact.title ? ` · ${contact.title}` : ''}</div>
            </div>
            <button onClick={onClose} style={{ border:'none', background:'rgba(255,255,255,0.15)', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#fff', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            <StageBadge stage={contact.stage} />
            {contact.quoteAmount>0 && <span style={{ background:'rgba(247,185,30,0.2)', color:GOLD, fontSize:11, fontWeight:700, borderRadius:99, padding:'2px 10px' }}>{fmtR(contact.quoteAmount)}</span>}
          </div>
        </div>

        <div style={{ flex:1, padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>
          {/* Actions */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={()=>onStartCall && onStartCall(contact)} style={{ flex:1, minWidth:100, padding:'9px', background:GOLD, border:'none', borderRadius:8, color:NAVY, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <Icon path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" size={15} color={NAVY} />
              Call
            </button>
            <button onClick={()=>onStartManualCall && onStartManualCall(contact, contact.altPhone||'')} title={contact.altPhone ? `Dial alternate: ${contact.altPhone}` : 'Dial an alternate number'} style={{ padding:'9px 11px', background: contact.altPhone ? '#FEF9EC' : '#fff', border:`1.5px solid ${contact.altPhone ? '#FDE68A' : '#E5E7EB'}`, borderRadius:8, color: contact.altPhone ? '#92680A' : '#374151', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <Icon path="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0a9 9 0 11-18 0 9 9 0 0118 0z" size={14} color={contact.altPhone ? '#92680A' : '#374151'} />
              Alt #
            </button>
            <button onClick={()=>setShowCallModal(true)} style={{ padding:'9px 12px', background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:8, color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={14} color='#374151' />
              Log
            </button>
            <button onClick={()=>setShowEmailModal(true)} style={{ padding:'9px 12px', background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:8, color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <Icon path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" size={14} color='#374151' />
              Email
            </button>
            <button onClick={()=>setShowEditModal(true)} style={{ padding:'9px 12px', background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:8, color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>Edit</button>
          </div>

          {/* Contacts at this company */}
          <div style={{ background:'#fff', borderRadius:10, border:'1px solid #E9EBF0', overflow:'hidden' }}>
            <div style={{ padding:'10px 16px', borderBottom:'1px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Contacts ({1 + (contact.additionalContacts||[]).length})
              </div>
              <button onClick={() => { setEditingPerson(null); setShowPersonModal(true); }} style={{ fontSize:11, fontWeight:700, color:NAVY, background:`${NAVY}10`, border:`1px solid ${NAVY}25`, borderRadius:6, padding:'3px 9px', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                + Add Person
              </button>
            </div>

            {/* Primary contact */}
            <PersonRow
              name={contact.contactPerson}
              title={contact.title}
              phone={contact.phone}
              altPhone={contact.altPhone}
              email={contact.email}
              isPrimary={true}
              isLast={(contact.additionalContacts||[]).length === 0}
              onCall={() => callPerson(null)}
              onEmail={() => { setEmailTarget(null); setShowEmailModal(true); }}
              onEdit={() => setShowEditModal(true)}
            />

            {/* Additional contacts */}
            {(contact.additionalContacts||[]).map((p, i) => (
              <PersonRow
                key={p.id}
                name={p.name}
                title={p.title}
                phone={p.phone}
                altPhone={p.altPhone}
                email={p.email}
                isPrimary={false}
                isLast={i === (contact.additionalContacts||[]).length - 1}
                onCall={() => callPerson(p)}
                onEmail={() => { setEmailTarget(p); setShowEmailModal(true); }}
                onEdit={() => { setEditingPerson(p); setShowPersonModal(true); }}
                onRemove={() => handleRemovePerson(p.id)}
              />
            ))}
          </div>

          {/* Services */}
          {contact.services?.length > 0 && (
            <div style={{ background:'#fff', borderRadius:10, padding:'12px 16px', border:'1px solid #E9EBF0' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Services of Interest</div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {contact.services.map(s=><span key={s} style={{ fontSize:11, background:`${NAVY}12`, color:NAVY, borderRadius:99, padding:'2px 8px', fontWeight:600 }}>{s}</span>)}
              </div>
            </div>
          )}

          {/* Next Action */}
          {contact.nextAction && (
            <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:10, padding:'12px 16px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#C2410C', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Next Action</div>
              <div style={{ fontSize:13, color:'#374151', fontWeight:600 }}>{contact.nextAction}</div>
              {contact.nextActionDate && <div style={{ fontSize:12, color:'#9CA3AF', marginTop:3 }}>{fmtDate(contact.nextActionDate)} at {fmtTime(contact.nextActionDate)}</div>}
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div style={{ background:'#fff', borderRadius:10, padding:'14px 16px', border:'1px solid #E9EBF0' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Notes</div>
              <p style={{ margin:0, fontSize:13, color:'#374151', lineHeight:1.6 }}>{contact.notes}</p>
            </div>
          )}

          {/* Call History */}
          <div style={{ background:'#fff', borderRadius:10, border:'1px solid #E9EBF0', overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #F3F4F6' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em' }}>Call History ({contact.callLog.length})</div>
            </div>
            {contact.callLog.length===0 && <div style={{ padding:'20px 16px', color:'#9CA3AF', fontSize:13, textAlign:'center' }}>No calls logged yet.</div>}
            <div style={{ display:'flex', flexDirection:'column' }}>
              {[...contact.callLog].reverse().map((l,i) => (
                <div key={l.id} style={{ padding:'12px 16px', borderBottom: i<contact.callLog.length-1?'1px solid #F9FAFB':'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:outcomeColor(l.outcome), display:'inline-block' }}></span>
                      <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>{l.outcome}</span>
                      {l.duration && l.duration!=='—' && <span style={{ fontSize:11, color:'#9CA3AF' }}>· {l.duration}</span>}
                    </div>
                    <span style={{ fontSize:11, color:'#9CA3AF' }}>{fmtDate(l.date)}</span>
                  </div>
                  {l.notes && <p style={{ margin:'0 0 4px 13px', fontSize:12, color:'#6B7280', lineHeight:1.5 }}>{l.notes}</p>}
                  {l.nextAction && <div style={{ marginLeft:13, fontSize:11, color:'#F97316', fontWeight:600 }}>→ {l.nextAction}</div>}
                  {l.callSid && <RecordingPlayer callSid={l.callSid} currentUser={currentUser} />}
                </div>
              ))}
            </div>
          </div>
          {/* Email History */}
          {(contact.emailLog || []).length > 0 && (
            <div style={{ background:'#fff', borderRadius:10, border:'1px solid #E9EBF0', overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #F3F4F6' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em' }}>Email History ({(contact.emailLog||[]).length})</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column' }}>
                {[...(contact.emailLog||[])].reverse().map((e,i,arr) => (
                  <div key={e.id} style={{ padding:'12px 16px', borderBottom:i<arr.length-1?'1px solid #F9FAFB':'none' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, flex:1, minWidth:0 }}>
                        <Icon path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" size={12} color='#10B981' />
                        <span style={{ fontSize:12, fontWeight:700, color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.subject}</span>
                      </div>
                      <span style={{ fontSize:11, color:'#9CA3AF', flexShrink:0, marginLeft:8 }}>{fmtDate(e.date)}</span>
                    </div>
                    {e.preview && <p style={{ margin:'0 0 3px 18px', fontSize:12, color:'#6B7280', lineHeight:1.5 }}>{e.preview}{e.preview.length >= 120 ? '…' : ''}</p>}
                    <div style={{ marginLeft:18, fontSize:11, color:'#9CA3AF' }}>Sent by {e.sentBy} → {e.to}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCallModal && <CallLogModal contact={contact} onSave={handleLogSave} onClose={()=>setShowCallModal(false)} />}
      {showEditModal && <AddContactModal editContact={contact} onSave={(updated)=>{onUpdate(updated);setShowEditModal(false);}} onClose={()=>setShowEditModal(false)} />}
      {showEmailModal && (
        <EmailComposer
          contact={emailTarget ? { ...contact, contactPerson: emailTarget.name, email: emailTarget.email } : contact}
          currentUser={currentUser}
          onSent={handleEmailSent}
          onClose={()=>{ setShowEmailModal(false); setEmailTarget(null); }}
        />
      )}
      {showPersonModal && (
        <PersonFormModal
          person={editingPerson}
          onSave={editingPerson ? handleEditPerson : handleAddPerson}
          onClose={()=>{ setShowPersonModal(false); setEditingPerson(null); }}
        />
      )}
    </div>
  );
}

Object.assign(window, { ContactDetail, AddContactModal, CallLogModal });
