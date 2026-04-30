import React, { useState } from 'react';
import { X, Phone, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { formatIndianDate, formatTime, getStatusClass, getStatusLabel, getAvatarColor, getInitials } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function PatientModal({ appointment, allAppointments = [], onClose, onCancel, onReschedule }) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReschedule,    setShowReschedule]    = useState(false);
  const [rescheduleDate,    setRescheduleDate]    = useState('');
  const [rescheduleTime,    setRescheduleTime]    = useState('');

  if (!appointment) return null;

  const [bg, fg] = getAvatarColor(appointment.name);

  const history = allAppointments
    .filter(a => a.phone === appointment.phone && a.id !== appointment.id)
    .sort((a, b) => b.date - a.date)
    .slice(0, 6);

  const canAct = appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'no-show';

  function handleReschedule() {
    if (!rescheduleDate || !rescheduleTime) { toast.error('Please select a date and time.'); return; }
    onReschedule?.(appointment, rescheduleDate, rescheduleTime);
    toast.success('Appointment rescheduled successfully!');
    setShowReschedule(false);
    onClose();
  }

  function handleCancel() {
    onCancel?.(appointment);
    toast.error(`Appointment for ${appointment.name} has been cancelled.`);
    setShowCancelConfirm(false);
    onClose();
  }

  return (
    <div
      className="modal-backdrop"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ padding: 0 }}>

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="avatar w-12 h-12 text-base font-bold flex-shrink-0"
              style={{ background: bg, color: fg, width: 48, height: 48, fontSize: 16 }}
            >
              {getInitials(appointment.name)}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-[18px] font-semibold text-gray-900 leading-tight truncate">
                {appointment.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-[13px]">
                <Phone size={12} className="flex-shrink-0" />
                <span>{appointment.phone}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* ── Current Appointment ── */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-blue-700 mb-3">
              <Calendar size={12} /> Current Appointment
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow label="Service"    value={appointment.service} />
              <InfoRow label="Date"       value={formatIndianDate(appointment.date)} />
              <InfoRow label="Time"       value={formatTime(appointment.date)} />
              <InfoRow label="Status"     value={
                <span className={`badge ${getStatusClass(appointment.status)}`}>
                  {getStatusLabel(appointment.status)}
                </span>
              } />
              {appointment.notes && (
                <div className="col-span-2">
                  <InfoRow label="Notes" value={appointment.notes} />
                </div>
              )}
            </div>
          </div>

          {/* ── Reschedule form ── */}
          {showReschedule && (
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
              <p className="text-[13px] font-semibold text-gray-700">Reschedule Appointment</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">New Date</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={e => setRescheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">New Time</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={e => setRescheduleTime(e.target.value)}
                    min="09:00" max="19:00"
                    className="input-field"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleReschedule} className="btn btn-primary btn-sm">Confirm</button>
                <button onClick={() => setShowReschedule(false)} className="btn btn-ghost btn-sm">Cancel</button>
              </div>
            </div>
          )}

          {/* ── Cancel confirm ── */}
          {showCancelConfirm && (
            <div className="border border-red-200 rounded-xl p-4 bg-red-50 space-y-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle size={15} />
                <span className="text-[13px] font-semibold">Cancel this appointment?</span>
              </div>
              <p className="text-[13px] text-red-600">
                This will cancel {appointment.name}'s appointment on {formatIndianDate(appointment.date)} at {formatTime(appointment.date)}.
              </p>
              <div className="flex gap-2">
                <button onClick={handleCancel} className="btn btn-danger btn-sm">Yes, Cancel</button>
                <button onClick={() => setShowCancelConfirm(false)} className="btn btn-ghost btn-sm">Keep</button>
              </div>
            </div>
          )}

          {/* ── History ── */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wide text-gray-400 mb-3">
              Appointment History ({history.length})
            </p>
            {history.length === 0 ? (
              <p className="text-[13px] text-gray-400 text-center py-4">No previous appointments</p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {history.map(h => (
                  <div key={h.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-gray-800 truncate">{h.service}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{formatIndianDate(h.date)} · {formatTime(h.date)}</div>
                    </div>
                    <span className={`badge flex-shrink-0 ${getStatusClass(h.status)}`}>
                      {getStatusLabel(h.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-[18px]">
          {canAct ? (
            <>
              <button
                onClick={() => { setShowReschedule(s => !s); setShowCancelConfirm(false); }}
                className="btn btn-primary flex-1"
                style={{ justifyContent: 'center' }}
              >
                <Calendar size={14} /> Reschedule
              </button>
              <button
                onClick={() => { setShowCancelConfirm(s => !s); setShowReschedule(false); }}
                className="btn btn-danger flex-1"
                style={{ justifyContent: 'center' }}
              >
                Cancel Appointment
              </button>
            </>
          ) : (
            <button onClick={onClose} className="btn btn-ghost flex-1" style={{ justifyContent: 'center' }}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{label}</div>
      <div className="text-[13.5px] text-gray-800 font-medium">{value}</div>
    </div>
  );
}
