import React, { useState } from 'react';
import { Save, RefreshCw, CheckCircle, Globe, Bell, Settings2, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Reusable bits ────────────────────────────────────── */
function Section({ title, icon: Icon, children }) {
  return (
    <div className="card p-6 space-y-5">
      <h2 className="font-display font-semibold text-gray-800 text-[16px] flex items-center gap-2 border-b border-gray-100 pb-4">
        <Icon size={17} className="text-[#1256a3]" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ on, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-gray-800">{label}</p>
        {desc && <p className="text-[12px] text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!on)}
        className={`toggle-track flex-shrink-0 ${on ? 'on' : 'off'}`}
        aria-pressed={on}
      >
        <div className="toggle-thumb" />
      </button>
    </div>
  );
}

/* ─── Main ─────────────────────────────────────────────── */
export default function Settings() {
  const [form, setForm] = useState({
    clinicName:    'Fit For Tooth Dental Clinic',
    address:       'Shop No. 12, Near Shivneri Hotel, Belagavi – 590001, Karnataka, India',
    phone:         '+91 9845612345',
    website:       'www.medbot.in',
    calendarId:    'fitfortooth.clinic@gmail.com',
    whatsapp:      '+919845612345',
    lang:          'English',
  });

  const [notifs, setNotifs] = useState({
    reminder24hr:     true,
    reminder1hr:      true,
    onCancel:         true,
    onReschedule:     true,
  });

  const [autoSync,   setAutoSync]   = useState(true);
  const [connected,  setConnected]  = useState(true);
  const [syncing,    setSyncing]    = useState(false);

  const [holidays, setHolidays] = useState(['Sundays']);
  const [newHoliday, setNewHoliday] = useState('');

  function setField(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  function save(section) { toast.success(`${section} settings saved!`); }

  function handleReconnect() {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setConnected(true);
      toast.success('Google Calendar reconnected!');
    }, 2000);
  }

  function addHoliday() {
    if (!newHoliday.trim()) return;
    setHolidays(h => [...h, newHoliday.trim()]);
    setNewHoliday('');
  }

  return (
    <div className="p-5 space-y-5 max-w-4xl">

      {/* ── Clinic Info ── */}
      <Section title="Clinic Information" icon={Settings2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Clinic Name">
            <input value={form.clinicName} onChange={setField('clinicName')} className="input-field" />
          </Field>
          <Field label="Phone Number">
            <input value={form.phone} onChange={setField('phone')} className="input-field" />
          </Field>
          <Field label="Website">
            <input value={form.website} onChange={setField('website')} className="input-field" />
          </Field>
          <Field label="WhatsApp Number">
            <input value={form.whatsapp} onChange={setField('whatsapp')} className="input-field" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address">
              <textarea value={form.address} onChange={setField('address')} rows={2} className="input-field resize-none" />
            </Field>
          </div>
        </div>

        {/* Hours */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-[#1256a3]">
            <Clock size={14} />
            <span className="text-[13px] font-bold">Clinic Hours</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-gray-500 mb-0.5">Working Days</p>
              <p className="text-[13.5px] font-semibold text-gray-800">Monday – Saturday</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 mb-0.5">Hours (IST)</p>
              <p className="text-[13.5px] font-semibold text-gray-800">9:00 AM – 7:00 PM</p>
            </div>
          </div>
        </div>

        {/* Holidays */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Holidays / Closures</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {holidays.map((h, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-[13px] text-gray-700">
                <Calendar size={11} className="text-gray-400" />
                <span>{h}</span>
                <button
                  onClick={() => setHolidays(p => p.filter((_, j) => j !== i))}
                  className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors leading-none"
                >×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newHoliday}
              onChange={e => setNewHoliday(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addHoliday()}
              placeholder="Add a holiday or closure…"
              className="input-field"
            />
            <button onClick={addHoliday} className="btn btn-primary flex-shrink-0">Add</button>
          </div>
        </div>

        <button onClick={() => save('Clinic Info')} className="btn btn-primary">
          <Save size={14} /> Save Changes
        </button>
      </Section>

      {/* ── Notification Settings ── */}
      <Section title="Notification Settings" icon={Bell}>
        <div>
          <Toggle on={notifs.reminder24hr} onChange={v => setNotifs(n => ({...n, reminder24hr: v}))}
            label="24-Hour Reminder" desc="Send WhatsApp reminder 24 hours before the appointment" />
          <Toggle on={notifs.reminder1hr}  onChange={v => setNotifs(n => ({...n, reminder1hr: v}))}
            label="1-Hour Reminder"  desc="Send WhatsApp reminder 1 hour before the appointment" />
          <Toggle on={notifs.onCancel}     onChange={v => setNotifs(n => ({...n, onCancel: v}))}
            label="Cancellation Alerts" desc="Notify patient when their appointment is cancelled" />
          <Toggle on={notifs.onReschedule} onChange={v => setNotifs(n => ({...n, onReschedule: v}))}
            label="Reschedule Alerts" desc="Notify patient when their appointment is rescheduled" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="WhatsApp Business Number">
            <input value={form.whatsapp} onChange={setField('whatsapp')} className="input-field" />
          </Field>
          <Field label="Message Language">
            <select value={form.lang} onChange={setField('lang')} className="input-field">
              {['English','Kannada','Hindi','Marathi'].map(l => <option key={l}>{l}</option>)}
            </select>
          </Field>
        </div>

        <button onClick={() => save('Notification')} className="btn btn-primary">
          <Save size={14} /> Save Changes
        </button>
      </Section>

      {/* ── Google Calendar ── */}
      <Section title="Google Calendar Integration" icon={Globe}>

        {/* Status banner */}
        <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${connected ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`metric-icon flex-shrink-0 ${connected ? 'bg-emerald-100' : 'bg-red-100'}`} style={{ width: 40, height: 40, borderRadius: 10 }}>
              <CheckCircle size={18} style={{ color: connected ? '#059669' : '#dc2626' }} />
            </div>
            <div className="min-w-0">
              <p className={`text-[13.5px] font-semibold ${connected ? 'text-emerald-800' : 'text-red-700'}`}>
                {connected ? 'Connected & Syncing' : 'Connection Error'}
              </p>
              <p className={`text-[11px] mt-0.5 ${connected ? 'text-emerald-600' : 'text-red-500'}`}>
                {connected ? 'Last synced: Just now · Auto-sync every 5 min' : 'Click reconnect to retry'}
              </p>
            </div>
          </div>
          <button
            onClick={handleReconnect}
            disabled={syncing}
            className="btn btn-ghost flex-shrink-0"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Connecting…' : 'Reconnect'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Calendar ID">
              <input value={form.calendarId} onChange={setField('calendarId')} className="input-field" />
            </Field>
          </div>
          <Toggle on={autoSync} onChange={setAutoSync}
            label="Auto-Sync" desc="Automatically sync calendar every 5 minutes" />
        </div>

        {/* Field mapping */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-3">
            Event Description Field Mapping
          </p>
          <div className="space-y-0">
            {[
              ['Appointment Type', '{service}'],
              ['Patient Name',     '{name}'],
              ['WhatsApp Number',  '{phone}'],
              ['Date',             '{date}'],
              ['Time',             '{time}'],
              ['Clinic',           'Fit For Tooth Dental Clinic'],
            ].map(([key, val]) => (
              <div key={key} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0 gap-4">
                <span className="text-[13px] text-gray-600">{key}</span>
                <code className="text-[12px] bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-[#1256a3] font-mono">
                  {val}
                </code>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => save('Integration')} className="btn btn-primary">
          <Save size={14} /> Save Changes
        </button>
      </Section>
    </div>
  );
}
