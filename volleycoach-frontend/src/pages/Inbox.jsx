// src/pages/Inbox.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Inbox({ onBadge }) {
  const [log, setLog] = useState([]);
  const [sel, setSel] = useState(null);

  async function load() {
    try {
      const data = await api.getSmsLog();
      setLog(data);
      if (onBadge) onBadge(data.length);
    } catch (e) { console.warn('Inbox load:', e.message); }
  }

  useEffect(() => {
    load();
    if (!api.isMockMode()) {
      const id = setInterval(load, 10000);
      return () => clearInterval(id);
    }
  }, []);

  const selected = sel != null ? log[sel] : null;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ background:'var(--surface)', borderBottom:'0.5px solid var(--border)', padding:'13px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:15, fontWeight:500 }}>Inbox</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginTop:1 }}>Parent SMS replies — AI handles and books automatically</div>
        </div>
        <button className="btn" onClick={load}>↻ Refresh</button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {/* List */}
          <div className="card" style={{ marginBottom:0 }}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:12 }}>All messages ({log.length})</div>
            {log.length === 0 && <div style={{ fontSize:12, color:'var(--text3)', padding:'20px 0' }}>No messages yet. Send a broadcast and wait for parents to reply!</div>}
            {log.map((m, i) => (
              <div
                key={m.id || i}
                onClick={() => setSel(i)}
                style={{
                  display:'flex', alignItems:'flex-start', gap:10,
                  padding:'10px 8px', borderBottom:'0.5px solid var(--border)',
                  cursor:'pointer', borderRadius:'var(--radius)',
                  background: sel === i ? 'var(--green-lt)' : 'transparent',
                }}
              >
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>
                    {m.parentName || m.from}
                    <span style={{ fontWeight:400, fontSize:11, color:'var(--text3)', marginLeft:5 }}>· {m.studentName || ''}</span>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:1 }}>
                    {(m.message || '').slice(0, 55)}{(m.message || '').length > 55 ? '…' : ''}
                  </div>
                </div>
                <div style={{ fontSize:11, color:'var(--text3)', flexShrink:0 }}>
                  {m.createdAt ? new Date(m.createdAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : ''}
                </div>
              </div>
            ))}
          </div>

          {/* Detail */}
          <div className="card" style={{ marginBottom:0 }}>
            {!selected
              ? <div style={{ color:'var(--text3)', fontSize:13, textAlign:'center', padding:'40px 0' }}>Select a message to view</div>
              : <>
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:14, fontWeight:500 }}>{selected.parentName || selected.from}</div>
                    <div style={{ fontSize:11, color:'var(--text2)' }}>{selected.studentName} · {selected.from}</div>
                  </div>

                  <div style={{ background:'var(--surface2)', borderRadius:'var(--radius)', padding:10, fontSize:13, marginBottom:11 }}>
                    <div style={{ fontSize:10, color:'var(--text3)', marginBottom:3 }}>Parent message</div>
                    {selected.message}
                  </div>

                  <div style={{ background:'var(--surface2)', borderRadius:'var(--radius-lg)', padding:13, border:'0.5px solid var(--green-mid)' }}>
                    <div style={{ fontSize:11, color:'var(--green-dk)', fontWeight:500, marginBottom:5, display:'flex', alignItems:'center', gap:4 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:12, height:12 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                      AI Reply · sent automatically
                    </div>
                    <div style={{ fontSize:13, lineHeight:1.6 }}>{selected.reply || <em style={{ color:'var(--text3)' }}>Processing…</em>}</div>
                  </div>

                  {selected.slot && (
                    <div style={{ marginTop:9, display:'flex', gap:6, flexWrap:'wrap' }}>
                      <span className="tag tg">✓ Booked</span>
                      <span className="tag tb">{selected.slot.day} {selected.slot.start}–{selected.slot.end}</span>
                    </div>
                  )}
                </>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
