// Auth / Login Screen — Firebase Email+Password authentication
const { useState: useState8, useEffect: useEffect8 } = React;

const AVATAR_COLORS = ['#2B3990','#0E7490','#7C3AED','#059669','#DC2626','#D97706','#DB2777','#0284C7'];

// ── LOGIN SCREEN ──────────────────────────────────────────────────
function LoginScreen({ authError }) {
  const [email,    setEmail]    = useState8('');
  const [password, setPassword] = useState8('');
  const [error,    setError]    = useState8(authError || '');
  const [loading,  setLoading]  = useState8(false);
  const [showPass, setShowPass] = useState8(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      await firebase.auth().signInWithEmailAndPassword(email.trim().toLowerCase(), password);
      // onAuthStateChanged in App picks up the session automatically
    } catch (err) {
      setLoading(false);
      if (['auth/user-not-found','auth/wrong-password','auth/invalid-credential','auth/invalid-email'].includes(err.code)) {
        setError('Incorrect email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a moment and try again.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    }
  };

  const inputStyle = (hasErr) => ({
    width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.08)',
    border:`1.5px solid ${hasErr ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.15)'}`,
    borderRadius:10, fontSize:14, color:'#fff', outline:'none', boxSizing:'border-box',
    fontFamily:'DM Sans, sans-serif',
  });

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg, ${NAVY} 0%, #1a2460 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Sans, sans-serif' }}>
      <div style={{ width:'100%', maxWidth:400, padding:'0 20px' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:26, fontWeight:800, color:'#fff', letterSpacing:'0.04em' }}>MemphisClean</div>
          <div style={{ marginTop:10, fontSize:11, color:'rgba(255,255,255,0.4)', letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:600 }}>CRM · Sales Portal</div>
        </div>

        <form onSubmit={handleSubmit} style={{ background:'rgba(255,255,255,0.05)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, padding:'28px' }}>
          <h2 style={{ color:'#fff', fontSize:17, fontWeight:700, margin:'0 0 4px' }}>Sign in</h2>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:12, margin:'0 0 22px' }}>Enter your credentials to continue</p>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.55)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.06em' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="you@memphisclean.com"
                autoComplete="email"
                style={inputStyle(!!error)}
              />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.55)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.06em' }}>Password</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ ...inputStyle(!!error), paddingRight:42 }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', fontSize:16, padding:0, lineHeight:1 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background:'rgba(248,113,113,0.15)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#FCA5A5', marginTop:14, lineHeight:1.5 }}>
              ⚠ {error}
            </div>
          )}

          <button type="submit" disabled={loading || !email || !password}
            style={{ width:'100%', marginTop:20, padding:'13px', border:'none', borderRadius:10, background:(loading||!email||!password)?'rgba(255,255,255,0.1)':GOLD, color:(loading||!email||!password)?'rgba(255,255,255,0.3)':NAVY, fontSize:14, fontWeight:800, cursor:(loading||!email||!password)?'not-allowed':'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading
              ? <><span style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}></span> Signing in…</>
              : 'Sign In'
            }
          </button>
        </form>

        <p style={{ color:'rgba(255,255,255,0.18)', fontSize:11, textAlign:'center', marginTop:18 }}>MemphisClean CRM · Memphis, TN</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── REP USER FORM MODAL (add/edit CRM profile) ─────────────────────
