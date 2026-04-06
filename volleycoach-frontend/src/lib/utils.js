// src/lib/utils.js

export function fmtHour(h) {
  return (h > 12 ? h - 12 : h) + ' ' + (h >= 12 ? 'PM' : 'AM');
}

export function fmtSlot(start, end) {
  return `${fmtHour(start)} – ${fmtHour(end)}`;
}

/** Returns YYYY-MM-DD of next Saturday (or this Saturday if today is Saturday) */
export function nextSaturdayDate() {
  const d = new Date();
  const diff = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export const AVATAR_COLORS = [
  ['#9FE1CB', '#0F6E56'],
  ['#B5D4F4', '#185FA5'],
  ['#FAC775', '#854F0B'],
  ['#F4C0D1', '#993556'],
  ['#C0DD97', '#3B6D11'],
  ['#CECBF6', '#3C3489'],
];
