const { db } = require('./firebase');

async function getWeekendBookings(saturdayDate) {
  const snap = await db
    .collection('bookings')
    .where('weekendSat', '==', saturdayDate)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function hasConflict(saturdayDate, day, start, end) {
  const all = await getWeekendBookings(saturdayDate);
  return all
    .filter(b => b.day === day && b.status === 'confirmed')
    .some(b => start < b.end && end > b.start);
}

async function freeSlots(saturdayDate, day) {
  const all = await getWeekendBookings(saturdayDate);
  const taken = all.filter(b => b.day === day && b.status === 'confirmed');
  const free = [];
  for (let s = 12; s < 16; s++) {
    for (let e = s + 1; e <= 16; e++) {
      const ok = !taken.some(b => s < b.end && e > b.start);
      if (ok) free.push({ start: s, end: e });
    }
  }
  return free;
}

async function confirmBooking(saturdayDate, day, start, end, studentName, parentMobile) {
  const ref = await db.collection('bookings').add({
    weekendSat: saturdayDate,
    day,
    start,
    end,
    studentName,
    parentMobile,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

function fmtSlot(start, end) {
  const h = n => (n > 12 ? n - 12 : n) + ' ' + (n >= 12 ? 'PM' : 'AM');
  return `${h(start)} – ${h(end)}`;
}

module.exports = { getWeekendBookings, hasConflict, freeSlots, confirmBooking, fmtSlot };
