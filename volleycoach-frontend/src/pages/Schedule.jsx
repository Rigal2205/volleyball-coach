// src/pages/Schedule.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { nextSaturdayDate, fmtSlot } from '../lib/utils';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const SLOT_COLORS = ['#1D9E75','#185FA5','#854F0B','#993556','#3B6D11','#3C3489'];

export default function Schedule() {
  const [bookings,  setBookings]  = useState([]);
  const [calOff,    setCalOff]    = useState(0);
  const [satDate,   setSatDate]   = useState(nextSaturdayDate());

  useEffect(() => {
    api.getBookings(satDate).then(setBookings).catch(e => console.warn('Bookings load:', e.message));
  }, [satDate]);

  // Build the calendar start (Sunday of the week containing satDate)
  const base = new Date(satDate);
  base.setDate(base.getDate() + calOff * 7);
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());

  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const pending   = bookings.filter(b => b.status !== 'confirmed');

  // Unique students for colour mapping
  const studentNames = [...new Set(bookings.map(b => b.studentName))];

  function colorFor(name) {
    return SLOT_COLORS[studentNames.indexOf(name) % SLOT_COLORS.length];
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ background:'var(--surface)', borderBottom:'0.5px solid var(--border)', padding:'13px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:15, fontWeight:500 }}>Schedule</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginTop:1 }}>Weekend booking calendar</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <label style={{ fontSize:12, color:'var(--text2)' }}>Weekend:</label>
          <input type="date" className="fi" value={satDate} onChange={e => setSatDate(e.target.value)} style={{ width:160 }} />
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
        {/* Calendar */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <button className="btn" onClick={() => setCalOff(c => c - 1)}>←</button>
              <div style={{ fontSize:13, fontWeight:500, minWidth:110, textAlign:'center' }}>{MONTHS[start.getMonth()]} {start.getFullYear()}</div>
              <button className="btn" onClick={() => setCalOff(c => c + 1)}>→</button>
            </div>
            <div style={{ display:'flex', gap:12 }}>
              {[['#1D9E75','Booked'],['#EF9F27','Pending'],['var(--green-lt)','Weekend']].map(([c,l]) => (
                <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text2)' }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', background:c, border: l==='Weekend'?'1px solid var(--green-mid)':'' }}></div>{l}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
            {DAYS.map(d => <div key={d} style={{ textAlign:'center', fontSize:11, color:'var(--text2)', padding:3, fontWeight:500 }}>{d}</div>)}
            {Array.from({ length: 28 }, (_, i) => {
              const d = new Date(start); d.setDate(start.getDate() + i);
              const isSat = d.getDay() === 6, isSun = d.getDay() === 0;
              const isWE  = isSat || isSun;
              const dayKey = isSat ? 'Sat' : isSun ? 'Sun' : null;
              const dayBks = isWE ? bookings.filter(b => b.day === dayKey) : [];

              return (
                <div key={i} style={{
                  minHeight:70, borderRadius:'var(--radius)', padding:5, fontSize:11,
                  background: isWE ? 'var(--green-lt)' : 'var(--surface2)',
                  border: isWE ? '0.5px solid var(--green-mid)' : '0.5px solid transparent',
                }}>
                  <div style={{ fontSize:11, fontWeight:500, color: isWE ? 'var(--green-dk)' : 'var(--text2)', marginBottom:3 }}>{d.getDate()}</div>
                  {dayBks.map((b, bi) => (
                    <div key={bi} style={{
                      fontSize:9, padding:'2px 4px', borderRadius:3, marginBottom:2,
                      background: b.status === 'confirmed' ? colorFor(b.studentName) : '#EF9F27',
                      color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    }}>
                      {b.start % 12 || 12}-{b.end % 12 || 12} {b.studentName?.split(' ')[0]}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail table */}
        <div className="card">
          <div style={{ fontSize:13, fontWeight:500, marginBottom:13 }}>Booking details — this weekend</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {['Sat','Sun'].map(day => (
              <div key={day}>
                <div style={{ fontSize:12, fontWeight:500, color:'var(--text2)', marginBottom:8 }}>{day === 'Sat' ? 'Saturday' : 'Sunday'}</div>
                {bookings.filter(b => b.day === day).sort((a,b) => a.start - b.start).map((b, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 9px', borderRadius:'var(--radius)', background: b.status==='confirmed' ? 'var(--green-lt)' : 'var(--amber-lt)', marginBottom:5 }}>
                    <div style={{ width:3, height:34, background: b.status==='confirmed' ? colorFor(b.studentName) : '#EF9F27', borderRadius:2 }}></div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:500, color: b.status==='confirmed' ? 'var(--green-dk)' : '#854F0B' }}>{fmtSlot(b.start, b.end)}</div>
                      <div style={{ fontSize:11, color:'var(--text2)' }}>{b.studentName}</div>
                    </div>
                    <span className={`tag ${b.status === 'confirmed' ? 'tg' : 'ta'}`}>{b.status === 'confirmed' ? 'Confirmed' : 'Pending'}</span>
                  </div>
                ))}
                {!bookings.filter(b => b.day === day).length && (
                  <div style={{ fontSize:12, color:'var(--text3)', padding:'8px 0' }}>No bookings yet</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
