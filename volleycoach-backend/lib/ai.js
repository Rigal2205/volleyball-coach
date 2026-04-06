const { hasConflict, freeSlots, confirmBooking, fmtSlot, getWeekendBookings } = require('./bookings');
const { db } = require('./firebase');

function nextSaturday() {
  const d = new Date();
  const diff = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function parseHour(str) {
  if (!str) return null;
  str = str.trim().toLowerCase();
  const pm = str.includes('pm');
  const am = str.includes('am');
  const num = parseInt(str.replace(/[^0-9]/g, ''));
  if (isNaN(num)) return null;
  if (pm && num !== 12) return num + 12;
  if (am && num === 12) return 0;
  if (num >= 1 && num <= 4 && !am) return num + 12;
  return num;
}

function parseMessage(text) {
  const t = text.toLowerCase();

  // Detect cancel/delete intent
  const cancelIntent = /\b(cancel|delete|remove|drop|no longer|cant come|can't come|won't come|not coming)\b/.test(t);

  // Detect day
  let day = null;
  if (/\bsat(urday)?\b/.test(t)) day = 'Sat';
  else if (/\bsun(day)?\b/.test(t)) day = 'Sun';

  // Detect time range
  const timeRegex = /(\d{1,2}\s*(?:am|pm)?)\s*(?:to|-)\s*(\d{1,2}\s*(?:am|pm)?)/i;
  const match = t.match(timeRegex);
  let start = null, end = null;
  if (match) {
    start = parseHour(match[1]);
    end = parseHour(match[2]);
    if (!start || !end || start < 12 || end > 16 || start >= end) {
      start = null; end = null;
    }
  }

  // Query intent
  if (!cancelIntent && !match && /\b(free|available|open|slots|times|what|when|schedule)\b/.test(t)) {
    return { intent: 'query', day };
  }

  if (cancelIntent) return { intent: 'cancel', day, start, end };
  if (start && end) return { intent: 'book', day, start, end };
  return { intent: 'other' };
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function handleParentSMS(fromNumber, body) {
  // 1. Find student
  const stuSnap = await db
    .collection('students')
    .where('parentMobile', '==', fromNumber)
    .limit(1)
    .get();

  if (stuSnap.empty) {
    return "Hi! I don't have your number saved. Please call me directly.";
  }

  const student = stuSnap.docs[0].data();
  const firstName = student.name.split(' ')[0];
  const saturdayDate = nextSaturday();
  const parsed = parseMessage(body);

  // ── BOOK ─────────────────────────────────────────────────
  if (parsed.intent === 'book' && parsed.day && parsed.start && parsed.end) {
    const { day, start, end } = parsed;
    const dayFull = day === 'Sat' ? 'Saturday' : 'Sunday';
    const slot = fmtSlot(start, end);

    // Check if this parent already has a booking this weekend
    const allBookings = await getWeekendBookings(saturdayDate);
    const existing = allBookings.find(
      b => b.parentMobile === fromNumber && b.status === 'confirmed'
    );

    if (existing) {
      const existingSlot = `${existing.day === 'Sat' ? 'Saturday' : 'Sunday'} ${fmtSlot(existing.start, existing.end)}`;

      // Same slot booked again
      if (existing.day === day && existing.start === start && existing.end === end) {
        return pick([
          `Hey, you're already booked for ${existingSlot}! See you then 👍`,
          `${firstName} is already on for ${existingSlot}, no need to book again!`,
          `That's already confirmed! ${existingSlot} is yours 👍`,
        ]);
      }

      // Different slot — already has one booking
      return pick([
        `You already have ${existingSlot} booked. Want to cancel that and take ${dayFull} ${slot} instead?`,
        `${firstName} is already booked for ${existingSlot}. Should I move it to ${dayFull} ${slot}?`,
        `You're already in for ${existingSlot}. Want to switch to ${dayFull} ${slot}?`,
      ]);
    }

    // Check conflict with others
    const conflict = await hasConflict(saturdayDate, day, start, end);
    if (conflict) {
      const free = await freeSlots(saturdayDate, day);
      const options = free.slice(0, 3).map(s => fmtSlot(s.start, s.end)).join(', ');
      return pick([
        `Sorry that slot's gone on ${dayFull}. I still have ${options || 'nothing left'}. Any of these work?`,
        `${dayFull} ${slot} is taken already. Free: ${options || 'nothing'}. Want any of those?`,
        `That one's full! On ${dayFull} I have ${options || 'no slots left'}. Let me know!`,
      ]);
    }

    // Confirm booking
    await confirmBooking(saturdayDate, day, start, end, firstName, fromNumber);
    return pick([
      `Done! ${firstName} is in for ${dayFull} ${slot} 👍`,
      `Ok confirmed! ${dayFull} ${slot} is blocked for ${firstName} ✓`,
      `Perfect, see ${firstName} on ${dayFull} at ${slot}. Don't be late! 😄`,
      `Noted! ${dayFull} ${slot} for ${firstName} ✓`,
    ]);
  }

  // ── CANCEL ───────────────────────────────────────────────
  if (parsed.intent === 'cancel') {
    const allBookings = await getWeekendBookings(saturdayDate);

    // Find this parent's booking
    let booking = null;
    if (parsed.day && parsed.start && parsed.end) {
      // They specified which slot to cancel
      booking = allBookings.find(
        b => b.parentMobile === fromNumber &&
             b.day === parsed.day &&
             b.start === parsed.start &&
             b.end === parsed.end &&
             b.status === 'confirmed'
      );
    } else {
      // No slot specified — cancel their only booking
      booking = allBookings.find(
        b => b.parentMobile === fromNumber && b.status === 'confirmed'
      );
    }

    if (!booking) {
      return pick([
        `Hey, I don't see any booking for ${firstName} this weekend. Nothing to cancel!`,
        `${firstName} doesn't have anything booked this weekend.`,
        `No booking found for ${firstName}. All clear!`,
      ]);
    }

    // Already cancelled
    if (booking.status === 'cancelled') {
      const slot = `${booking.day === 'Sat' ? 'Saturday' : 'Sunday'} ${fmtSlot(booking.start, booking.end)}`;
      return pick([
        `That booking was already cancelled. No worries!`,
        `${firstName}'s slot on ${slot} is already cancelled.`,
      ]);
    }

    // Cancel it
    await db.collection('bookings').doc(booking.id).update({ status: 'cancelled' });
    const slot = `${booking.day === 'Sat' ? 'Saturday' : 'Sunday'} ${fmtSlot(booking.start, booking.end)}`;
    return pick([
      `Ok, cancelled ${firstName}'s slot on ${slot}. No problem, see you next time!`,
      `Done, removed ${slot} for ${firstName}. Take care!`,
      `Cancelled! ${slot} is free now. Let me know if you want to rebook anytime 👍`,
    ]);
  }

  // ── QUERY ────────────────────────────────────────────────
  if (parsed.intent === 'query') {
    const satFree = await freeSlots(saturdayDate, 'Sat');
    const sunFree = await freeSlots(saturdayDate, 'Sun');
    const satOpts = satFree.slice(0, 3).map(s => fmtSlot(s.start, s.end)).join(', ') || 'all taken';
    const sunOpts = sunFree.slice(0, 3).map(s => fmtSlot(s.start, s.end)).join(', ') || 'all taken';

    // Check if they already have a booking
    const allBookings = await getWeekendBookings(saturdayDate);
    const existing = allBookings.find(b => b.parentMobile === fromNumber && b.status === 'confirmed');
    if (existing) {
      const existingSlot = `${existing.day === 'Sat' ? 'Saturday' : 'Sunday'} ${fmtSlot(existing.start, existing.end)}`;
      return `You're already booked for ${existingSlot}! If you want to change just let me know 👍`;
    }

    if (parsed.day === 'Sat') return `Saturday I have ${satOpts} free. Which works for you?`;
    if (parsed.day === 'Sun') return `Sunday I have ${sunOpts} free. Which works for you?`;
    return `This weekend:\nSat: ${satOpts}\nSun: ${sunOpts}\n\nWhich works?`;
  }

  // ── FALLBACK ─────────────────────────────────────────────
  return pick([
    `Hey! Let me know which day and time works for ${firstName}. Sat or Sun, 12-4pm 👍`,
    `Hi! When do you want to come? Saturday or Sunday? I'm free 12 to 4`,
    `Hey, just tell me day and time and I'll block it for ${firstName}!`,
  ]);
}

module.exports = { handleParentSMS };