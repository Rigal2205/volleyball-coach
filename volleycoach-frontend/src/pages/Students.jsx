// src/pages/Students.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { initials, AVATAR_COLORS } from '../lib/utils';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({ name:'', age:'', parentName:'', parentMobile:'' });
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');

  async function load() {
    try { setStudents(await api.getStudents()); } catch(e) { console.warn('Students load:', e.message); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.name || !form.parentName || !form.parentMobile) {
      setErr('Student name, parent name and mobile are required.'); return;
    }
    setSaving(true); setErr('');
    try {
      await api.addStudent(form);
      setModal(false);
      setForm({ name:'', age:'', parentName:'', parentMobile:'' });
      load();
    } catch(e) { setErr(e.message); }
    setSaving(false);
  }

  async function del(id) {
    if (!confirm('Remove this student?')) return;
    await api.deleteStudent(id);
    load();
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ background:'var(--surface)', borderBottom:'0.5px solid var(--border)', padding:'13px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:15, fontWeight:500 }}>Students</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginTop:1 }}>{students.length} students on roster</div>
        </div>
        <button className="btn btn-g" onClick={() => setModal(true)}>+ Add Student</button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:11 }}>
          {students.map((s, i) => {
            const [bg, tc] = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <div key={s.id} style={{ background:'var(--surface2)', borderRadius:'var(--radius-lg)', padding:13, border:'0.5px solid var(--border)', position:'relative' }}>
                <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:9 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:bg, color:tc, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:500 }}>
                    {initials(s.name)}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{s.name}</div>
                    <div style={{ fontSize:11, color:'var(--text2)' }}>Age {s.age || '—'}</div>
                  </div>
                  <button
                    onClick={() => del(s.id)}
                    style={{ marginLeft:'auto', background:'none', border:'none', color:'var(--text3)', fontSize:16, cursor:'pointer', lineHeight:1 }}
                    title="Remove"
                  >×</button>
                </div>
                <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.8 }}>
                  <div style={{ display:'flex', gap:5 }}><span style={{ color:'var(--text3)', minWidth:46 }}>Parent</span><span>{s.parentName}</span></div>
                  <div style={{ display:'flex', gap:5 }}><span style={{ color:'var(--text3)', minWidth:46 }}>Mobile</span><span>{s.parentMobile}</span></div>
                </div>
              </div>
            );
          })}
        </div>
        {!students.length && (
          <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text3)' }}>
            No students yet. Add your first student!
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }} onClick={e => e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:'var(--surface)', borderRadius:'var(--radius-lg)', padding:20, width:400, maxWidth:'93vw' }}>
            <div style={{ fontSize:14, fontWeight:500, marginBottom:14 }}>Add New Student</div>
            {err && <div style={{ background:'var(--red-lt)', color:'var(--red)', padding:'8px 10px', borderRadius:'var(--radius)', fontSize:12, marginBottom:10 }}>{err}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="fg">
                <label className="fl">Student name *</label>
                <input className="fi" value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Full name" />
              </div>
              <div className="fg">
                <label className="fl">Age</label>
                <input className="fi" type="number" value={form.age} onChange={e => setForm({...form, age:e.target.value})} placeholder="14" min="5" max="25" />
              </div>
            </div>
            <div className="fg">
              <label className="fl">Parent name *</label>
              <input className="fi" value={form.parentName} onChange={e => setForm({...form, parentName:e.target.value})} placeholder="Parent full name" />
            </div>
            <div className="fg">
              <label className="fl">Parent mobile number *</label>
              <input className="fi" value={form.parentMobile} onChange={e => setForm({...form, parentMobile:e.target.value})} placeholder="+91 98765 43210" />
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:14 }}>
              <button className="btn" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-g" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Student'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
