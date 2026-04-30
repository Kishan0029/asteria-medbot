import { format, isToday, isYesterday, isTomorrow } from 'date-fns';

/* ─── Indian date: 29th April 2026 ──────────────────────── */
export function formatIndianDate(date) {
  if (!date) return '';
  const d   = new Date(date);
  const day = d.getDate();
  const suffix = ['th','st','nd','rd'][
    day % 10 > 3 || Math.floor((day % 100) / 10) === 1 ? 0 : day % 10
  ];
  return `${day}${suffix} ${format(d, 'MMMM yyyy')}`;
}

/* ─── 12-hour time ──────────────────────────────────────── */
export function formatTime(date) {
  if (!date) return '';
  return format(new Date(date), 'h:mm a');
}

/* ─── Relative date + time ──────────────────────────────── */
export function formatRelativeDate(date) {
  const d = new Date(date);
  if (isToday(d))     return `Today, ${formatTime(d)}`;
  if (isTomorrow(d))  return `Tomorrow, ${formatTime(d)}`;
  if (isYesterday(d)) return `Yesterday, ${formatTime(d)}`;
  return `${formatIndianDate(d)}, ${formatTime(d)}`;
}

/* ─── Status label ──────────────────────────────────────── */
export function getStatusLabel(status) {
  if (!status) return '';
  if (status === 'no-show') return 'No-Show';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/* ─── CSS class for status badge ───────────────────────── */
export function getStatusClass(status) {
  switch (status) {
    case 'confirmed':  return 'badge-confirmed';
    case 'completed':  return 'badge-completed';
    case 'pending':    return 'badge-pending';
    case 'cancelled':  return 'badge-cancelled';
    case 'no-show':    return 'badge-no-show';
    default:           return 'badge-pending';
  }
}

/* ─── INR currency ──────────────────────────────────────── */
export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
}

// === AVATAR COLORS ===
const AVATAR_COLORS = [
  ['#dbeafe', '#1e40af'], ['#d1fae5', '#065f46'], ['#fef3c7', '#92400e'],
  ['#ede9fe', '#5b21b6'], ['#fce7f3', '#9d174d'], ['#e0f2fe', '#0369a1'],
  ['#dcfce7', '#14532d'], ['#fff7ed', '#9a3412'],
];
export function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}
