// Dashboard + Pipeline + CallQueue + Contacts views
const { useState: useState2, useMemo } = React;

// ── DASHBOARD ──────────────────────────────────────────────────────
function Dashboard({ contacts, onOpenContact }) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const weekEnd = new Date(todayStart.getTime() + 7 * 86400000);

  const stats = useMemo(() => {
    const active = contacts.filter((c) => c.stage !== 'Won' && c.stage !== 'Lost');
    const todayCalls = contacts.filter((c) => c.callLog.some((l) => new Date(l.date) >= todayStart && new Date(l.date) < todayEnd));
    const appts = contacts.filter((c) => c.nextActionDate && new Date(c.nextActionDate) >= todayStart && new Date(c.nextActionDate) < weekEnd && c.stage === 'Appointment Set');
    const pipeline = active.filter((c) => c.quoteAmount > 0).reduce((s, c) => s + c.quoteAmount, 0);
    const todayQueue = active.filter((c) => c.nextActionDate && new Date(c.nextActionDate) <= todayEnd);
    return { active: active.length, todayCalls: todayCalls.length, appts: appts.length, pipeline, todayQueue };
  }, [contacts]);

  const dueToday = contacts.filter((c) => {
    if (c.stage === 'Won' || c.stage === 'Lost') return false;
    if (!c.nextActionDate) return false;
    const nd = new Date(c.nextActionDate);
    return nd <= new Date(todayStart.getTime() + 86400000);
  }).sort((a, b) => new Date(a.nextActionDate) - new Date(b.nextActionDate));

  const recentCalls = contacts.flatMap((c) => c.callLog.map((l) => ({ ...l, contact: c }))).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  const fmtTime = (iso) => {const d = new Date(iso);return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });};
  const fmtDate = (iso) => {const d = new Date(iso);const diff = Math.round((d - now) / 86400000);if (diff === 0) return 'Today';if (diff === -1) return 'Yesterday';if (diff === 1) return 'Tomorrow';return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });};
  const fmtR = (n) => n >= 1000 ? `R${(n / 1000).toFixed(0)}k` : `R${n}`;
  const outcomeColor = (o) => o.includes('Interested') ? '#10B981' : o.includes('Not') ? '#F43F5E' : o.includes('Callback') ? '#F97316' : '#6B7280';

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1D2E', margin: 0 }}>Good morning, George 👋</h1>
        <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 0' }}>{now.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {[
        { label: 'Active Leads', value: stats.active, sub: 'in pipeline', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', color: NAVY },
        { label: "Today's Calls", value: stats.todayCalls, sub: 'logged today', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', color: '#0E7490' },
        { label: 'Appts This Week', value: stats.appts, sub: 'scheduled', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: '#7C3AED' },
        { label: 'Pipeline Value', value: fmtR(stats.pipeline), sub: 'quoted deals', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 6v1m0 4v1m-5.196-5.879A7.007 7.007 0 0012 19c3.866 0 7-3.134 7-7', color: '#D97706' }].
        map((s) =>
        <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #E9EBF0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon path={s.icon} size={16} color={s.color} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#1A1D2E', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{s.sub}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Today's Queue */}
        <div style={{ background: '#fff', border: '1px solid #E9EBF0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, color: '#1A1D2E', fontSize: 14 }}>Today's Call Queue</div>
            <span style={{ background: GOLD + '22', color: '#92680A', fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '2px 8px' }}>{dueToday.length} due</span>
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {dueToday.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>All clear — nothing due today!</div>}
            {dueToday.map((c) =>
            <div key={c.id} onClick={() => onOpenContact(c)} style={{ padding: '12px 20px', borderBottom: '1px solid #F9FAFB', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'background 0.1s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FF'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: NAVY + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" size={15} color={NAVY} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1A1D2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.company}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{c.contactPerson} · {fmtTime(c.nextActionDate)}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nextAction}</div>
                </div>
                <StageBadge stage={c.stage} />
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ background: '#fff', border: '1px solid #E9EBF0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ fontWeight: 700, color: '#1A1D2E', fontSize: 14 }}>Recent Call Activity</div>
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {recentCalls.map((l) =>
            <div key={l.id} onClick={() => onOpenContact(l.contact)} style={{ padding: '11px 20px', borderBottom: '1px solid #F9FAFB', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FF'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: outcomeColor(l.outcome), marginTop: 4, flexShrink: 0 }}></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1D2E' }}>{l.contact.company}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{l.outcome} · {l.duration}</div>
                  {l.notes && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.notes}</div>}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDate(l.date)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>);

}

// ── PIPELINE KANBAN ────────────────────────────────────────────────
function Pipeline({ contacts, setContacts, onOpenContact }) {
  const stages = ['New Lead', 'Called', 'Interested', 'Appointment Set', 'Quoted', 'Won', 'Lost'];
  const fmtR = (n) => n >= 1000 ? `R${(n / 1000).toFixed(0)}k` : `R${n}`;
  const moveStage = (contact, newStage) => {
    setContacts((prev) => prev.map((c) => c.id === contact.id ? { ...c, stage: newStage } : c));
  };
  return (
    <div style={{ padding: '24px 24px 0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1D2E', margin: 0 }}>Sales Pipeline</h1>
        <p style={{ color: '#6B7280', fontSize: 13, margin: '3px 0 0' }}>{contacts.filter((c) => c.stage !== 'Won' && c.stage !== 'Lost').length} active leads across pipeline</p>
      </div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 20, flex: 1, alignItems: 'flex-start' }}>
        {stages.map((stage) => {
          const cards = contacts.filter((c) => c.stage === stage);
          const total = cards.filter((c) => c.quoteAmount > 0).reduce((s, c) => s + c.quoteAmount, 0);
          const sc = STAGE_COLORS[stage];
          return (
            <div key={stage} style={{ minWidth: 200, width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ padding: '8px 10px', borderRadius: 8, background: sc.bg, marginBottom: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: sc.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stage}</span>
                  <span style={{ background: 'rgba(0,0,0,0.08)', color: sc.text, borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>{cards.length}</span>
                </div>
                {total > 0 && <div style={{ fontSize: 10, color: sc.text, opacity: 0.7, marginTop: 2 }}>{fmtR(total)}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cards.map((c) =>
                <div key={c.id} onClick={() => onOpenContact(c)} style={{ background: '#fff', border: '1px solid #E9EBF0', borderRadius: 10, padding: '12px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                onMouseEnter={(e) => {e.currentTarget.style.borderColor = NAVY + '44';e.currentTarget.style.boxShadow = '0 4px 12px rgba(43,57,144,0.1)';}}
                onMouseLeave={(e) => {e.currentTarget.style.borderColor = '#E9EBF0';e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';}}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1D2E', marginBottom: 3, lineHeight: 1.3 }}>{c.company}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>{c.contactPerson}</div>
                    {c.quoteAmount > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', marginBottom: 8 }}>{fmtR(c.quoteAmount)}/mo</div>}
                    {c.nextActionDate && <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={11} color='#9CA3AF' />
                      {new Date(c.nextActionDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                    </div>}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {stages.filter((s) => s !== stage).slice(0, 2).map((s2) =>
                    <button key={s2} onClick={(e) => {e.stopPropagation();moveStage(c, s2);}} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, border: '1px solid #E5E7EB', background: 'transparent', color: '#6B7280', cursor: 'pointer', fontWeight: 600 }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          → {s2}
                        </button>
                    )}
                    </div>
                  </div>
                )}
              </div>
            </div>);

        })}
      </div>
    </div>);

}

// ── CALL QUEUE ─────────────────────────────────────────────────────
function CallQueue({ contacts, setContacts, onOpenContact, currentUser }) {
  const [filter,           setFilter]           = useState2('all');
  const [showManualDialer, setShowManualDialer] = useState2(false);
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const queue = contacts.filter((c) => {
    if (c.stage === 'Won' || c.stage === 'Lost') return false;
    if (!c.nextActionDate) return filter === 'all' ? false : false;
    const nd = new Date(c.nextActionDate);
    if (filter === 'today') return nd < todayEnd;
    if (filter === 'overdue') return nd < now;
    return nd < new Date(now.getTime() + 7 * 86400000);
  }).sort((a, b) => new Date(a.nextActionDate) - new Date(b.nextActionDate));

  const noCalls = contacts.filter((c) => c.stage !== 'Won' && c.stage !== 'Lost' && c.callLog.length === 0);
  const fmtDue = (iso) => {
    const d = new Date(iso),diff = Math.round((d - now) / 86400000);
    if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: '#F43F5E', urgent: true };
    if (diff === 0) return { label: 'Due today', color: '#F97316', urgent: true };
    if (diff === 1) return { label: 'Due tomorrow', color: '#F59E0B', urgent: false };
    return { label: d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }), color: '#6B7280', urgent: false };
  };
  const outcomeColor = (o) => o.includes('Interested') && !o.includes('Not') ? '#10B981' : o.includes('Not') ? '#F43F5E' : o.includes('Callback') ? '#F97316' : '#6B7280';

  return (
    <>
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1D2E', margin: 0 }}>Call Queue</h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: '3px 0 0' }}>Prioritised by follow-up date</p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setShowManualDialer(true)} style={{ padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${NAVY}`, background: NAVY, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 14 }}>🔢</span> Manual Dial
          </button>
          <div style={{ width: 1, height: 22, background: '#E5E7EB', margin: '0 2px' }} />
          {[['today', 'Today'], ['week', 'This Week'], ['all', 'All Active']].map(([v, l]) =>
          <button key={v} onClick={() => setFilter(v)} style={{ padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${filter === v ? NAVY : '#E5E7EB'}`, background: filter === v ? NAVY : '#fff', color: filter === v ? '#fff' : '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{l}</button>
          )}
        </div>
      </div>

      {noCalls.length > 0 &&
      <div style={{ background: GOLD + '18', border: `1px solid ${GOLD}44`, borderRadius: 10, padding: '10px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" size={16} color='#92680A' />
          <span style={{ fontSize: 12, color: '#92680A', fontWeight: 600 }}>{noCalls.length} lead{noCalls.length > 1 ? 's' : ''} with no calls yet — <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => onOpenContact(noCalls[0])}>start with {noCalls[0].company}</span></span>
        </div>
      }

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {queue.length === 0 && <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF', fontSize: 14 }}>Nothing in queue for this period.</div>}
        {queue.map((c, i) => {
          const due = fmtDue(c.nextActionDate);
          const lastCall = c.callLog[c.callLog.length - 1];
          return (
            <div key={c.id} onClick={() => onOpenContact(c)} style={{ background: '#fff', border: `1px solid ${due.urgent ? '#FED7AA' : '#E9EBF0'}`, borderLeft: `3px solid ${due.urgent ? '#F97316' : NAVY}`, borderRadius: 10, padding: '14px 18px', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'flex-start', transition: 'all 0.15s' }}
            onMouseEnter={(e) => {e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';}}
            onMouseLeave={(e) => {e.currentTarget.style.boxShadow = 'none';}}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${NAVY}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: NAVY }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#1A1D2E' }}>{c.company}</span>
                  <StageBadge stage={c.stage} />
                  {due.urgent && <span style={{ fontSize: 11, fontWeight: 700, color: due.color }}>⚡ {due.label}</span>}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{c.contactPerson} · {c.phone}</div>
                <div style={{ fontSize: 12, color: '#374151', marginTop: 4, fontStyle: 'italic' }}>{c.nextAction}</div>
                {lastCall &&
                <div style={{ marginTop: 6, fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: outcomeColor(lastCall.outcome), flexShrink: 0, display: 'inline-block' }}></span>
                    Last call: {lastCall.outcome} · {new Date(lastCall.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                  </div>
                }
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {!due.urgent && <div style={{ fontSize: 11, color: due.color, fontWeight: 600 }}>{due.label}</div>}
                <div style={{ marginTop: 6, fontSize: 10, color: '#9CA3AF' }}>{c.callLog.length} call{c.callLog.length !== 1 ? 's' : ''}</div>
              </div>
            </div>);

        })}
      </div>
    </div>
    {showManualDialer && <TwilioManualDialer onClose={()=>setShowManualDialer(false)} currentUser={currentUser} />}
    </>);

}

// ── ALL CONTACTS ───────────────────────────────────────────────────
function AllContacts({ contacts, onOpenContact, onAddContact, onDeleteContact }) {
  const [search, setSearch] = useState2('');
  const [stageFilter, setStageFilter] = useState2('All');
  const [showDupModal, setShowDupModal] = useState2(false);
  const stages = ['All', 'New Lead', 'Called', 'Interested', 'Appointment Set', 'Quoted', 'Won', 'Lost'];
  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const match = !q || c.company.toLowerCase().includes(q) || c.contactPerson.toLowerCase().includes(q) || c.phone.includes(q);
    const sf = stageFilter === 'All' || c.stage === stageFilter;
    return match && sf;
  });
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';
  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1D2E', margin: 0 }}>All Contacts <span style={{ color: '#9CA3AF', fontWeight: 400 }}>({contacts.length})</span></h1>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setShowDupModal(true)} style={{ padding: '8px 14px', background: '#fff', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" size={14} color='#D97706' /> Find Duplicates
          </button>
          <button onClick={onAddContact} style={{ padding: '8px 16px', background: NAVY, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Contact
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company, name, phone…" style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none' }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {stages.map((s) =>
          <button key={s} onClick={() => setStageFilter(s)} style={{ padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${stageFilter === s ? NAVY : '#E5E7EB'}`, background: stageFilter === s ? NAVY : '#fff', color: stageFilter === s ? '#fff' : '#374151', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>{s}</button>
          )}
        </div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #E9EBF0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8F9FC', borderBottom: '1px solid #E9EBF0' }}>
              {['Company', 'Contact', 'Phone', 'Stage', 'Last Call', 'Next Action', 'Quote'].map((h) =>
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) =>
            <tr key={c.id} onClick={() => onOpenContact(c)} style={{ borderBottom: '1px solid #F3F4F6', cursor: 'pointer', transition: 'background 0.1s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FF'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '11px 14px', fontWeight: 700, color: '#1A1D2E' }}>{c.company}</td>
                <td style={{ padding: '11px 14px', color: '#374151' }}>{c.contactPerson}</td>
                <td style={{ padding: '11px 14px', color: '#6B7280', fontFamily: 'monospace', fontSize: 12 }}>{c.phone}</td>
                <td style={{ padding: '11px 14px' }}><StageBadge stage={c.stage} /></td>
                <td style={{ padding: '11px 14px', color: '#6B7280' }}>{fmtDate(c.lastCallDate)}</td>
                <td style={{ padding: '11px 14px', color: '#374151', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nextAction || '—'}</td>
                <td style={{ padding: '11px 14px', color: '#D97706', fontWeight: 600 }}>{c.quoteAmount ? `R${(c.quoteAmount / 1000).toFixed(0)}k/mo` : '—'}</td>
              </tr>
            )}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF' }}>No contacts match your search.</div>}
      </div>
      {showDupModal && (
        <FindDuplicatesModal
          contacts={contacts}
          onDelete={onDeleteContact}
          onClose={() => setShowDupModal(false)} />
      )}
    </div>);

}

// ── FIND DUPLICATES MODAL ──────────────────────────────────────────
function FindDuplicatesModal({ contacts, onDelete, onClose }) {
  const [resolved, setResolved] = useState2(new Set());

  // Group contacts that share a normalised phone or company name
  const normPhone = p => (p||'').replace(/[\s\-\+\(\)\.]/g,'');
  const normCo    = c => (c||'').toLowerCase().replace(/[^a-z0-9]/g,'');

  const groups = useMemo(() => {
    const seen = new Map(); // key -> [contacts]
    contacts.forEach(c => {
      const keys = [];
      if (normPhone(c.phone).length > 4) keys.push('ph:' + normPhone(c.phone));
      if (normCo(c.company).length > 2)  keys.push('co:' + normCo(c.company));
      keys.forEach(k => {
        if (!seen.has(k)) seen.set(k, []);
        seen.get(k).push(c);
      });
    });
    // Collect unique groups of 2+ contacts, deduplicate groups
    const groupMap = new Map();
    seen.forEach((members) => {
      if (members.length < 2) return;
      const key = [...members].map(m=>m.id).sort().join('|');
      groupMap.set(key, members);
    });
    return [...groupMap.values()];
  }, [contacts]);

  const pending = groups.filter(g => !g.every(c => resolved.has(c.id)));

  const handleDelete = (contact) => {
    onDelete(contact);
    setResolved(prev => new Set([...prev, contact.id]));
  };

  const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'2-digit' }) : '—';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:680, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'22px 28px', borderBottom:'1px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'#1A1D2E' }}>Find Duplicates</h2>
            <p style={{ margin:'3px 0 0', fontSize:12, color:'#6B7280' }}>
              {pending.length === 0 ? 'No duplicates found — your contacts are clean ✓' : `${pending.length} duplicate group${pending.length>1?'s':''} found`}
            </p>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'#F3F4F6', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:16, color:'#6B7280' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY:'auto', padding:'20px 28px', flex:1 }}>
          {pending.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>✓</div>
              <div style={{ fontSize:14, color:'#6B7280' }}>No duplicates detected across {contacts.length} contacts.</div>
            </div>
          )}
          {pending.map((group, gi) => {
            const members = group.filter(c => !resolved.has(c.id));
            if (members.length < 2) return null;
            return (
              <div key={gi} style={{ marginBottom:20, border:'1px solid #FED7AA', borderRadius:12, overflow:'hidden' }}>
                <div style={{ background:'#FFF7ED', padding:'10px 16px', fontSize:11, fontWeight:700, color:'#C2410C', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  Duplicate group · {members.length} contacts
                </div>
                {members.map((c, ci) => (
                  <div key={c.id} style={{ padding:'14px 16px', borderTop: ci>0 ? '1px solid #FEF3C7' : 'none', display:'flex', gap:14, alignItems:'flex-start', background:'#fff' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:'#1A1D2E' }}>{c.company}</div>
                      <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>{c.contactPerson}{c.title ? ` · ${c.title}` : ''}</div>
                      <div style={{ display:'flex', gap:12, marginTop:6, flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, color:'#9CA3AF' }}>📞 {c.phone||'—'}</span>
                        <span style={{ fontSize:11, color:'#9CA3AF' }}>📧 {c.email||'—'}</span>
                        <span style={{ fontSize:11, color:'#9CA3AF' }}>Last call: {fmtDate(c.lastCallDate)}</span>
                        <span style={{ fontSize:11, color:'#9CA3AF' }}>{c.callLog?.length||0} call{c.callLog?.length!==1?'s':''} logged</span>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0, alignItems:'flex-end' }}>
                      <StageBadge stage={c.stage} />
                      <button
                        onClick={() => handleDelete(c)}
                        style={{ padding:'5px 12px', border:'1.5px solid #FEE2E2', borderRadius:7, background:'#FFF5F5', color:'#DC2626', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                        Remove this one
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ padding:'16px 28px', borderTop:'1px solid #F3F4F6', flexShrink:0, display:'flex', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 20px', border:'none', borderRadius:8, background:NAVY, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>Done</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, Pipeline, CallQueue, AllContacts, FindDuplicatesModal });