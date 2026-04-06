// src/lib/api.js
// Set VITE_API_URL in .env to point to your backend.
// If not set, all calls fall back to mock data so the UI renders without a backend.

const BASE = import.meta.env.VITE_API_URL || null;

const MOCK_STUDENTS = [
  { id: '1', name: 'Priya Sharma',  age: 15, parentName: 'Sunita Sharma', parentMobile: '+91 98001 11111' },
  { id: '2', name: 'Arjun Patel',   age: 14, parentName: 'Ramesh Patel',  parentMobile: '+91 98002 22222' },
  { id: '3', name: 'Meera Nair',    age: 16, parentName: 'Anita Nair',    parentMobile: '+91 98003 33333' },
  { id: '4', name: 'Kavya Reddy',   age: 15, parentName: 'Suresh Reddy',  parentMobile: '+91 98004 44444' },
  { id: '5', name: 'Rohit Singh',   age: 13, parentName: 'Nisha Singh',   parentMobile: '+91 98005 55555' },
];

const TODAY_SAT = (() => {
  const d = new Date(); const diff = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff); return d.toISOString().split('T')[0];
})();

const MOCK_BOOKINGS = [
  { id: 'b1', weekendSat: TODAY_SAT, day: 'Sat', start: 12, end: 13, studentName: 'Priya Sharma',  parentMobile: '+91 98001 11111', status: 'confirmed' },
  { id: 'b2', weekendSat: TODAY_SAT, day: 'Sat', start: 14, end: 15, studentName: 'Rohit Singh',   parentMobile: '+91 98005 55555', status: 'confirmed' },
  { id: 'b3', weekendSat: TODAY_SAT, day: 'Sun', start: 14, end: 16, studentName: 'Meera Nair',    parentMobile: '+91 98003 33333', status: 'confirmed' },
  { id: 'b4', weekendSat: TODAY_SAT, day: 'Sun', start: 12, end: 13, studentName: 'Arjun Patel',   parentMobile: '+91 98002 22222', status: 'pending'   },
  { id: 'b5', weekendSat: TODAY_SAT, day: 'Sat', start: 15, end: 16, studentName: 'Kavya Reddy',   parentMobile: '+91 98004 44444', status: 'pending'   },
];

const MOCK_LOG = [
  { id: 'l1', from: '+91 98001 11111', parentName: 'Sunita Sharma', studentName: 'Priya Sharma', message: 'Hi coach, can I book 12 to 1 on Saturday for Priya?', reply: 'Hi Sunita! Saturday 12 PM – 1 PM is confirmed for Priya. See you then 🏐', createdAt: new Date(Date.now()-7200000).toISOString(), slot: { day:'Sat', start:12, end:13 } },
  { id: 'l2', from: '+91 98002 22222', parentName: 'Ramesh Patel',  studentName: 'Arjun Patel',  message: 'I want Sunday 12 to 1 for Arjun', reply: 'Hi Ramesh! Sunday 12 PM – 1 PM is confirmed for Arjun. 🏐', createdAt: new Date(Date.now()-3600000).toISOString(), slot: { day:'Sun', start:12, end:13 } },
  { id: 'l3', from: '+91 98003 33333', parentName: 'Anita Nair',    studentName: 'Meera Nair',   message: 'Book Sunday 2 to 4pm for Meera', reply: 'Sunday 2 PM – 4 PM is confirmed for Meera! 🏐', createdAt: new Date(Date.now()-1800000).toISOString(), slot: { day:'Sun', start:14, end:16 } },
];

// In-memory state for mock mode
const mock = {
  students: [...MOCK_STUDENTS],
  bookings: [...MOCK_BOOKINGS],
  smsLog:   [...MOCK_LOG],
  nextId: 200,
};

function isMock() { return !BASE; }

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  isMockMode: isMock,

  getStudents: async () => {
    if (isMock()) return [...mock.students];
    return req('GET', '/students');
  },

  addStudent: async (data) => {
    if (isMock()) {
      const s = { id: String(mock.nextId++), ...data };
      mock.students.push(s);
      return s;
    }
    return req('POST', '/students', data);
  },

  deleteStudent: async (id) => {
    if (isMock()) { mock.students = mock.students.filter(s => s.id !== id); return { ok: true }; }
    return req('DELETE', `/students/${id}`);
  },

  getBookings: async (weekendSat) => {
    if (isMock()) return [...mock.bookings];
    return req('GET', `/bookings?weekendSat=${weekendSat}`);
  },

  addBooking: async (data) => {
    if (isMock()) { const b = { id: String(mock.nextId++), ...data }; mock.bookings.push(b); return b; }
    return req('POST', '/bookings', data);
  },

  deleteBooking: async (id) => {
    if (isMock()) { mock.bookings = mock.bookings.filter(b => b.id !== id); return { ok: true }; }
    return req('DELETE', `/bookings/${id}`);
  },

  broadcast: async (data) => {
    if (isMock()) {
      const results = mock.students
        .filter(s => !data.studentIds || data.studentIds.includes(s.id))
        .map(s => ({ student: s.name, parent: s.parentName, status: 'sent (demo)', sid: 'MOCK_SID' }));
      return { results };
    }
    return req('POST', '/sms/broadcast', data);
  },

  getSmsLog: async () => {
    if (isMock()) return [...mock.smsLog];
    return req('GET', '/sms/log');
  },
};
