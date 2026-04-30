import React, { useEffect, useState } from 'react';
import { Menu, Bell, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const PAGE_TITLES = {
  '/':              { title: 'Dashboard',     sub: 'Fit For Tooth Dental Clinic — Powered by Medbot' },
  '/appointments':  { title: 'Appointments',  sub: 'Manage all patient appointments' },
  '/analytics':     { title: 'Analytics',     sub: 'Clinic performance insights' },
  '/notifications': { title: 'Notifications', sub: 'WhatsApp reminder log' },
  '/settings':      { title: 'Settings',      sub: 'Clinic configuration' },
};

function formatIST(date) {
  const d = new Date(date);
  const day = d.getDate();
  const suffix = ['th','st','nd','rd'][day % 10 > 3 || Math.floor((day%100)/10)===1 ? 0 : day%10];
  return `${day}${suffix} ${format(d, 'MMMM yyyy')} · ${format(d, 'h:mm:ss a')} IST`;
}

export default function Header({ onMenuToggle, pathname }) {
  const [now, setNow] = useState(new Date());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(d => new Date(d.getTime() + 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const { title, sub } = PAGE_TITLES[pathname] ?? PAGE_TITLES['/'];

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1800);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 flex items-center justify-between px-5 py-3 gap-4">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="md:hidden flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} className="text-gray-600" />
        </button>

        <div className="min-w-0">
          <h1 className="font-display text-[18px] font-semibold text-gray-900 leading-tight truncate">{title}</h1>
          <p className="text-[11px] text-gray-400 leading-tight mt-0.5 truncate">{formatIST(now)}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleSync}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-600 hover:border-[#1256a3] hover:text-[#1256a3] transition-colors bg-white"
        >
          <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing…' : 'Sync'}
        </button>

        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={18} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        <div className="w-8 h-8 rounded-lg bg-[#1256a3] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 select-none">
          MB
        </div>
      </div>
    </header>
  );
}
