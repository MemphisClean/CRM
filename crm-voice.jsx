// Twilio Voice — browser-based outbound calling
const { useState: useState9, useEffect: useEffect9, useRef: useRef9 } = React;

const VOICE_SETTINGS_KEY = 'mc_twilio_voice_settings';

function loadVoiceSettings() {
  try { return JSON.parse(localStorage.getItem(VOICE_SETTINGS_KEY)) || {}; } catch { return {}; }
}

// Fetch latest settings from Firestore and cache locally
async function fetchVoiceSettings() {
  try {
    if (typeof db !== 'undefined') {
      const doc = await db.collection('settings').doc('twilio').get();
      if (doc.exists) {
        const data = doc.data();
        localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch(e) {}
  return loadVoiceSettings();
}

// ─── Settings Modal ──────────────────────────────────────────────────────────
function TwilioVoiceSettings({ onClose, currentUser }) {
  const saved = loadVoiceSettings();
  const [tokenUrl,   setTokenUrl]   = useState9(saved.tokenUrl   || '');
  const [fromNumber, setFromNumber] = useState9(saved.fromNumber || '');
  const [ok,         setOk]         = useState9(false);
  const [showCode,   setShowCode]   = useState9(false);
  const [testState,  setTestState]  = useState9('idle'); // 'idle'|'testing'|'ok'|'fail'
  const [testMsg,    setTestMsg]    = useState9('');

  const isAdmin = currentUser && currentUser.role === 'admin';

  // Load latest from Firestore on open
  useEffect9(() => {
    fetchVoiceSettings().then(s => {
      if (s.tokenUrl)   setTokenUrl(s.tokenUrl);
      if (s.fromNumber) setFromNumber(s.fromNumber);
    });
  }, []);

  const handleTest = async () => {
    const url = tokenUrl.trim();
    if (!url) { setTestState('fail'); setTestMsg('Enter a URL first.'); return; }
    setTestState('testing');
    setTestMsg('');
    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        setTestState('fail');
        setTestMsg(`HTTP ${resp.status} — check your Twilio Function is deployed and public.`);
        return;
      }
      const data = await resp.json();
      if (data.token) {
        setTestState('ok');
        setTestMsg('Connection successful — token received!');
      } else {
        setTestState('fail');
        setTestMsg('URL responded but returned no token. Check your /token Function code.');
      }
    } catch (e) {
      setTestState('fail');
      if (e.message && e.message.toLowerCase().includes('failed to fetch')) {
        setTestMsg('Failed to fetch — URL is unreachable or blocked by CORS. Verify the Twilio Function is deployed and has Access-Control-Allow-Origin: * in the response headers.');
      } else {
        setTestMsg(e.message || 'Unknown error');
      }
    }
  };

  const handleSave = () => {
    if (!isAdmin) return; // only admin can save
    const settings = { tokenUrl: tokenUrl.trim(), fromNumber: fromNumber.trim() };
    // Save to localStorage AND Firestore so all devices get it
    localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(settings));
    if (typeof db !== 'undefined') {
      db.collection('settings').doc('twilio').set(settings).catch(console.error);
    }
    setOk(true);
    setTimeout(onClose, 700);
  };

  const testColor = { idle:'#6B7280', testing:'#F97316', ok:'#10B981', fail:'#F43F5E' }[testState];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', padding:'28px', boxShadow:'0 24px 80px rgba(0,0,0,0.25)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'#1A1D2E' }}>Twilio Voice Settings</h2>
            <p style={{ margin:'3px 0 0', fontSize:12, color:'#6B7280' }}>Configure browser-to-phone calling{!isAdmin ? ' — view only' : ''}</p>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'#F3F4F6', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:16, color:'#6B7280' }}>×</button>
        </div>

        {!isAdmin && (
          <div style={{ background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#92400E', marginBottom:16 }}>
            🔒 Only admins can change Twilio settings. Contact your administrator.
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Token Function URL</label>
            <input
              value={tokenUrl}
              onChange={e=>{ setTokenUrl(e.target.value); setTestState('idle'); }}
              placeholder="https://your-service-1234.twil.io/token"
              readOnly={!isAdmin}
              style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'monospace', background: isAdmin ? '#fff' : '#F9FAFB', color: isAdmin ? '#1A1D2E' : '#6B7280' }}
            />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Your Twilio Number (caller ID)</label>
            <input
              value={fromNumber}
              onChange={e=>setFromNumber(e.target.value)}
              placeholder="+19015192057"
              readOnly={!isAdmin}
              style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', background: isAdmin ? '#fff' : '#F9FAFB', color: isAdmin ? '#1A1D2E' : '#6B7280' }}
            />
          </div>
        </div>

        {/* Test Connection */}
        <div style={{ marginBottom:16 }}>
          <button onClick={handleTest} disabled={testState==='testing'} style={{ padding:'8px 16px', border:'1.5px solid #E5E7EB', borderRadius:8, background:'#F9FAFB', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
            {testState === 'testing'
              ? <><span style={{ display:'inline-block', width:12, height:12, border:'2px solid #D1D5DB', borderTopColor:'#6B7280', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}></span> Testing…</>
              : '🔌 Test Connection'
            }
          </button>
          {testMsg && (
            <div style={{ marginTop:8, padding:'8px 12px', borderRadius:8, background: testState==='ok' ? '#ECFDF5' : '#FFF1F2', border:`1px solid ${testState==='ok' ? '#A7F3D0' : '#FECDD3'}`, fontSize:12, color:testColor, lineHeight:1.5 }}>
              {testMsg}
            </div>
          )}
        </div>

        {isAdmin && (
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginBottom:16 }}>
            <button onClick={onClose} style={{ padding:'8px 18px', border:'1.5px solid #E5E7EB', borderRadius:8, background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
            <button onClick={handleSave} style={{ padding:'8px 20px', border:'none', borderRadius:8, background: ok ? '#10B981' : NAVY, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', transition:'background 0.2s' }}>
              {ok ? '✓ Saved!' : 'Save Settings'}
            </button>
          </div>
        )}

        {!isAdmin && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
            <button onClick={onClose} style={{ padding:'8px 20px', border:'none', borderRadius:8, background:NAVY, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>Close</button>
          </div>
        )}

        {isAdmin && (
          <button onClick={()=>setShowCode(c=>!c)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:12, color:'#6B7280', padding:0, textDecoration:'underline' }}>
            {showCode ? 'Hide' : 'Show'} Twilio Function setup instructions
          </button>
        )}

        {isAdmin && showCode && (
          <div style={{ background:'#F0F4FF', border:'1px solid #C7D2FE', borderRadius:10, padding:'14px 16px', marginTop:12 }}>
            <ol style={{ margin:0, paddingLeft:16, fontSize:12, color:'#374151', lineHeight:2 }}>
              <li>Go to <strong>console.twilio.com → Functions & Assets</strong></li>
              <li>Create a <strong>Service</strong> with two Functions (code below)</li>
              <li>Set env vars: <code style={{ background:'#E0E7FF', padding:'1px 4px', borderRadius:4 }}>API_KEY</code>, <code style={{ background:'#E0E7FF', padding:'1px 4px', borderRadius:4 }}>API_SECRET</code>, <code style={{ background:'#E0E7FF', padding:'1px 4px', borderRadius:4 }}>TWIML_APP_SID</code>, <code style={{ background:'#E0E7FF', padding:'1px 4px', borderRadius:4 }}>FROM_NUMBER</code></li>
              <li>Create a <strong>TwiML App</strong> → Voice URL = your <code style={{ background:'#E0E7FF', padding:'1px 4px', borderRadius:4 }}>/voice</code> Function URL</li>
            </ol>
            <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:6 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#4338CA', marginBottom:2 }}>/token Function:</div>
              <pre style={{ margin:0, background:'#E0E7FF', borderRadius:8, padding:'8px 12px', fontFamily:'monospace', fontSize:11, color:'#3730A3', whiteSpace:'pre-wrap', overflowX:'auto' }}>{`const AccessToken = Twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;
exports.handler = function(context, event, callback) {
  const token = new AccessToken(
    context.ACCOUNT_SID, context.API_KEY, context.API_SECRET,
    { identity: 'crm-user', ttl: 3600 }
  );
  token.addGrant(new VoiceGrant({
    outgoingApplicationSid: context.TWIML_APP_SID,
    incomingAllow: false
  }));
  const resp = new Twilio.Response();
  resp.appendHeader('Access-Control-Allow-Origin', '*');
  resp.appendHeader('Content-Type', 'application/json');
  resp.setBody({ token: token.toJwt() });
  callback(null, resp);
};`}</pre>
              <div style={{ fontSize:11, fontWeight:700, color:'#4338CA', marginTop:4, marginBottom:2 }}>/voice Function:</div>
              <pre style={{ margin:0, background:'#E0E7FF', borderRadius:8, padding:'8px 12px', fontFamily:'monospace', fontSize:11, color:'#3730A3', whiteSpace:'pre-wrap', overflowX:'auto' }}>{`exports.handler = function(context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();
  const dial = twiml.dial({ callerId: context.FROM_NUMBER });
  dial.number(event.To);
  callback(null, twiml);
};`}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dialer Modal ─────────────────────────────────────────────────────────────
// Statuses: 'init' | 'ready' | 'connecting' | 'connected' | 'ended' | 'error'
function TwilioDialer({ contact, onClose, onCallEnded, currentUser }) {
  const [status,   setStatus]   = useState9('init');
  const [error,    setError]    = useState9('');
  const [seconds,  setSeconds]  = useState9(0);
  const [muted,    setMuted]    = useState9(false);
  const [showSettings, setShowSettings] = useState9(false);

  const deviceRef  = useRef9(null);
  const callRef    = useRef9(null);
  const timerRef   = useRef9(null);

  // Format seconds → m:ss
  const fmtDuration = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  useEffect9(() => {
    let mounted = true;

    const ensureSDK = () => new Promise((resolve) => {
      if (window.Twilio && window.Twilio.Device) { resolve(true); return; }
      // Try injecting the SDK dynamically if it didn't load from the script tag
      const inject = () => {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/@twilio/voice-sdk@2.12.0/dist/twilio.min.js';
        s.crossOrigin = 'anonymous';
        s.onload = () => resolve(!!(window.Twilio && window.Twilio.Device));
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
      };
      // Poll briefly in case the static script tag is still executing
      let tries = 0;
      const poll = setInterval(() => {
        tries++;
        if (window.Twilio && window.Twilio.Device) { clearInterval(poll); resolve(true); return; }
        if (tries >= 8) { clearInterval(poll); inject(); }
      }, 250);
    });

    (async () => {
      try {
        // Fetch settings from Firestore first (falls back to localStorage)
        const settings = await fetchVoiceSettings();
        if (!mounted) return;
        if (!settings.tokenUrl) { setStatus('error'); setError('No Token URL configured. Click ⚙ Twilio to configure.'); return; }

        const sdkReady = await ensureSDK();
        if (!mounted) return;
        if (!sdkReady) { setStatus('error'); setError('Twilio Voice SDK failed to load. Please reload the page and try again.'); return; }

        const resp = await fetch(settings.tokenUrl);
        if (!resp.ok) throw new Error(`Token fetch failed: HTTP ${resp.status}`);
        const { token } = await resp.json();

        if (!mounted) return;
        const device = new window.Twilio.Device(token, { logLevel: 'warn', edge: 'roaming' });
        deviceRef.current = device;

        device.on('error', (err) => {
          if (!mounted) return;
          setStatus('error');
          setError(err.message || 'Twilio Device error');
        });

        await device.register();
        if (!mounted) return;

        // Auto-dial after device is ready
        setStatus('connecting');
        const call = await device.connect({ params: { To: contact.phone } });
        callRef.current = call;

        call.on('accept', () => {
          if (!mounted) return;
          setStatus('connected');
          timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
        });

        call.on('disconnect', () => {
          if (!mounted) return;
          clearInterval(timerRef.current);
          setStatus('ended');
        });

        call.on('error', (err) => {
          if (!mounted) return;
          clearInterval(timerRef.current);
          setStatus('error');
          setError(err.message || 'Call error');
        });

      } catch (err) {
        if (!mounted) return;
        setStatus('error');
        setError(err.message);
      }
    })();

    return () => {
      mounted = false;
      clearInterval(timerRef.current);
      if (callRef.current) { try { callRef.current.disconnect(); } catch {} }
      if (deviceRef.current) { try { deviceRef.current.destroy(); } catch {} }
    };
  }, []);

  const handleHangUp = () => {
    clearInterval(timerRef.current);
    if (callRef.current) { try { callRef.current.disconnect(); } catch {} }
    setStatus('ended');
  };

  const handleMute = () => {
    if (!callRef.current) return;
    const next = !muted;
    callRef.current.mute(next);
    setMuted(next);
  };

  const handleDone = () => {
    const duration = seconds > 0 ? fmtDuration(seconds) : null;
    onCallEnded && onCallEnded(duration);
    onClose();
  };

  // ── Status display helpers ──
  const statusLabel = { init:'Initializing…', ready:'Ready', connecting:'Calling…', connected:'Connected', ended:'Call Ended', error:'Error' }[status];
  const statusColor = { init:'#9CA3AF', ready:'#10B981', connecting:'#F97316', connected:'#10B981', ended:'#6B7280', error:'#F43F5E' }[status];
  const isPulse = status === 'connecting';
  const isLive  = status === 'connected';

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={status === 'ended' || status === 'error' ? onClose : undefined}>
        <div style={{ background:'#fff', borderRadius:20, width:360, padding:'32px 28px', boxShadow:'0 32px 80px rgba(0,0,0,0.3)', textAlign:'center', position:'relative' }} onClick={e=>e.stopPropagation()}>

          {/* Settings button */}
          <button onClick={()=>setShowSettings(true)} title="Twilio Settings" style={{ position:'absolute', top:16, left:16, border:'1.5px solid #E5E7EB', background:'#fff', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:700, color:'#374151', display:'flex', alignItems:'center', gap:4 }}>⚙ Twilio</button>
          <button onClick={status === 'connected' ? handleHangUp : onClose} style={{ position:'absolute', top:16, right:16, border:'none', background:'#F3F4F6', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:16, color:'#6B7280', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>

          {/* Avatar ring */}
          <div style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
            {isPulse && (
              <>
                <div style={{ position:'absolute', width:100, height:100, borderRadius:'50%', background:'rgba(249,115,22,0.15)', animation:'pulse-ring 1.4s ease-out infinite' }}></div>
                <div style={{ position:'absolute', width:84, height:84, borderRadius:'50%', background:'rgba(249,115,22,0.1)', animation:'pulse-ring 1.4s ease-out 0.4s infinite' }}></div>
              </>
            )}
            {isLive && (
              <div style={{ position:'absolute', width:92, height:92, borderRadius:'50%', background:'rgba(16,185,129,0.12)', animation:'pulse-ring 2s ease-out infinite' }}></div>
            )}
            <div style={{ width:72, height:72, borderRadius:'50%', background: isLive ? '#ECFDF5' : isPulse ? '#FFF7ED' : '#F3F4F6', border:`3px solid ${statusColor}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, position:'relative', zIndex:1 }}>
              📞
            </div>
          </div>

          {/* Contact info */}
          <div style={{ fontSize:18, fontWeight:800, color:'#1A1D2E', marginBottom:3 }}>{contact.company}</div>
          <div style={{ fontSize:13, color:'#6B7280', marginBottom:4 }}>{contact.contactPerson}</div>
          <div style={{ fontSize:14, fontWeight:600, color:'#374151', marginBottom:16 }}>{contact.phone}</div>

          {/* Status */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, marginBottom: isLive ? 4 : 24 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:statusColor, display:'inline-block', animation: (isPulse||isLive) ? 'blink 1.2s ease-in-out infinite' : 'none' }}></span>
            <span style={{ fontSize:13, fontWeight:600, color:statusColor }}>{statusLabel}</span>
          </div>

          {/* Timer */}
          {(isLive || status === 'ended') && (
            <div style={{ fontSize: isLive ? 36 : 28, fontWeight:700, color: isLive ? '#1A1D2E' : '#6B7280', fontVariantNumeric:'tabular-nums', letterSpacing:'0.05em', marginBottom:24 }}>
              {fmtDuration(seconds)}
            </div>
          )}

          {/* Error message */}
          {status === 'error' && (
            <div style={{ background:'#FFF1F2', border:'1px solid #FECDD3', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#BE123C', marginBottom:20, textAlign:'left', lineHeight:1.5 }}>
              {error}
            </div>
          )}

          {/* Controls */}
          {status === 'connected' && (
            <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:0 }}>
              <button onClick={handleMute} style={{ width:56, height:56, borderRadius:'50%', border:'2px solid #E5E7EB', background: muted ? '#FEF3C7' : '#fff', cursor:'pointer', fontSize:22, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }} title={muted ? 'Unmute' : 'Mute'}>
                {muted ? '🔇' : '🎙'}
              </button>
              <button onClick={handleHangUp} style={{ width:56, height:56, borderRadius:'50%', border:'none', background:'#F43F5E', cursor:'pointer', fontSize:22, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(244,63,94,0.4)' }} title="Hang up">
                📵
              </button>
            </div>
          )}

          {status === 'connecting' && (
            <button onClick={handleHangUp} style={{ width:56, height:56, borderRadius:'50%', border:'none', background:'#F43F5E', cursor:'pointer', fontSize:22, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto', boxShadow:'0 4px 14px rgba(244,63,94,0.4)' }} title="Cancel">
              📵
            </button>
          )}

          {(status === 'ended' || status === 'error') && (
            <button onClick={handleDone} style={{ width:'100%', padding:'11px', border:'none', borderRadius:10, background: NAVY, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
              {status === 'ended' ? `Log Call${seconds > 0 ? ` (${fmtDuration(seconds)})` : ''}` : 'Close'}
            </button>
          )}

          {status === 'init' && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'#9CA3AF', fontSize:13 }}>
              <span style={{ display:'inline-block', width:14, height:14, border:'2px solid #D1D5DB', borderTopColor:'#6B7280', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}></span>
              Connecting to Twilio…
            </div>
          )}
        </div>
      </div>

      {showSettings && <TwilioVoiceSettings onClose={() => setShowSettings(false)} currentUser={currentUser} />}

      <style>{`
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes blink       { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes pulse-ring  { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(1.4);opacity:0} }
      `}</style>
    </>
  );
}

Object.assign(window, { TwilioDialer, TwilioVoiceSettings });
