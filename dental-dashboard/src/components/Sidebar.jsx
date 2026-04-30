import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, BarChart2, Settings, Bell, X
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/',              icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/appointments',  icon: Calendar,        label: 'Appointments' },
  { path: '/analytics',     icon: BarChart2,       label: 'Analytics' },
  { path: '/notifications', icon: Bell,            label: 'Notifications' },
  { path: '/settings',      icon: Settings,        label: 'Settings' },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed top-0 left-0 h-screen w-64 z-50 flex flex-col',
          'bg-gradient-to-b from-[#0b3870] via-[#1256a3] to-[#1565c0]',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            {/* Tooth SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C9.2 2 7 4.2 7 7c0 1.1.3 2.2.9 3.1L6.1 18c-.1.5 0 1 .3 1.4.3.4.7.6 1.2.6.6 0 1.1-.4 1.4-.9L11 15h2l2 4.1c.3.5.8.9 1.4.9.5 0 .9-.2 1.2-.6.3-.4.4-.9.3-1.4L16.1 10c.6-.9.9-2 .9-3.1 0-2.7-2.2-4.9-5-4.9z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-display text-white text-[14.5px] font-semibold leading-tight">Medbot</div>
            <div className="text-white/55 text-[11px] mt-0.5">Fit For Tooth Dental Clinic</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          <div className="px-5 mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-widest text-white/35">Main Menu</span>
          </div>

          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} className="nav-icon" />
              <span className="nav-label">{label}</span>
              <span className="nav-dot" />
            </NavLink>
          ))}
        </nav>

        {/* Google Calendar status */}
        <div className="mx-3 mb-4 p-3 bg-white/10 rounded-xl flex-shrink-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-white text-xs font-semibold">Google Calendar</span>
          </div>
          <span className="text-white/45 text-[11px]">Connected · Auto-syncing</span>
        </div>

        {/* Mobile close */}
        <button
          className="absolute top-4 right-3 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 md:hidden"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </aside>
    </>
  );
}
