import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Calendar, CalendarDays, MessageCircle, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { formatTime, formatIndianDate, getStatusClass, getStatusLabel, getAvatarColor, getInitials } from '../utils/helpers';
import AppointmentTable from '../components/AppointmentTable';
import PatientModal from '../components/PatientModal';
import toast from 'react-hot-toast';

import { api } from '../services/api';

const TABS = ['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled'];

/* ─── Metric Card ─────────────────────────────────────── */
function MetricCard({ label, value, icon: Icon, iconColor, iconBg, trend, loading }) {
  if (loading) {
    return (
      <div className="card p-5">
        <span className="skeleton inline-block h-3 w-28 mb-3" />
        <span className="skeleton inline-block h-9 w-16 mb-2" />
        <span className="skeleton inline-block h-3 w-24" />
      </div>
    );
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-[13px] font-semibold text-gray-500 leading-tight">{label}</p>
        <div className="metric-icon flex-shrink-0" style={{ background: iconBg }}>
          <Icon size={19} style={{ color: iconColor }} />
        </div>
      </div>
      <div className="text-[32px] font-bold leading-none text-gray-900 mb-2">{value}</div>
      {trend && (
        <div className="flex items-center gap-1 text-[12px] text-emerald-600 font-semibold">
          <TrendingUp size={12} />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Chart tooltip ───────────────────────────────────── */
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-3 py-2 text-[13px]">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="font-bold text-[#1256a3]">{payload[0].value} appts</p>
    </div>
  );
};

/* ─── Main ────────────────────────────────────────────── */
export default function Dashboard({ appointments, setAppointments, loadingAppts }) {
  const [activeTab,       setActiveTab]       = useState('All');
  const [search,          setSearch]          = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const NOW = new Date();

  /* Table rows — today + next 7 days */
  const weekEnd = new Date(NOW);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const todayStart = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());

  const filtered = appointments.filter(a => {
    const d = new Date(a.date);
    if (d < todayStart || d > weekEnd) return false;
    if (activeTab !== 'All' && a.status !== activeTab.toLowerCase()) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.phone.includes(search)) return false;
    return true;
  }).slice(0, 15);

  /* Today's schedule */
  const todaySchedule = appointments
    .filter(a => {
      const d = new Date(a.date);
      return d >= todayStart && d < new Date(todayStart.getTime() + 86400000);
    })
    .sort((a, b) => a.date - b.date)
    .slice(0, 7);

  async function handleCancel(apt) {
    const toastId = toast.loading('Cancelling appointment...');
    try {
      await api.cancelAppointment(apt.id, apt);
      setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: 'cancelled' } : a));
      toast.success(`Appointment for ${apt.name} cancelled.`, { id: toastId });
      setSelectedPatient(null);
    } catch (err) {
      toast.error('Failed to cancel appointment', { id: toastId });
    }
  }

  async function handleReschedule(apt, date, time) {
    const toastId = toast.loading('Rescheduling...');
    try {
      await api.rescheduleAppointment(apt.id, date, time, apt);
      setAppointments(prev => prev.map(a => {
        if (a.id !== apt.id) return a;
        return { ...a, date: new Date(`${date}T${time}:00`).getTime(), status: 'confirmed' };
      }));
      toast.success('Appointment rescheduled!', { id: toastId });
      setSelectedPatient(null);
    } catch (err) {
      toast.error('Failed to reschedule appointment', { id: toastId });
    }
  }

  const todayCount = appointments.filter(a => {
    const d = new Date(a.date);
    return d >= todayStart && d < new Date(todayStart.getTime() + 86400000);
  }).length;

  const thisWeekCount = appointments.filter(a => {
    const d = new Date(a.date);
    return d >= todayStart && d <= weekEnd;
  }).length;

  const thisMonthCount = appointments.filter(a => {
    const d = new Date(a.date);
    return d >= todayStart && d <= new Date(todayStart.getTime() + 30 * 86400000);
  }).length;

  const upcomingCount = appointments.filter(a => new Date(a.date) > NOW).length;

  const metrics = [
    { label: "Today's Appointments", value: todayCount,    icon: Calendar,     iconColor: '#1256a3', iconBg: '#eff6ff', trend: '' },
    { label: 'This Week',             value: thisWeekCount, icon: CalendarDays, iconColor: '#0891b2', iconBg: '#ecfeff', trend: '' },
    { label: 'This Month',            value: thisMonthCount,icon: Users,        iconColor: '#059669', iconBg: '#ecfdf5', trend: '' },
    { label: 'Upcoming',              value: upcomingCount, icon: MessageCircle,iconColor: '#7c3aed', iconBg: '#f5f3ff', trend: '' },
  ];

  // Dynamically calculate Service Popularity
  const serviceCounts = {};
  appointments.forEach(a => {
    if (a.service) serviceCounts[a.service] = (serviceCounts[a.service] || 0) + 1;
  });
  const totalServices = Object.values(serviceCounts).reduce((a, b) => a + b, 0);
  const colors = ['#1256a3', '#0891b2', '#059669', '#7c3aed', '#ea580c'];
  const servicePopularity = Object.entries(serviceCounts)
    .map(([name, count], index) => ({
      name,
      value: totalServices ? Math.round((count / totalServices) * 100) : 0,
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.value - a.value);

  // Dynamically calculate Busiest Days
  const dayCounts = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
  appointments.forEach(a => {
    const d = new Date(a.date);
    if (d > NOW && d <= weekEnd) {
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      if (dayCounts[dayStr] !== undefined) dayCounts[dayStr]++;
    }
  });
  const busiestDays = Object.entries(dayCounts).map(([day, count]) => ({ day, count }));

  return (
    <div className="p-5 space-y-5">

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <MetricCard key={m.label} {...m} loading={loadingAppts} />
        ))}
      </div>

      {/* ── Main Body: Table + Right Panel ── */}
      <div className="flex gap-5 items-start">

        {/* ── LEFT: Table ── (flex-1 with min-w-0 prevents overflow) */}
        <div className="flex-1 min-w-0 card overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                type="text"
                placeholder="Search patient or phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field sm:max-w-[220px]"
              />
              <div className="flex gap-1.5 flex-wrap">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`filter-tab ${activeTab === tab ? 'active' : ''}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AppointmentTable
            appointments={filtered}
            loading={loadingAppts}
            onViewPatient={setSelectedPatient}
            onCancel={handleCancel}
          />
        </div>

        {/* ── RIGHT: Sidebar panels — fixed 280px, never overlaps ── */}
        <div
          className="hidden xl:flex flex-col gap-4"
          style={{ width: 280, flexShrink: 0 }}
        >
          {/* Today's Schedule */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={15} className="text-[#1256a3]" />
              <h3 className="font-display font-semibold text-gray-800 text-[15px]">Today's Schedule</h3>
            </div>

            {loadingAppts ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="skeleton w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <span className="skeleton inline-block h-3 w-28" />
                      <span className="skeleton inline-block h-2.5 w-20" />
                    </div>
                    <span className="skeleton inline-block h-3 w-12" />
                  </div>
                ))}
              </div>
            ) : todaySchedule.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Calendar size={28} className="mx-auto mb-2 opacity-25" />
                <p className="text-[12px]">No appointments today</p>
              </div>
            ) : (
              <div className="space-y-0">
                {todaySchedule.map((apt, i) => {
                  const isPast = new Date(apt.date) < new Date('2026-04-29T17:14:19+05:30');
                  return (
                    <div key={apt.id} className="timeline-row">
                      <div className={`timeline-dot ${isPast ? 'done' : ''} flex-shrink-0`} style={{ marginTop: 4 }} />
                      <div
                        className="flex-1 min-w-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                        onClick={() => setSelectedPatient(apt)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-[13px] font-semibold text-gray-800 truncate">{apt.name}</span>
                          <span className="text-[11px] font-semibold text-gray-500 flex-shrink-0">{formatTime(apt.date)}</span>
                        </div>
                        <span className="text-[11px] text-gray-400">{apt.service}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Popular Services */}
          <div className="card p-4">
            <h3 className="font-display font-semibold text-gray-800 text-[15px] mb-4">Popular Services</h3>
            {loadingAppts ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="skeleton inline-block h-3 w-28" />
                      <span className="skeleton inline-block h-3 w-8" />
                    </div>
                    <span className="skeleton inline-block h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {servicePopularity.slice(0, 5).map(s => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-[12px] font-medium text-gray-600 truncate">{s.name}</span>
                      <span className="text-[12px] font-bold flex-shrink-0" style={{ color: s.color }}>{s.value}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${s.value * 3.2}%`, background: s.color, transition: 'width 0.7s ease' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Overview */}
          <div className="card p-4">
            <h3 className="font-display font-semibold text-gray-800 text-[15px] mb-4">Weekly Overview</h3>
            {loadingAppts ? (
              <div className="flex items-end gap-2 h-28">
                {[...Array(6)].map((_, i) => (
                  <span key={i} className="skeleton flex-1 rounded-t" style={{ height: `${35 + i * 10}%` }} />
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={busiestDays} barSize={24} margin={{ top: 2, right: 2, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                    {busiestDays.map((e, i) => (
                      <Cell key={i} fill={e.count === Math.max(...busiestDays.map(d => d.count)) ? '#1256a3' : '#dbeafe'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Patient Modal */}
      {selectedPatient && (
        <PatientModal
          appointment={selectedPatient}
          allAppointments={appointments}
          onClose={() => setSelectedPatient(null)}
          onCancel={handleCancel}
          onReschedule={handleReschedule}
        />
      )}
    </div>
  );
}
