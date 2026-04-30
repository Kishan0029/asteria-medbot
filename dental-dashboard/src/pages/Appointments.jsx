import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Phone, Clock, X, Eye, CheckCircle, ChevronDown } from 'lucide-react';
import { formatIndianDate, formatTime, getStatusClass, getStatusLabel, getAvatarColor, getInitials } from '../utils/helpers';
import PatientModal from '../components/PatientModal';
import toast from 'react-hot-toast';
import { api } from '../services/api';

const STATUS_TABS = ['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled'];
const SERVICES = [
  'All Services','Teeth Cleaning','Root Canal','Tooth Extraction',
  'Dental Implant','Orthodontic Consultation','Teeth Whitening',
  'Cavity Filling','Gum Treatment','Dental Crown','X-Ray & Checkup',
];

export default function Appointments({ appointments, setAppointments, loadingAppts }) {
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('All');
  const [service,    setService]    = useState('All Services');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [selected,   setSelected]   = useState(null);
  const [showFilter, setShowFilter] = useState(false);

  const filtered = appointments.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.phone.includes(search)) return false;
    if (status !== 'All' && a.status !== status.toLowerCase()) return false;
    if (service !== 'All Services' && a.service !== service) return false;
    if (dateFrom && new Date(a.date) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(a.date) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  }).sort((a, b) => b.date - a.date);

  const hasFilters = search || status !== 'All' || service !== 'All Services' || dateFrom || dateTo;

  function clearFilters() { setSearch(''); setStatus('All'); setService('All Services'); setDateFrom(''); setDateTo(''); }

  async function handleCancel(apt) {
    const toastId = toast.loading('Cancelling appointment...');
    try {
      await api.cancelAppointment(apt.id, apt);
      setAppointments(p => p.map(a => a.id === apt.id ? { ...a, status: 'cancelled' } : a));
      toast.success(`Appointment for ${apt.name} cancelled.`, { id: toastId });
      setSelected(null);
    } catch (err) {
      toast.error('Failed to cancel appointment', { id: toastId });
    }
  }

  async function handleComplete(apt) {
    const toastId = toast.loading('Marking as complete...');
    try {
      await api.completeAppointment(apt.id);
      setAppointments(p => p.map(a => a.id === apt.id ? { ...a, status: 'completed' } : a));
      toast.success(`${apt.name}'s appointment marked complete.`, { id: toastId });
    } catch (err) {
      toast.error('Failed to mark complete', { id: toastId });
    }
  }

  async function handleReschedule(apt, date, time) {
    const toastId = toast.loading('Rescheduling...');
    try {
      await api.rescheduleAppointment(apt.id, date, time, apt);
      setAppointments(p => p.map(a => a.id !== apt.id ? a : { ...a, date: new Date(`${date}T${time}:00`).getTime(), status: 'confirmed' }));
      toast.success('Appointment rescheduled!', { id: toastId });
      setSelected(null);
    } catch (err) {
      toast.error('Failed to reschedule appointment', { id: toastId });
    }
  }

  return (
    <div className="p-5 space-y-4">

      {/* ── Filter Bar ── */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          {/* Status tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_TABS.map(s => (
              <button key={s} onClick={() => setStatus(s)} className={`filter-tab ${status === s ? 'active' : ''}`}>{s}</button>
            ))}
          </div>

          {/* Advanced filter toggle */}
          <button
            onClick={() => setShowFilter(v => !v)}
            className="btn btn-ghost ml-auto flex-shrink-0"
          >
            <Filter size={14} />
            Filters
            <ChevronDown size={13} style={{ transform: showFilter ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>

        {/* Advanced filters */}
        {showFilter && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Service</label>
              <select value={service} onChange={e => setService(e.target.value)} className="input-field">
                {SERVICES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field" />
            </div>
          </div>
        )}
      </div>

      {/* ── Results bar ── */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-gray-500">
          {loadingAppts ? 'Loading…' : `${filtered.length} appointment${filtered.length !== 1 ? 's' : ''}`}
        </span>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-[12px] text-[#1256a3] font-semibold hover:underline">
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* ── Cards Grid ── */}
      {loadingAppts ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="skeleton w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <span className="skeleton inline-block h-4 w-32" />
                  <span className="skeleton inline-block h-3 w-20" />
                </div>
              </div>
              <span className="skeleton inline-block h-3 w-full" />
              <span className="skeleton inline-block h-3 w-3/4" />
              <div className="flex gap-2 pt-1">
                <span className="skeleton flex-1 h-8 rounded-lg" />
                <span className="skeleton flex-1 h-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Calendar size={48} className="opacity-20" />
          <p className="font-semibold text-gray-500 text-base">No appointments found</p>
          <p className="text-[13px]">Try adjusting your search or filters</p>
          {hasFilters && (
            <button onClick={clearFilters} className="btn btn-ghost btn-sm mt-1">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(apt => {
            const [bg, fg] = getAvatarColor(apt.name);
            const canAct   = apt.status !== 'cancelled' && apt.status !== 'completed' && apt.status !== 'no-show';
            return (
              <div
                key={apt.id}
                className="card card-hover p-4 flex flex-col"
                onClick={() => setSelected(apt)}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="avatar flex-shrink-0" style={{ background: bg, color: fg, width: 40, height: 40, fontSize: 14 }}>
                      {getInitials(apt.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold text-gray-900 truncate">{apt.name}</div>
                    </div>
                  </div>
                  <span className={`badge flex-shrink-0 ${getStatusClass(apt.status)}`}>
                    {getStatusLabel(apt.status)}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 flex-1 mb-4">
                  <DetailRow icon={<Phone size={12} className="text-gray-400 flex-shrink-0" />} text={apt.phone} />
                  <DetailRow icon={<span className="w-2 h-2 rounded-full bg-[#1256a3] flex-shrink-0" />} text={apt.service} />
                  <DetailRow icon={<Calendar size={12} className="text-gray-400 flex-shrink-0" />} text={formatIndianDate(apt.date)} />
                  <DetailRow icon={<Clock size={12} className="text-gray-400 flex-shrink-0" />} text={formatTime(apt.date)} />
                </div>

                {/* Actions */}
                <div
                  className="flex gap-2 pt-3 border-t border-gray-50"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => setSelected(apt)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-semibold text-[#1256a3] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye size={12} /> View
                  </button>
                  {apt.status === 'confirmed' && (
                    <button
                      onClick={() => handleComplete(apt)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <CheckCircle size={12} /> Complete
                    </button>
                  )}
                  {canAct && (
                    <button
                      onClick={() => handleCancel(apt)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <X size={12} /> Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <PatientModal
          appointment={selected}
          allAppointments={appointments}
          onClose={() => setSelected(null)}
          onCancel={handleCancel}
          onReschedule={handleReschedule}
        />
      )}
    </div>
  );
}

function DetailRow({ icon, text }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-gray-600">
      {icon}
      <span className="truncate">{text}</span>
    </div>
  );
}
