// Contact Detail Panel + Call Log Modal + Add/Edit Contact Modal
const { useState: useState3, useRef } = React;

const detailServiceOptions = window.CRM_DATA.services;
const detailOutcomeOptions = window.CRM_DATA.outcomes;
const detailStages = window.CRM_DATA.stages;

function CallLogModal({ contact, onSave, onClose, prefilledDuration }) {
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
    };

    // Determine new stage based on outcome
    let newStage = contact.stage;
    if (form.outcome.includes('Interested') && !form.outcome.includes('Not') && contact.stage === 'New Lead') newStage = 'Interested';
    if (form.outcome === 'Answered — Not Interested') newStage = 'Lost';
    if (contact.stage === 'New Lead' || contact.stage === 'Called') {
      if (form.outcome.includes('Answered') && !form.outcome.includes('Not')) newStage = 'Called';
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
  const blank = { company:'', contactPerson:'', title:'', phone:'', email:'', stage:'New Lead', services:[], quoteAmount:'', notes:'', nextAction:'', nextActionDate:'' };
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

function ContactDetail({ contact, onClose, onUpdate, onLogCall, currentUser }) {
  const [showCallModal, setShowCallModal] = useState3(false);
  const [showEditModal, setShowEditModal] = useState3(false);
  const [showEmailModal, setShowEmailModal] = useState3(false);
  const [showDialer, setShowDialer] = useState3(false);
  const [dialerPrefilledDuration, setDialerPrefilledDuration] = useState3(null);
  const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-ZA',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) : '—';
  const fmtTime = iso => iso ? new Date(iso).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'}) : '';
  const outcomeColor = o => o.includes('Interested')&&!o.includes('Not')?'#10B981':o.includes('Not')?'#F43F5E':o.includes('Callback')?'#F97316':'#6B7280';
  const fmtR = n => n>=1000?`R${(n/1000).toFixed(0)}k/mo`:`R${n}/mo`;

  const handleCallEnded = (duration) => {
    setDialerPrefilledDuration(duration);
    setShowDialer(false);
    setShowCallModal(true);
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
            <button onClick={()=>setShowDialer(true)} style={{ flex:1, minWidth:100, padding:'9px', background:GOLD, border:'none', borderRadius:8, color:NAVY, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <Icon path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" size={15} color={NAVY} />
              Call
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

          {/* Contact Info */}
          <div style={{ background:'#fff', borderRadius:10, padding:'14px 16px', border:'1px solid #E9EBF0' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Contact Info</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'Phone', val:contact.phone, icon:'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
                { label:'Email', val:contact.email, icon:'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
              ].filter(r=>r.val).map(r => (
                <div key={r.label} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <Icon path={r.icon} size={14} color='#9CA3AF' />
                  <span style={{ fontSize:13, color:'#374151' }}>{r.val}</span>
                </div>
              ))}
              {contact.services?.length>0 && (
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <Icon path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" size={14} color='#9CA3AF' />
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {contact.services.map(s=><span key={s} style={{ fontSize:11, background:`${NAVY}12`, color:NAVY, borderRadius:99, padding:'2px 8px', fontWeight:600 }}>{s}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>

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
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showDialer && <TwilioDialer contact={contact} onClose={()=>setShowDialer(false)} onCallEnded={handleCallEnded} currentUser={currentUser} />}
      {showCallModal && <CallLogModal contact={contact} prefilledDuration={dialerPrefilledDuration} onSave={handleLogSave} onClose={()=>{setShowCallModal(false);setDialerPrefilledDuration(null);}} />}
      {showEditModal && <AddContactModal editContact={contact} onSave={(updated)=>{onUpdate(updated);setShowEditModal(false);}} onClose={()=>setShowEditModal(false)} />}
      {showEmailModal && <EmailComposer contact={contact} onClose={()=>setShowEmailModal(false)} />}
    </div>
  );
}

Object.assign(window, { ContactDetail, AddContactModal, CallLogModal });
