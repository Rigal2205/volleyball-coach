// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { fmtSlot, nextSaturdayDate } from '../lib/utils';

export default function Dashboard({ onNav }) {
  const [students, setStudents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [log,      setLog]      = useState([]);
  const sat = nextSaturdayDate();

  useEffect(() => {
    api.getStudents().then(setStudents).catch(() => {});
    api.getBookings(sat).then(setBookings).catch(() => {});
    api.getSmsLog().then(setLog).catch(() => {});
  }, [sat]);

  const confirmed = bookings.filter(b => b.status === 'confirmed');

  function renderBar(day) {
    const colors = ['#1D9E75','#185FA5','#854F0B','#993556','#3B6D11'];
    const bks = bookings.filter(b => b.day === day && b.status === 'confirmed');
    return (
      <div>
        <div style={{ display:'flex', height:26, borderRadius:6, overflow:'hidden', border:'0.5px solid var(--border)' }}>
          {[12,13,14,15].map(h => {
            const bk = bks.find(b => h >= b.start && h < b.end);
            const si = students.findIndex(s => s.name === bk?.studentName);
            return (
              <div key={h} style={{
                flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, borderRight:'0.5px solid rgba(255,255,255,.3)',
                background: bk ? (colors[si % colors.length]) : 'var(--surface2)',
                color: bk ? 'white' : 'var(--text3)',
              }}>
                {bk && h === bk.start ? bk.studentName.split(' ')[0] : (!bk ? 'Free' : '')}
              </div>
            );
          })}
        </div>
        <div style={{ display:'flex', marginTop:2 }}>
          {['12','1','2','3','4'].map(l => (
            <div key={l} style={{ flex:1, fontSize:10, color:'var(--text3)' }}>{l}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ background:'var(--surface)', borderBottom:'0.5px solid var(--border)', padding:'13px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:15, fontWeight:500 }}>Dashboard</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginTop:1 }}>Welcome back, Coach Rajan</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          {api.isMockMode() && (
            <span style={{ fontSize:11, background:'#FAEEDA', color:'#854F0B', padding:'3px 9px', borderRadius:10 }}>
              Demo mode — set VITE_API_URL for live data
            </span>
          )}
          <button className="btn" onClick={() => onNav('sms')}>Broadcast SMS</button>
          <button className="btn btn-g" onClick={() => onNav('students')}>+ Add Student</button>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:18 }}>
          {[
            { label:'Students',  val: students.length, sub:'Active roster' },
            { label:'Window',    val: '12–4 PM',        sub:'Sat & Sun' },
            { label:'Booked',    val: confirmed.length, sub:'This weekend', color:'var(--green)' },
            { label:'Inbox',     val: log.length,       sub:'Total messages' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--surface2)', borderRadius:'var(--radius)', padding:'13px 14px' }}>
              <div style={{ fontSize:11, color:'var(--text2)', marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize:21, fontWeight:500, color: s.color }}>{s.val}</div>
              <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {/* Timeline */}
          <div className="card">
            <div style={{ fontSize:13, fontWeight:500, marginBottom:13 }}>Weekend timeline</div>
            <div style={{ fontSize:11, color:'var(--text2)', marginBottom:6 }}>Saturday</div>
            {renderBar('Sat')}
            <div style={{ fontSize:11, color:'var(--text2)', margin:'12px 0 6px' }}>Sunday</div>
            {renderBar('Sun')}
          </div>

          {/* Recent log */}
          <div className="card">
            <div style={{ fontSize:13, fontWeight:500, marginBottom:13 }}>Recent parent messages</div>
            {log.slice(0, 5).map((m, i) => (
              <div key={i} style={{ fontSize:12, borderBottom:'0.5px solid var(--border)', padding:'7px 0', lineHeight:1.5 }}>
                <div style={{ fontWeight:500 }}>{m.parentName || m.from}</div>
                <div style={{ color:'var(--text2)' }}>{m.message}</div>
                {m.reply && <div style={{ color:'var(--green-dk)', marginTop:2 }}>↩ {m.reply.slice(0, 60)}…</div>}
              </div>
            ))}
            {!log.length && <div style={{ fontSize:12, color:'var(--text3)' }}>No messages yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
