import React, { useEffect, useState } from 'react';
import { MessageCircle, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { formatIndianDate, formatTime, formatRelativeDate } from '../utils/helpers';

/* ─── Status badge ─────────────────────────────────────── */
function DeliveryBadge({ status }) {
  if (status === 'delivered') return (
    <span className="badge badge-completed"><CheckCircle size={11} /> Delivered</span>
  );
  if (status === 'failed') return (
    <span className="badge badge-cancelled"><XCircle size={11} /> Failed</span>
  );
  return (
    <span className="badge badge-pending"><Clock size={11} /> Pending</span>
  );
}

/* ─── Reminder type ────────────────────────────────────── */
function ReminderBadge({ type }) {
  const cls = type === '24hr'
    ? 'bg-blue-50 text-blue-700'
    : 'bg-purple-50 text-purple-700';
  return (
    <span className={`badge ${cls}`}>
      {type === '24hr' ? '24-Hour' : '1-Hour'} Reminder
    </span>
  );
}

/* ─── Main ─────────────────────────────────────────────── */
export default function Notifications({ appointments = [] }) {
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('All');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  // Dynamically generate logs from live appointments
  const logs = [];
  const now = Date.now();

  appointments.forEach(apt => {
    if (!apt.phone || apt.phone === 'N/A' || apt.status === 'cancelled') return;

    const aptTime = new Date(apt.date).getTime();
    
    // 24-Hour Reminder
    const time24h = aptTime - (24 * 60 * 60 * 1000);
    logs.push({
      id: `${apt.id}-24hr`,
      patientName: apt.name,
      phone: apt.phone,
      appointmentTime: aptTime,
      reminderType: '24hr',
      sentAt: time24h,
      deliveryStatus: time24h < now ? 'delivered' : 'pending'
    });

    // 1-Hour Reminder
    const time1h = aptTime - (60 * 60 * 1000);
    logs.push({
      id: `${apt.id}-1hr`,
      patientName: apt.name,
      phone: apt.phone,
      appointmentTime: aptTime,
      reminderType: '1hr',
      sentAt: time1h,
      deliveryStatus: time1h < now ? 'delivered' : 'pending'
    });
  });

  const filtered = logs.filter(l => {
    if (filter === 'All')       return true;
    if (filter === 'Delivered') return l.deliveryStatus === 'delivered';
    if (filter === 'Failed')    return l.deliveryStatus === 'failed';
    if (filter === '24hr')      return l.reminderType === '24hr';
    if (filter === '1hr')       return l.reminderType === '1hr';
    return true;
  }).sort((a, b) => b.sentAt - a.sentAt);

  const stats = {
    total:     logs.length,
    delivered: logs.filter(l => l.deliveryStatus === 'delivered').length,
    failed:    logs.filter(l => l.deliveryStatus === 'failed').length,
    pending:   logs.filter(l => l.deliveryStatus === 'pending').length,
  };

  const statCards = [
    { label: 'Total Sent',   value: stats.total,     color: '#1256a3', bg: '#eff6ff', icon: Send },
    { label: 'Delivered',    value: stats.delivered, color: '#059669', bg: '#ecfdf5', icon: CheckCircle },
    { label: 'Failed',       value: stats.failed,    color: '#dc2626', bg: '#fef2f2', icon: XCircle },
    { label: 'Pending',      value: stats.pending,   color: '#d97706', bg: '#fffbeb', icon: Clock },
  ];

  return (
    <div className="p-5 space-y-5">

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className="metric-icon flex-shrink-0" style={{ background: s.bg }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-gray-500 font-medium leading-tight">{s.label}</p>
              <p className="text-[22px] font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div className="card p-4">
        <div className="flex gap-2 flex-wrap">
          {['All','Delivered','Failed','24hr','1hr'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`filter-tab ${filter === f ? 'active' : ''}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Log table ── */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="skeleton w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <span className="skeleton inline-block h-3.5 w-36" />
                  <span className="skeleton inline-block h-3 w-48" />
                </div>
                <span className="skeleton inline-block h-6 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <MessageCircle size={44} className="opacity-20" />
            <p className="font-semibold text-gray-500 text-sm">No notifications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 160 }}>Patient</th>
                  <th style={{ minWidth: 120 }}>Phone</th>
                  <th style={{ minWidth: 160 }}>Appointment</th>
                  <th style={{ minWidth: 130 }}>Reminder Type</th>
                  <th style={{ minWidth: 160 }}>Sent At</th>
                  <th style={{ minWidth: 110 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => {
                  const initials = log.patientName.split(' ').map(n => n[0]).join('').slice(0, 2);
                  return (
                    <tr key={log.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="avatar" style={{ background: '#dbeafe', color: '#1e40af', width: 34, height: 34, fontSize: 12 }}>
                            {initials}
                          </div>
                          <span className="text-[13.5px] font-semibold text-gray-900">{log.patientName}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-[13px] text-gray-600">
                          <MessageCircle size={12} className="text-green-500 flex-shrink-0" />
                          {log.phone}
                        </div>
                      </td>
                      <td>
                        <div className="text-[13px] text-gray-800">{formatIndianDate(log.appointmentTime)}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{formatTime(log.appointmentTime)}</div>
                      </td>
                      <td><ReminderBadge type={log.reminderType} /></td>
                      <td>
                        <div className="text-[13px] text-gray-700">{formatRelativeDate(log.sentAt)}</div>
                      </td>
                      <td><DeliveryBadge status={log.deliveryStatus} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
