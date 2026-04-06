// src/pages/SendSMS.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { nextSaturdayDate, fmtHour } from '../lib/utils';

const HOURS = [12, 13, 14, 15]; // 12pm, 1pm, 2pm, 3pm (end is h+1)
const LABELS = ['12–1 PM', '1–2 PM', '2–3 PM', '3–4 PM'];

export default function SendSMS() {
  const [students,  setStudents]  = useState([]);
  const [selPars,   setSelPars]   = useState([]);
  const [wvOpen,    setWvOpen]    = useState([true, true, true, true]);
  const [satDate,   setSatDate]   = useState(nextSaturdayDate());
  const [sending,   setSending]   = useState(false);
  const [results,   setResults]   = useState(null);

  useEffect(() => {
    api.getStudents().then(s => {
      setStudents(s);
      setSelPars(s.map(x => x.id));
    }).catch(e => console.warn('Students load:', e.message));
  }, []);

  function toggleWV(i) {
    setWvOpen(prev => prev.map((v, j) => j === i ? !v : v));
  }

  function togglePar(id) {
    setSelPars(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const openHours = HOURS.filter((_, i) => wvOpen[i]);
  const windowStart = openHours.length ? Math.min(...openHours) : 12;
  const windowEnd   = openHours.length ? Math.max(...openHours) + 1 : 16;

  const satObj = new Date(satDate);
  const sunObj = new Date(satDate); sunObj.setDate(satObj.getDate() + 1);
  const fmt = d => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  const preview = `Hi! Coach Rajan here 🏐\n\nI have free training slots this weekend:\n📅 ${fmt(satObj)} (Sat)\n📅 ${fmt(sunObj)} (Sun)\n\nTime window: ${fmtHour(windowStart)} – ${fmtHour(windowEnd)}\n\nYou can book any duration e.g. "Saturday 12 to 2pm" or "Sunday 1 to 3pm".\nJust reply and our AI will confirm availability instantly!\n\n– Coach Rajan`;

  async function send() {
    if (!selPars.length) { alert('Select at least one parent.'); return; }
    if (!openHours.length) { alert('Select at least one time segment.'); return; }
    setSending(true);
    try {
      const r = await api.broadcast({ weekendSat: satDate, windowStart, windowEnd, studentIds: selPars });
      setResults(r.results);
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setSending(false);
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ background:'var(--surface)', borderBottom:'0.5px solid var(--border)', padding:'13px 22px' }}>
        <div style={{ fontSize:15, fontWeight:500 }}>Send SMS</div>
        <div style={{ fontSize:12, color:'var(--text2)', marginTop:1 }}>Broadcast weekend availability to all parents</div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
        <div className="card">
          <div style={{ fontSize:13, fontWeight:500, marginBottom:13 }}>Compose broadcast</div>

          {/* Date */}
          <div className="fg">
            <label className="fl">Weekend (Saturday date)</label>
            <input type="date" className="fi" value={satDate} onChange={e => setSatDate(e.target.value)} style={{ maxWidth:200 }} />
          </div>

          {/* Window toggle */}
          <div style={{ marginBottom:14 }}>
            <label className="fl" style={{ marginBottom:7 }}>Training window — toggle available segments</label>
            <div style={{ display:'flex', borderRadius:'var(--radius)', overflow:'hidden', border:'0.5px solid var(--border)', maxWidth:420 }}>
              {LABELS.map((l, i) => (
                <div
                  key={i}
                  onClick={() => toggleWV(i)}
                  style={{
                    flex:1, textAlign:'center', padding:'8px 4px',
                    fontSize:12, cursor:'pointer', userSelect:'none',
                    borderRight: i < 3 ? '0.5px solid var(--border)' : 'none',
                    background: wvOpen[i] ? 'var(--green)' : 'var(--surface2)',
                    color: wvOpen[i] ? 'white' : 'var(--text2)',
                    transition:'all .15s',
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, color:'var(--text2)', marginTop:5 }}>
              Selected: {openHours.length ? `${fmtHour(windowStart)} – ${fmtHour(windowEnd)}` : 'None'}
            </div>
          </div>

          {/* Parent select */}
          <div style={{ marginBottom:14 }}>
            <label className="fl" style={{ marginBottom:7 }}>
              Parents to notify
              <button
                onClick={() => setSelPars(students.map(s => s.id))}
                style={{ marginLeft:8, fontSize:11, color:'var(--green)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}
              >select all</button>
              <button
                onClick={() => setSelPars([])}
                style={{ marginLeft:6, fontSize:11, color:'var(--text3)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}
              >clear</button>
            </label>
            <div style={{ border:'0.5px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden' }}>
              {students.map(s => (
                <label key={s.id} style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', borderBottom:'0.5px solid var(--border)', cursor:'pointer', background: selPars.includes(s.id) ? 'var(--green-lt)' : 'var(--surface)' }}>
                  <input type="checkbox" checked={selPars.includes(s.id)} onChange={() => togglePar(s.id)} style={{ accentColor:'var(--green)' }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{s.parentName}</div>
                    <div style={{ fontSize:11, color:'var(--text2)' }}>{s.parentMobile} · {s.name}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{ marginBottom:13 }}>
            <label className="fl">Message preview</label>
            <div style={{ background:'var(--surface2)', borderRadius:'var(--radius)', padding:11, fontSize:12, color:'var(--text2)', lineHeight:1.7, whiteSpace:'pre-wrap' }}>
              {preview}
            </div>
          </div>

          <button className="btn btn-g" onClick={send} disabled={sending}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            {sending ? 'Sending…' : `Send to ${selPars.length} parent${selPars.length !== 1 ? 's' : ''}`}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="card">
            <div style={{ fontSize:13, fontWeight:500, marginBottom:12 }}>Send results</div>
            {results.map((r, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 0', borderBottom:'0.5px solid var(--border)', fontSize:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:500 }}>{r.parent} <span style={{ fontWeight:400, color:'var(--text2)' }}>· {r.student}</span></div>
                  {r.error && <div style={{ color:'var(--red)', fontSize:11 }}>{r.error}</div>}
                </div>
                <span className={r.status === 'sent' ? 'tag tg' : 'tag tr'}>
                  {r.status === 'sent' ? '✓ Sent' : '✗ Failed'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
