// Auth / Login Screen — PIN-protected reps + admin rep management
const { useState: useState8, useEffect: useEffect8 } = React;

const ADMIN_PIN = '1234';
const REPS_STORAGE_KEY = 'memphisclean_crm_reps';

const AVATAR_COLORS = ['#2B3990','#0E7490','#7C3AED','#059669','#DC2626','#D97706','#DB2777','#0284C7'];

function loadReps() {
  try {
    const saved = localStorage.getItem(REPS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return window.CRM_DATA.users;
}

function saveReps(reps) {
  try { localStorage.setItem(REPS_STORAGE_KEY, JSON.stringify(reps)); } catch(e) {}
  // Sync to Firestore so all devices see the same rep list
  if (typeof db !== 'undefined') {
    const batch = db.batch();
    reps.forEach(r => batch.set(db.collection('reps').doc(r.id), r));
    batch.commit().catch(console.error);
  }
}

// ── PIN PAD ───────────────────────────────────────────────────────
function PinPad({ title, subtitle, onSuccess, onBack, correctPin, errorMsg }) {
  const [pin, setPin] = useState8('');
  const [error, setError] = useState8(false);
  const [shake, setShake] = useState8(false);

  const append = (d) => {
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    if (next.length === correctPin.length) {
      setTimeout(() => {
        if (next === correctPin) {
          onSuccess();
        } else {
          setError(true);
          setShake(true);
          setTimeout(() => { setShake(false); setPin(''); setError(false); }, 600);
        }
      }, 120);
    }
  };

  const del = () => setPin(p => p.slice(0,-1));

  return (
    <div style={{ background:'rgba(255,255,255,0.05)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, padding:'28px 28px 24px' }}>
      {onBack && (
        <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13, padding:0, marginBottom:20, display:'flex', alignItems:'center', gap:5 }}>
          <Icon path="M15 19l-7-7 7-7" size={14} color='rgba(255,255,255,0.5)' /> Back
        </button>
      )}
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <h2 style={{ color:'#fff', fontSize:17, fontWeight:700, margin:'0 0 4px' }}>{title}</h2>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:13, margin:0 }}>{subtitle}</p>
      </div>

      {/* Dots */}
      <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:24, animation: shake ? 'shake 0.4s ease' : 'none' }}>
        {Array.from({length: Math.max(correctPin.length, 4)}).map((_,i) => (
          <div key={i} style={{ width:14, height:14, borderRadius:'50%', background: i < pin.length ? '#fff' : 'rgba(255,255,255,0.2)', border:'1.5px solid rgba(255,255,255,0.3)', transition:'background 0.1s' }}></div>
        ))}
      </div>

      {error && <p style={{ color:'#F87171', fontSize:12, textAlign:'center', marginBottom:12, marginTop:-16 }}>Incorrect PIN. Try again.</p>}

      {/* Numpad */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k,i) => (
          <button key={i} onClick={() => k === '⌫' ? del() : k ? append(k) : null}
            disabled={!k}
            style={{ padding:'14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.12)', background: k ? 'rgba(255,255,255,0.08)' : 'transparent', color:'#fff', fontSize:18, fontWeight:600, cursor: k ? 'pointer' : 'default', opacity: k ? 1 : 0, transition:'all 0.12s' }}
            onMouseEnter={e => k && (e.currentTarget.style.background='rgba(255,255,255,0.18)')}
            onMouseLeave={e => k && (e.currentTarget.style.background='rgba(255,255,255,0.08)')}>
            {k}
          </button>
        ))}
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }`}</style>
    </div>
  );
}

// ── LOGIN SCREEN ─────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [reps, setReps] = useState8(loadReps);
  const [step, setStep] = useState8('select'); // select | rep-pin | admin-pin
  const [selectedRep, setSelectedRep] = useState8(null);

  // Keep reps in sync with localStorage changes (from settings screen)
  useEffect8(() => {
    const handler = () => setReps(loadReps());
    window.addEventListener('storage', handler);
    window.addEventListener('reps-updated', handler);
    return () => { window.removeEventListener('storage', handler); window.removeEventListener('reps-updated', handler); };
  }, []);

  // Load latest reps from Firestore so all devices see the same list
  useEffect8(() => {
    if (typeof db === 'undefined') return;
    db.collection('reps').get().then(snap => {
      if (!snap.empty) {
        const firestoreReps = snap.docs.map(doc => doc.data());
        setReps(firestoreReps);
        try { localStorage.setItem(REPS_STORAGE_KEY, JSON.stringify(firestoreReps)); } catch(e) {}
      }
    }).catch(console.error);
  }, []);

  const handleRepSelect = (rep) => {
    setSelectedRep(rep);
    setStep('rep-pin');
  };

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg, ${NAVY} 0%, #1a2460 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Sans, sans-serif' }}>
      <div style={{ width:'100%', maxWidth:420, padding:'0 20px' }}>

        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:26, fontWeight:800, color:'#fff', letterSpacing:'0.04em' }}>MemphisClean</div>
          <div style={{ marginTop:10, fontSize:11, color:'rgba(255,255,255,0.4)', letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:600 }}>CRM · Sales Portal</div>
        </div>

        {step === 'select' && (
          <div style={{ background:'rgba(255,255,255,0.05)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, padding:'24px 24px 20px' }}>
            <h2 style={{ color:'#fff', fontSize:16, fontWeight:700, margin:'0 0 4px' }}>Sign in</h2>
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:12, margin:'0 0 18px' }}>Select your profile to continue</p>

            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
              {reps.map(rep => (
                <button key={rep.id} onClick={() => handleRepSelect(rep)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.14)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.28)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:rep.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 }}>{rep.initials}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:'#fff', fontWeight:700, fontSize:13 }}>{rep.name}</div>
                    <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, marginTop:1, display:'flex', alignItems:'center', gap:4 }}>
                      <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" size={10} color='rgba(255,255,255,0.4)' />
                      PIN protected
                    </div>
                  </div>
                  <span style={{ background:'rgba(16,185,129,0.18)', color:'#10B981', fontSize:10, fontWeight:700, borderRadius:99, padding:'2px 8px' }}>Rep</span>
                </button>
              ))}
            </div>

            <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:12 }}>
              <button onClick={() => setStep('admin-pin')}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'rgba(247,185,30,0.07)', border:'1px solid rgba(247,185,30,0.18)', borderRadius:12, cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(247,185,30,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(247,185,30,0.07)'}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(247,185,30,0.12)', border:'1.5px solid rgba(247,185,30,0.35)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" size={17} color={GOLD} />
                </div>
                <div style={{ flex:1, textAlign:'left' }}>
                  <div style={{ color:GOLD, fontWeight:700, fontSize:13 }}>Administrator</div>
                  <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, marginTop:1 }}>Full access · PIN required</div>
                </div>
                <span style={{ background:'rgba(247,185,30,0.12)', color:GOLD, fontSize:10, fontWeight:700, borderRadius:99, padding:'2px 8px' }}>Admin</span>
              </button>
            </div>
          </div>
        )}

        {step === 'rep-pin' && selectedRep && (
          <PinPad
            title={selectedRep.name}
            subtitle="Enter your PIN to sign in"
            correctPin={selectedRep.pin || '0000'}
            onSuccess={() => onLogin({ ...selectedRep, role:'rep' })}
            onBack={() => { setStep('select'); setSelectedRep(null); }}
          />
        )}

        {step === 'admin-pin' && (
          <PinPad
            title="Administrator"
            subtitle="Enter admin PIN to unlock full access"
            correctPin={ADMIN_PIN}
            onSuccess={() => onLogin({ id:'admin', name:'Administrator', initials:'AD', color:NAVY, role:'admin' })}
            onBack={() => setStep('select')}
          />
        )}

        <p style={{ color:'rgba(255,255,255,0.18)', fontSize:11, textAlign:'center', marginTop:18 }}>MemphisClean CRM · South Africa</p>
      </div>
    </div>
  );
}

// ── ADMIN REP MANAGER ─────────────────────────────────────────────
function RepManager() {
  const [reps, setReps] = useState8(loadReps);
  const [showAdd, setShowAdd] = useState8(false);
  const [editRep, setEditRep] = useState8(null);
  const [confirmDelete, setConfirmDelete] = useState8(null);
  const [changePinRep, setChangePinRep] = useState8(null);

  const persist = (updated) => {
    setReps(updated);
    saveReps(updated);
    window.dispatchEvent(new Event('reps-updated'));
  };

  const handleSave = (rep) => {
    if (editRep) {
      persist(reps.map(r => r.id === rep.id ? rep : r));
    } else {
      persist([...reps, { ...rep, id:'u_'+Date.now() }]);
    }
    setShowAdd(false);
    setEditRep(null);
  };

  const handleDelete = (rep) => {
    persist(reps.filter(r => r.id !== rep.id));
    setConfirmDelete(null);
  };

  return (
    <div style={{ padding:'28px 32px', maxWidth:700 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#1A1D2E', margin:0 }}>Manage Sales Reps</h1>
          <p style={{ color:'#6B7280', fontSize:13, margin:'4px 0 0' }}>Add, edit or remove rep profiles and PINs</p>
        </div>
        <button onClick={() => { setEditRep(null); setShowAdd(true); }} style={{ padding:'8px 16px', background:NAVY, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:18, lineHeight:1 }}>+</span> Add Rep
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {reps.map(rep => (
          <div key={rep.id} style={{ background:'#fff', border:'1px solid #E9EBF0', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:46, height:46, borderRadius:'50%', background:rep.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:'#fff', flexShrink:0 }}>{rep.initials}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:700, color:'#1A1D2E' }}>{rep.name}</div>
              <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2, display:'flex', alignItems:'center', gap:6 }}>
                <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" size={12} color='#9CA3AF' />
                PIN: {'•'.repeat(rep.pin?.length || 4)}
                <span style={{ marginLeft:8, background:'#F3F4F6', borderRadius:4, padding:'1px 6px', fontSize:11, fontFamily:'monospace' }}>{rep.initials}</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setChangePinRep(rep)} style={{ padding:'6px 14px', border:'1.5px solid #E0E7FF', borderRadius:7, background:'#EEF2FF', color:'#3730A3', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                <Icon path="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" size={12} color='#3730A3' />
                PIN
              </button>
              <button onClick={() => { setEditRep(rep); setShowAdd(true); }} style={{ padding:'6px 14px', border:'1.5px solid #E5E7EB', borderRadius:7, background:'#fff', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer' }}>Edit</button>
              <button onClick={() => setConfirmDelete(rep)} style={{ padding:'6px 14px', border:'1.5px solid #FEE2E2', borderRadius:7, background:'#FFF5F5', color:'#DC2626', fontSize:12, fontWeight:600, cursor:'pointer' }}>Remove</button>
            </div>
          </div>
        ))}
        {reps.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#9CA3AF', fontSize:14, border:'2px dashed #E5E7EB', borderRadius:12 }}>No reps yet — add one above.</div>
        )}
      </div>

      {/* Change PIN Modal */}
      {changePinRep && (
        <ChangePinModal rep={changePinRep} onSave={(updated) => { persist(reps.map(r => r.id === updated.id ? updated : r)); setChangePinRep(null); }} onClose={() => setChangePinRep(null)} />
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <RepFormModal rep={editRep} onSave={handleSave} onClose={() => { setShowAdd(false); setEditRep(null); }} />
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setConfirmDelete(null)}>
          <div style={{ background:'#fff', borderRadius:16, padding:'28px', width:380, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ margin:'0 0 8px', fontSize:16, fontWeight:700, color:'#1A1D2E' }}>Remove {confirmDelete.name}?</h3>
            <p style={{ margin:'0 0 22px', fontSize:13, color:'#6B7280' }}>This will delete their profile from the login screen. Their contact data will remain.</p>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding:'8px 18px', border:'1.5px solid #E5E7EB', borderRadius:8, background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ padding:'8px 18px', border:'none', borderRadius:8, background:'#DC2626', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChangePinModal({ rep, onSave, onClose }) {
  const [pin,     setPin]     = useState8('');
  const [confirm, setConfirm] = useState8('');
  const [error,   setError]   = useState8('');
  const [saved,   setSaved]   = useState8(false);

  const canSave = pin.length >= 4 && pin === confirm;

  const handleSave = () => {
    if (pin !== confirm) { setError('PINs do not match.'); return; }
    if (pin.length < 4)  { setError('PIN must be at least 4 digits.'); return; }
    setSaved(true);
    setTimeout(() => { onSave({ ...rep, pin }); onClose(); }, 600);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:360, padding:'28px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'#1A1D2E' }}>Change PIN</h2>
            <p style={{ margin:'3px 0 0', fontSize:12, color:'#6B7280' }}>{rep.name}</p>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'#F3F4F6', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:16, color:'#6B7280' }}>×</button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>New PIN (4–6 digits)</label>
            <input
              type="password"
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g,'').slice(0,6)); setError(''); }}
              placeholder="••••"
              maxLength={6}
              style={{ width:'100%', padding:'10px 12px', border:`1.5px solid ${error?'#F43F5E':'#E5E7EB'}`, borderRadius:8, fontSize:16, outline:'none', boxSizing:'border-box', letterSpacing:'0.3em', textAlign:'center' }}
            />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Confirm New PIN</label>
            <input
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value.replace(/\D/g,'').slice(0,6)); setError(''); }}
              placeholder="••••"
              maxLength={6}
              style={{ width:'100%', padding:'10px 12px', border:`1.5px solid ${error?'#F43F5E': confirm && confirm===pin ?'#10B981':'#E5E7EB'}`, borderRadius:8, fontSize:16, outline:'none', boxSizing:'border-box', letterSpacing:'0.3em', textAlign:'center' }}
            />
          </div>
          {error && <div style={{ fontSize:12, color:'#F43F5E', fontWeight:600 }}>⚠ {error}</div>}
          {!error && confirm && confirm === pin && pin.length >= 4 && (
            <div style={{ fontSize:12, color:'#10B981', fontWeight:600 }}>✓ PINs match</div>
          )}
        </div>

        <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', border:'1.5px solid #E5E7EB', borderRadius:8, background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={!canSave} style={{ padding:'8px 20px', border:'none', borderRadius:8, background:saved?'#10B981':canSave?NAVY:'#E5E7EB', color:canSave?'#fff':'#9CA3AF', fontSize:13, fontWeight:700, cursor:canSave?'pointer':'not-allowed', transition:'background 0.2s' }}>
            {saved ? '✓ Saved!' : 'Update PIN'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RepFormModal({ rep, onSave, onClose }) {
  const [form, setForm] = useState8(rep ? { ...rep } : { name:'', initials:'', pin:'', color: AVATAR_COLORS[0] });
  const set = (k,v) => setForm(p => ({ ...p, [k]:v }));
  const canSave = form.name && form.initials && form.pin?.length >= 4;

  const autoInitials = (name) => {
    const parts = name.trim().split(' ').filter(Boolean);
    return parts.map(p=>p[0].toUpperCase()).slice(0,2).join('');
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:440, padding:'28px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'#1A1D2E' }}>{rep ? 'Edit Rep' : 'Add New Rep'}</h2>
          <button onClick={onClose} style={{ border:'none', background:'#F3F4F6', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:16, color:'#6B7280' }}>×</button>
        </div>

        {/* Avatar preview */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:form.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff' }}>{form.initials || '?'}</div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Full Name *</label>
            <input value={form.name} onChange={e => { set('name', e.target.value); if (!rep) set('initials', autoInitials(e.target.value)); }} placeholder="e.g. Khule Khumalo" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Initials *</label>
              <input value={form.initials} onChange={e => set('initials', e.target.value.toUpperCase().slice(0,3))} placeholder="e.g. KK" maxLength={3} style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', letterSpacing:'0.1em', fontWeight:700 }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>PIN * (4–6 digits)</label>
              <input type="password" value={form.pin} onChange={e => set('pin', e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="••••" maxLength={6} style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', letterSpacing:'0.2em' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:8 }}>Avatar Colour</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {AVATAR_COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)} style={{ width:28, height:28, borderRadius:'50%', background:c, border: form.color===c ? '3px solid #1A1D2E' : '3px solid transparent', cursor:'pointer', transition:'border 0.1s' }}></button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', border:'1.5px solid #E5E7EB', borderRadius:8, background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
          <button onClick={() => canSave && onSave(form)} disabled={!canSave} style={{ padding:'8px 20px', border:'none', borderRadius:8, background:canSave?NAVY:'#E5E7EB', color:canSave?'#fff':'#9CA3AF', fontSize:13, fontWeight:700, cursor:canSave?'pointer':'not-allowed' }}>{rep ? 'Save Changes' : 'Add Rep'}</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, RepManager, loadReps });
