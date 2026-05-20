/* Connect-a-calendar modal — pure mock, no real OAuth.
   Triggered from the AppHeader's "N connected" indicator.

   global: React, useT, FONT_HEAD, FONT_BODY, FONT_NUM, Eyebrow, sourceOf */
const { useState } = React;

function ConnectModal({ open, onClose, accounts, onConnect, onDisconnect }) {
  const T = useT();
  const [connecting, setConnecting] = useState(null);
  if (!open) return null;

  const PROVIDERS = [
    { id: 'google',  label: 'Google Calendar',         sub: 'Personal & work · OAuth',   mark: 'G' },
    { id: 'outlook', label: 'Outlook · Microsoft 365', sub: 'OAuth · M365 tenants',      mark: 'O' },
    { id: 'icloud',  label: 'iCloud Calendar',         sub: 'App-specific password',     mark: '◐' },
    { id: 'caldav',  label: 'CalDAV',                  sub: 'Any standards server',      mark: '◑' },
    { id: 'ics',     label: 'Subscribe by URL · ICS',  sub: 'Read-only feed',            mark: '↗' },
  ];

  const handleConnect = (provider) => {
    setConnecting(provider.id);
    setTimeout(() => { onConnect(provider); setConnecting(null); }, 1300);
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(10, 8, 6, 0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 32, backdropFilter: 'blur(3px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(640px, 100%)', maxHeight: '88vh',
        background: T.paper, border: `1px solid ${T.rule}`,
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }} className="modal-in">
        <div style={{
          padding: '22px 28px 18px',
          borderBottom: `1px solid ${T.rule}`, background: T.paperDark,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            <Eyebrow style={{ marginBottom: 6 }}>Sources</Eyebrow>
            <h2 style={{
              fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 26,
              margin: 0, letterSpacing: '-0.02em', color: T.ink,
            }}>Connect a <em style={{ color: T.red, textShadow: `0 0 18px ${T.red}33` }}>calendar</em>.</h2>
            <p style={{
              fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 13,
              color: T.ink2, margin: '6px 0 0', lineHeight: 1.4,
            }}>
              Sign in once. Events flow in. The schedule keeps itself.
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            color: T.ink2, fontSize: 18, cursor: 'pointer', padding: 0, lineHeight: 1,
          }}>✕</button>
        </div>

        <div style={{ padding: '16px 28px 0' }}>
          <Eyebrow style={{ marginBottom: 8 }}>Connected</Eyebrow>
          {accounts.filter(a => a.connected).length === 0 ? (
            <p style={{ fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 12, color: T.ink2, margin: '0 0 12px' }}>
              No calendars connected yet.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {accounts.filter(a => a.connected).map(a => {
                const s = sourceOf(a.id);
                return (
                  <li key={a.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    border: `1px solid ${T.ruleSoft}`, background: T.paperDark,
                  }}>
                    <span style={{ width: 10, height: 10, background: s.hex, borderRadius: '50%' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: FONT_BODY, fontSize: 12, color: T.ink,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{s.label}</div>
                      <div style={{
                        fontFamily: FONT_NUM, fontStyle: 'italic', fontSize: 11, color: T.ink2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{a.email}</div>
                    </div>
                    <span style={{
                      fontFamily: FONT_BODY, fontSize: 9, letterSpacing: '0.16em',
                      textTransform: 'uppercase', color: T.ink2,
                    }}>synced</span>
                    <button onClick={() => onDisconnect(a.id)} style={{
                      background: 'transparent', border: 'none',
                      fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 11,
                      color: T.ink2, cursor: 'pointer', padding: '0 0 0 12px',
                      textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 2,
                    }}>disconnect</button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div style={{ padding: '20px 28px 28px', overflowY: 'auto' }}>
          <Eyebrow style={{ marginBottom: 12 }}>Add new</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {PROVIDERS.map(p => {
              const isConn = connecting === p.id;
              return (
                <button key={p.id} onClick={() => handleConnect(p)} disabled={isConn} className="btn-action" style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  background: T.paperDark, border: `1px solid ${T.rule}`,
                  cursor: isConn ? 'wait' : 'pointer', textAlign: 'left',
                }}>
                  <span style={{
                    width: 34, height: 34,
                    background: T.paper, border: `1px solid ${T.rule}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 18, color: T.ink,
                    flexShrink: 0,
                  }}>{p.mark}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: T.ink }}>{p.label}</div>
                    <div style={{
                      fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 11, color: T.ink2, marginTop: 2,
                    }}>{isConn ? 'opening provider…' : p.sub}</div>
                  </div>
                  <span style={{
                    fontFamily: FONT_BODY, fontSize: 9, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: T.red,
                  }}>{isConn ? '…' : 'sign in →'}</span>
                </button>
              );
            })}
          </div>

          <p style={{
            fontFamily: FONT_HEAD, fontStyle: 'italic', fontSize: 11,
            color: T.ink2, marginTop: 18, lineHeight: 1.5,
            paddingTop: 14, borderTop: `1px solid ${T.ruleSoft}`,
          }}>
            BeigeBoard reads events and free/busy. Never message content. Revoke anytime from your provider's settings.
          </p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ConnectModal });
