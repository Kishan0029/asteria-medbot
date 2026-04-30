import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import { api } from './services/api';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const location = useLocation();

  useEffect(() => {
    function fetchLive() {
      api.getAppointments()
        .then(data => {
          setAppointments(data);
          setLoadingAppts(false);
        })
        .catch(err => {
          console.error("Failed to load live data:", err);
          setLoadingAppts(false);
          toast.error("Failed to connect to n8n webhook.");
        });
    }

    // Fetch on mount
    fetchLive();

    // Sync every minute
    const intervalId = setInterval(fetchLive, 60000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      {/* Fixed sidebar — 256px wide on md+ */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area — offset by sidebar width on md+ */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        <Header
          onMenuToggle={() => setSidebarOpen(o => !o)}
          pathname={location.pathname}
        />

        <main className="flex-1 overflow-x-hidden">
          <Routes>
            <Route path="/"
              element={<Dashboard appointments={appointments} setAppointments={setAppointments} loadingAppts={loadingAppts} />}
            />
            <Route path="/appointments"
              element={<Appointments appointments={appointments} setAppointments={setAppointments} loadingAppts={loadingAppts} />}
            />
            <Route path="/analytics"  element={<Analytics appointments={appointments} />} />
            <Route path="/notifications" element={<Notifications appointments={appointments} />} />
            <Route path="/settings"   element={<Settings />} />
          </Routes>
        </main>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            background: '#0f172a',
            color: '#f8fafc',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
