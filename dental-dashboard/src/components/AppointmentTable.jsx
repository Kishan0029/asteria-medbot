import React from 'react';
import { Calendar, Phone, Clock, X, Eye } from 'lucide-react';
import { getStatusClass, getStatusLabel, formatTime, formatIndianDate, getAvatarColor, getInitials } from '../utils/helpers';

export default function AppointmentTable({ appointments, loading, onViewPatient, onCancel }) {

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="skeleton w-[34px] h-[34px] rounded-full" />
            <div className="flex-1 space-y-2">
              <span className="skeleton h-[14px] w-36 inline-block" />
              <span className="skeleton h-[11px] w-24 inline-block" />
            </div>
            <span className="skeleton h-[22px] w-20 rounded-full" />
            <span className="skeleton h-[22px] w-16 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  /* ── Empty state ── */
  if (!appointments.length) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-gray-400 gap-2">
        <Calendar size={44} className="opacity-20" />
        <p className="font-semibold text-gray-500 text-sm">No appointments found</p>
        <p className="text-xs">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ minWidth: 160 }}>Patient</th>
            <th style={{ minWidth: 120 }}>Phone</th>
            <th style={{ minWidth: 150 }}>Service</th>
            <th style={{ minWidth: 140 }}>Date &amp; Time</th>
            <th style={{ minWidth: 100 }}>Status</th>
            <th style={{ minWidth: 80 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map(apt => {
            const [bg, fg] = getAvatarColor(apt.name);
            const canCancel = apt.status !== 'cancelled' && apt.status !== 'completed' && apt.status !== 'no-show';
            return (
              <tr
                key={apt.id}
                onClick={() => onViewPatient?.(apt)}
                className="cursor-pointer"
              >
                {/* Patient */}
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="avatar" style={{ background: bg, color: fg }}>
                      {getInitials(apt.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold text-gray-900 truncate">{apt.name}</div>
                    </div>
                  </div>
                </td>

                {/* Phone */}
                <td>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Phone size={11} className="text-gray-400 flex-shrink-0" />
                    <span className="text-[13px]">{apt.phone}</span>
                  </div>
                </td>

                {/* Service */}
                <td>
                  <span className="text-[13px] font-medium text-gray-700">{apt.service}</span>
                </td>

                {/* Date & Time */}
                <td>
                  <div className="text-[13px] text-gray-800">{formatIndianDate(apt.date)}</div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                    <Clock size={10} />
                    {formatTime(apt.date)}
                  </div>
                </td>

                {/* Status */}
                <td>
                  <span className={`badge ${getStatusClass(apt.status)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                    {getStatusLabel(apt.status)}
                  </span>
                </td>

                {/* Actions */}
                <td onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onViewPatient?.(apt)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      title="View details"
                    >
                      <Eye size={14} />
                    </button>
                    {canCancel && (
                      <button
                        onClick={() => onCancel?.(apt)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
