// src/App.jsx
import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Students  from './pages/Students';
import SendSMS   from './pages/SendSMS';
import Inbox     from './pages/Inbox';
import Schedule  from './pages/Schedule';
import './index.css';

const PAGES = [
  { id: 'dashboard', label: 'Dashboard',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { id: 'students',  label: 'Students',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: 'sms',       label: 'Send SMS',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { id: 'inbox',     label: 'Inbox',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg> },
  { id: 'schedule',  label: 'Schedule',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
];

export default function App() {
  const [page, setPage]  = useState('dashboard');
  const [badge, setBadge] = useState(0);

  const PAGE_MAP = { dashboard: Dashboard, students: Students, sms: SendSMS, inbox: Inbox, schedule: Schedule };
  const Current = PAGE_MAP[page] || Dashboard;

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width:210, minWidth:210, background:'var(--surface)', borderRight:'0.5px solid var(--border)', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'18px 14px 14px', borderBottom:'0.5px solid var(--border)', display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:30, height:30, background:'var(--green)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width:16, height:16 }}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10A15 15 0 0 1 8 12 15 15 0 0 1 12 2z"/>
              <path d="M2 12h20"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:500 }}>VolleyCoach</div>
            <div style={{ fontSize:11, color:'var(--text2)' }}>Coach Portal</div>
          </div>
        </div>

        <nav style={{ padding:8, flex:1 }}>
          {PAGES.map(p => (
            <div
              key={p.id}
              onClick={() => setPage(p.id)}
              style={{
                display:'flex', alignItems:'center', gap:9,
                padding:'8px 10px', borderRadius:'var(--radius)',
                cursor:'pointer', fontSize:13, marginBottom:2,
                background: page===p.id ? 'var(--green-lt)' : 'transparent',
                color: page===p.id ? 'var(--green-dk)' : 'var(--text2)',
                fontWeight: page===p.id ? 500 : 400,
                transition:'all .15s',
              }}
            >
              <span style={{ width:15, height:15, display:'flex' }}>{p.icon}</span>
              {p.label}
              {p.id==='inbox' && badge>0 && (
                <span style={{ marginLeft:'auto', background:'var(--amber)', color:'white', fontSize:10, padding:'1px 6px', borderRadius:10 }}>
                  {badge}
                </span>
              )}
            </div>
          ))}
        </nav>

        <div style={{ padding:'12px 14px', borderTop:'0.5px solid var(--border)', display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:11, fontWeight:500 }}>RC</div>
          <div>
            <div style={{ fontSize:13, fontWeight:500 }}>Rajan Coach</div>
            <div style={{ fontSize:11, color:'var(--text2)' }}>Head Coach</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <Current onBadge={setBadge} onNav={setPage} />
      </main>
    </div>
  );
}