function RepUserFormModal({ user, onSave, onClose }) {
  const blank = { name:'', email:'', role:'rep', initials:'', color:AVATAR_COLORS[0], id:'' };
  const [form, setForm] = useState8(user ? { ...user } : blank);
  const [error, setError] = useState8('');
  const set = (k,v) => { setForm(p => ({ ...p, [k]:v })); setError(''); };

  const autoInitials = (name) => {
    const parts = name.trim().split(' ').filter(Boolean);
    return parts.map(p => p[0].toUpperCase()).slice(0,2).join('');
  };

  const canSave = form.name.trim() && form.email.trim() && form.role;

  const handleSave = () => {
    if (!canSave) return;
    if (!form.email.includes('@')) { setError('Enter a valid email address.'); return; }
    onSave({ ...form, email: form.email.trim().toLowerCase() });
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:460, padding:'28px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'90vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'#1A1D2E' }}>{user ? 'Edit User Profile' : 'Add CRM User'}</h2>
            <p style={{ margin:'3px 0 0', fontSize:12, color:'#6B7280' }}>
              {user ? 'Update name, role or avatar' : 'Email must match their Firebase Auth account'}
            </p>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'#F3F4F6', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:16, color:'#6B7280' }}>×</button>
        </div>

        {/* Avatar preview */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:form.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff' }}>
            {form.initials || '?'}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Full Name *</label>
            <input value={form.name} onChange={e => { set('name', e.target.value); if (!user) set('initials', autoInitials(e.target.value)); }} placeholder="e.g. Khule Khumalo" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Email Address * <span style={{ fontWeight:400, color:'#9CA3AF' }}>(must match Firebase Auth account)</span></label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="user@memphisclean.com" disabled={!!user} style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', background: user ? '#F9FAFB' : '#fff', color: user ? '#6B7280' : '#1A1D2E' }} />
            {user && <p style={{ margin:'4px 0 0', fontSize:11, color:'#9CA3AF' }}>Email cannot be changed here — manage in Firebase console.</p>}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Initials *</label>
              <input value={form.initials} onChange={e => set('initials', e.target.value.toUpperCase().slice(0,3))} placeholder="KK" maxLength={3} style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', letterSpacing:'0.1em', fontWeight:700 }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Role *</label>
              <select value={form.role} onChange={e => set('role', e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', background:'#fff' }}>
                <option value="rep">Sales Rep</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:8 }}>Avatar Colour</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {AVATAR_COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)} style={{ width:28, height:28, borderRadius:'50%', background:c, border: form.color===c ? '3px solid #1A1D2E' : '3px solid transparent', cursor:'pointer' }}></button>
              ))}
            </div>
          </div>
          {error && <div style={{ fontSize:12, color:'#F43F5E', fontWeight:600 }}>⚠ {error}</div>}
        </div>

        {!user && (
          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'10px 14px', marginTop:16, fontSize:12, color:'#1E40AF', lineHeight:1.6 }}>
            <strong>Before adding:</strong> first create this user's account in <strong>Firebase console → Authentication → Add user</strong> using the same email address. Then add them here.
          </div>
        )}

        <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', border:'1.5px solid #E5E7EB', borderRadius:8, background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={!canSave} style={{ padding:'8px 20px', border:'none', borderRadius:8, background:canSave?NAVY:'#E5E7EB', color:canSave?'#fff':'#9CA3AF', fontSize:13, fontWeight:700, cursor:canSave?'pointer':'not-allowed' }}>
            {user ? 'Save Changes' : 'Add User'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ADMIN REP MANAGER ─────────────────────────────────────────────
function RepManager() {
  const [users,         setUsers]         = useState8([]);
  const [loading,       setLoading]       = useState8(true);
  const [showAdd,       setShowAdd]       = useState8(false);
  const [editUser,      setEditUser]      = useState8(null);
  const [confirmDelete, setConfirmDelete] = useState8(null);
  const [showEmailSettings, setShowEmailSettings] = useState8(false);

  // Load all CRM user profiles from Firestore reps collection
  useEffect8(() => {
    if (typeof db === 'undefined') { setLoading(false); return; }
    const unsub = db.collection('reps').onSnapshot(snap => {
      setUsers(snap.docs.map(doc => ({ _docId: doc.id, ...doc.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const handleSave = (userData) => {
    // Use email-based doc ID so lookup by email works reliably
    const docId = userData._docId || ('rep_' + Date.now());
    const profile = {
      id: userData.id || docId,
      name: userData.name,
      email: userData.email,
      initials: userData.initials,
      color: userData.color,
      role: userData.role,
    };
    db.collection('reps').doc(docId).set(profile).catch(console.error);
    setShowAdd(false);
    setEditUser(null);
  };

  const handleDelete = (user) => {
    if (user._docId) db.collection('reps').doc(user._docId).delete().catch(console.error);
    setConfirmDelete(null);
  };

  const roleColor = (role) => role === 'admin'
    ? { bg:'rgba(247,185,30,0.12)', color:'#92400E', border:'rgba(247,185,30,0.4)' }
    : { bg:'rgba(43,57,144,0.08)', color:NAVY, border:'rgba(43,57,144,0.2)' };

  return (
    <div style={{ padding:'28px 32px', maxWidth:720 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#1A1D2E', margin:0 }}>Users & Settings</h1>
          <p style={{ color:'#6B7280', fontSize:13, margin:'4px 0 0' }}>Manage CRM access, email settings and user profiles</p>
        </div>
        <button onClick={() => { setEditUser(null); setShowAdd(true); }} style={{ padding:'8px 16px', background:NAVY, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:18, lineHeight:1 }}>+</span> Add User
        </button>
      </div>

      {/* Email Settings */}
      <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', gap:16, marginBottom:12 }}>
        <div style={{ width:46, height:46, borderRadius:'50%', background:'rgba(16,185,129,0.1)', border:'1.5px solid rgba(16,185,129,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" size={20} color='#059669' />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#1A1D2E' }}>Email Settings</div>
          <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>Configure EmailJS to send real emails from the CRM</div>
        </div>
        <button onClick={() => setShowEmailSettings(true)} style={{ padding:'6px 14px', border:'1.5px solid #A7F3D0', borderRadius:7, background:'#ECFDF5', color:'#065F46', fontSize:12, fontWeight:700, cursor:'pointer' }}>Configure</button>
      </div>

      {/* Security info */}
      <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'flex-start', gap:12, marginBottom:20 }}>
        <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>🔒</span>
        <div style={{ fontSize:12, color:'#1E40AF', lineHeight:1.7 }}>
          <strong>Passwords are managed in Firebase console.</strong> To reset a password or create a new account, go to <strong>console.firebase.google.com → Authentication → Users</strong>. Add the user here after creating their Firebase account.
        </div>
      </div>

      {/* Users list */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#9CA3AF' }}>Loading users…</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {users.map(user => {
            const rc = roleColor(user.role);
            return (
              <div key={user._docId || user.id} style={{ background:'#fff', border:'1px solid #E9EBF0', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:46, height:46, borderRadius:'50%', background:user.color||NAVY, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:'#fff', flexShrink:0 }}>{user.initials || '?'}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#1A1D2E' }}>{user.name}</div>
                  <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>{user.email}</div>
                </div>
                <span style={{ fontSize:11, fontWeight:700, background:rc.bg, color:rc.color, border:`1px solid ${rc.border}`, borderRadius:99, padding:'3px 10px' }}>
                  {user.role === 'admin' ? 'Admin' : 'Rep'}
                </span>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setEditUser(user)} style={{ padding:'6px 14px', border:'1.5px solid #E5E7EB', borderRadius:7, background:'#fff', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer' }}>Edit</button>
                  <button onClick={() => setConfirmDelete(user)} style={{ padding:'6px 14px', border:'1.5px solid #FEE2E2', borderRadius:7, background:'#FFF5F5', color:'#DC2626', fontSize:12, fontWeight:600, cursor:'pointer' }}>Remove</button>
                </div>
              </div>
            );
          })}
          {users.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'#9CA3AF', fontSize:14, border:'2px dashed #E5E7EB', borderRadius:12 }}>No users yet — add one above.</div>
          )}
        </div>
      )}

      {showEmailSettings && <EmailSettingsModal onClose={() => setShowEmailSettings(false)} />}

      {(showAdd || editUser) && (
        <RepUserFormModal
          user={editUser}
          onSave={handleSave}
          onClose={() => { setShowAdd(false); setEditUser(null); }}
        />
      )}

      {confirmDelete && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setConfirmDelete(null)}>
          <div style={{ background:'#fff', borderRadius:16, padding:'28px', width:380, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ margin:'0 0 8px', fontSize:16, fontWeight:700, color:'#1A1D2E' }}>Remove {confirmDelete.name}?</h3>
            <p style={{ margin:'0 0 6px', fontSize:13, color:'#6B7280' }}>This removes their CRM profile. Their contact data stays. To fully revoke access, also delete them from <strong>Firebase console → Authentication</strong>.</p>
            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding:'8px 18px', border:'1.5px solid #E5E7EB', borderRadius:8, background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ padding:'8px 18px', border:'none', borderRadius:8, background:'#DC2626', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── EMAIL SETTINGS MODAL ─────────────────────────────────────────
function EmailSettingsModal({ onClose }) {
  const [form,    setForm]    = useState8({ serviceId:'', templateId:'', publicKey:'', fromEmail:'', fromName:'' });
  const [saved,   setSaved]   = useState8(false);
  const [loading, setLoading] = useState8(true);
  const [error,   setError]   = useState8('');

  useEffect8(() => {
    if (typeof db === 'undefined') { setLoading(false); return; }
    db.collection('settings').doc('email').get().then(doc => {
      if (doc.exists) setForm({ serviceId:'', templateId:'', publicKey:'', fromEmail:'', fromName:'', ...doc.data() });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  const handleSave = () => {
    if (!form.serviceId || !form.templateId || !form.publicKey || !form.fromEmail) {
      setError('Service ID, Template ID, Public Key and From Email are all required.');
      return;
    }
    db.collection('settings').doc('email').set(form)
      .then(() => { setSaved(true); setTimeout(onClose, 700); })
      .catch(() => setError('Failed to save. Please try again.'));
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:480, padding:'28px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'90vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'#1A1D2E' }}>Email Settings</h2>
            <p style={{ margin:'3px 0 0', fontSize:12, color:'#6B7280' }}>Configure EmailJS to send real emails from the CRM</p>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'#F3F4F6', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:16, color:'#6B7280' }}>×</button>
        </div>

        <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:10, padding:'12px 14px', marginBottom:20, fontSize:12, color:'#1E40AF', lineHeight:1.7 }}>
          <div style={{ fontWeight:700, marginBottom:4 }}>📧 EmailJS Setup (free — 200 emails/month)</div>
          <ol style={{ margin:0, paddingLeft:18 }}>
            <li>Go to <strong>emailjs.com</strong> → create a free account</li>
            <li>Add your email provider → copy the <strong>Service ID</strong></li>
            <li>Create a template with variables: <code style={{ background:'#DBEAFE', padding:'1px 4px', borderRadius:3, fontSize:11 }}>{'{{to_email}} {{to_name}} {{company}} {{from_name}} {{reply_to}} {{subject}} {{message}}'}</code></li>
            <li>Copy the <strong>Template ID</strong> and <strong>Public Key</strong></li>
          </ol>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'20px', color:'#9CA3AF' }}>Loading…</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Service ID *</label>
                <input value={form.serviceId} onChange={e=>set('serviceId',e.target.value)} placeholder="service_abc123" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'monospace' }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Template ID *</label>
                <input value={form.templateId} onChange={e=>set('templateId',e.target.value)} placeholder="template_xyz789" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'monospace' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Public Key *</label>
              <input value={form.publicKey} onChange={e=>set('publicKey',e.target.value)} placeholder="user_XXXXXXXXXXXXXXXXX" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'monospace' }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>From Email *</label>
                <input value={form.fromEmail} onChange={e=>set('fromEmail',e.target.value)} placeholder="KhuleK@memphisclean.com" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>From Name</label>
                <input value={form.fromName} onChange={e=>set('fromName',e.target.value)} placeholder="Khule — MemphisClean" style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
              </div>
            </div>
            {error && <div style={{ fontSize:12, color:'#F43F5E', fontWeight:600 }}>⚠ {error}</div>}
          </div>
        )}

        <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', border:'1.5px solid #E5E7EB', borderRadius:8, background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSave} style={{ padding:'8px 20px', border:'none', borderRadius:8, background:saved?'#10B981':NAVY, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', transition:'background 0.2s' }}>
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, RepManager });
