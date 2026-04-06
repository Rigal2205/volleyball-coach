require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const { db } = require('./lib/firebase');
const { handleParentSMS } = require('./lib/ai');
const { getWeekendBookings, confirmBooking, freeSlots, fmtSlot } = require('./lib/bookings');

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'DELETE'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Health check ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'VolleyCoach backend is running!' });
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// ── STUDENTS ──────────────────────────────────────────────

app.get('/api/students', async (req, res) => {
  try {
    const snap = await db.collection('students').orderBy('name').get();
    const students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(students);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, age, parentName, parentMobile } = req.body;
    if (!name || !parentName || !parentMobile)
      return res.status(400).json({ error: 'name, parentName and parentMobile are required' });

    let mobile = parentMobile.replace(/\s+/g, '');
    if (!mobile.startsWith('+')) mobile = '+91' + mobile.replace(/^0/, '');

    const ref = await db.collection('students').add({
      name,
      age: age || null,
      parentName,
      parentMobile: mobile,
      createdAt: new Date().toISOString(),
    });
    res.json({ id: ref.id, name, age, parentName, parentMobile: mobile });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await db.collection('students').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── BOOKINGS ──────────────────────────────────────────────

app.get('/api/bookings', async (req, res) => {
  try {
    const { weekendSat } = req.query;
    if (!weekendSat) return res.status(400).json({ error: 'weekendSat required' });
    const bookings = await getWeekendBookings(weekendSat);
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { weekendSat, day, start, end, studentName, parentMobile } = req.body;
    const id = await confirmBooking(weekendSat, day, start, end, studentName, parentMobile);
    res.json({ id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    await db.collection('bookings').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SMS BROADCAST ─────────────────────────────────────────

app.post('/api/sms/broadcast', async (req, res) => {
  try {
    const { weekendSat, windowStart = 12, windowEnd = 16, studentIds } = req.body;

    const snap = await db.collection('students').get();
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const targets = studentIds ? all.filter(s => studentIds.includes(s.id)) : all;

    if (!targets.length) return res.status(400).json({ error: 'No students found' });

    const satDate = new Date(weekendSat);
    const sunDate = new Date(weekendSat);
    sunDate.setDate(satDate.getDate() + 1);

    const fmt = d => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
    const fh = h => (h > 12 ? h - 12 : h) + ' ' + (h >= 12 ? 'PM' : 'AM');

    const msg =
      `Hi! Coach Rajan here 🏐\n` +
      `Free training slots this weekend:\n` +
      `📅 ${fmt(satDate)} (Sat)\n` +
      `📅 ${fmt(sunDate)} (Sun)\n\n` +
      `Window: ${fh(windowStart)} – ${fh(windowEnd)}\n\n` +
      `Reply with your preferred time e.g. "Saturday 12 to 2pm" and our AI will confirm instantly!`;

    const twilioReady = process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_ACCOUNT_SID !== 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

    const results = [];

    if (twilioReady) {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      for (const s of targets) {
        try {
          const m = await client.messages.create({
            body: msg,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `whatsapp:${s.parentMobile}`,  // ✅ WhatsApp prefix added
          });
          results.push({ student: s.name, parent: s.parentName, sid: m.sid, status: 'sent' });
        } catch (err) {
          results.push({ student: s.name, parent: s.parentName, error: err.message, status: 'failed' });
        }
      }
    } else {
      for (const s of targets) {
        results.push({ student: s.name, parent: s.parentName, status: 'demo (Twilio not configured)', sid: 'DEMO' });
      }
    }

    await db.collection('broadcasts').add({
      weekendSat, windowStart, windowEnd,
      sentTo: results,
      createdAt: new Date().toISOString(),
    });

    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── TWILIO WEBHOOK (incoming WhatsApp from parents) ───────

app.post('/webhook/sms', async (req, res) => {
  const { From, Body } = req.body;

  // ✅ Remove whatsapp: prefix before looking up in Firebase
  const cleanFrom = From.replace('whatsapp:', '');

  console.log(`📱 WhatsApp from ${cleanFrom}: "${Body}"`);

  try {
    const reply = await handleParentSMS(cleanFrom, Body);

    // ✅ Save clean number to smsLog
    await db.collection('smsLog').add({
      from: cleanFrom,
      message: Body,
      reply,
      createdAt: new Date().toISOString(),
    });

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(reply);
    res.type('text/xml').send(twiml.toString());
  } catch (e) {
    console.error('Webhook error:', e);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Sorry, something went wrong. Please contact Coach Rajan directly.');
    res.type('text/xml').send(twiml.toString());
  }
});

// ── SMS LOG ───────────────────────────────────────────────

app.get('/api/sms/log', async (req, res) => {
  try {
    const snap = await db.collection('smsLog').orderBy('createdAt', 'desc').limit(50).get();
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── START ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ VolleyCoach backend running on http://localhost:${PORT}`);
});