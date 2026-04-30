import React, { useEffect, useState } from 'react';
import { TrendingDown, Activity, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Sector
} from 'recharts';

/* ─── Tooltip ─────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-[13px]">
      <p className="font-semibold text-gray-700">{label ?? payload[0].name}</p>
      <p className="font-bold text-[#1256a3]">{payload[0].value} appointments</p>
    </div>
  );
};

/* ─── Heatmap intensity ───────────────────────────────── */
function heatColor(v) {
  if (v === 0) return '#f1f5f9';
  if (v <= 2)  return '#dbeafe';
  if (v <= 4)  return '#93c5fd';
  if (v <= 6)  return '#3b82f6';
  if (v <= 8)  return '#1256a3';
  return '#0d3f7a';
}

const HOURS = ['9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
const DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat'];

/* ─── Active Pie shape ────────────────────────────────── */
function ActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" style={{ fontFamily: 'Playfair Display', fontSize: 13, fontWeight: 600, fill: '#1e293b' }}>
        {payload.name.split(' ')[0]}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontFamily: 'DM Sans', fontSize: 20, fontWeight: 700, fill: '#1256a3' }}>
        {value}%
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 3} outerRadius={innerRadius - 1} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
}

/* ─── Skeleton ────────────────────────────────────────── */
function ChartSkeleton({ height = 200 }) {
  return <span className="skeleton inline-block w-full rounded-xl" style={{ height }} />;
}

/* ─── Main ────────────────────────────────────────────── */
export default function Analytics({ appointments = [] }) {
  const [loading,      setLoading]      = useState(true);
  const [activePieIdx, setActivePieIdx] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);

  // Compute No-Show Rate
  const totalCompletedOrNoShow = appointments.filter(a => ['completed', 'no-show'].includes(a.status)).length;
  const noShows = appointments.filter(a => a.status === 'no-show').length;
  const noShowRate = totalCompletedOrNoShow ? Math.round((noShows / totalCompletedOrNoShow) * 100) : 0;

  // Compute Completion Rate
  const completionRate = totalCompletedOrNoShow ? Math.round(((totalCompletedOrNoShow - noShows) / totalCompletedOrNoShow) * 100) : 100;

  // Compute Avg. per Day
  const now = new Date();
  const past30DaysAppts = appointments.filter(a => new Date(a.date) > new Date(now.getTime() - 30 * 86400000));
  const avgPerDay = (past30DaysAppts.length / 26).toFixed(1); // excluding Sundays

  // Monthly Bookings
  const monthlyCounts = {};
  appointments.forEach(a => {
    const d = new Date(a.date);
    const mStr = d.toLocaleDateString('en-US', { month: 'short' });
    monthlyCounts[mStr] = (monthlyCounts[mStr] || 0) + 1;
  });
  const monthlyBookings = Object.entries(monthlyCounts).map(([month, count]) => ({ month, count }));

  // Service Popularity
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

  // Busiest Days
  const dayCounts = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
  appointments.forEach(a => {
    const dayStr = new Date(a.date).toLocaleDateString('en-US', { weekday: 'short' });
    if (dayCounts[dayStr] !== undefined) dayCounts[dayStr]++;
  });
  const busiestDays = Object.entries(dayCounts).map(([day, count]) => ({ day, count }));

  // Heatmap Data
  const heatmapData = [];
  DAYS.forEach(day => {
    HOURS.forEach(hour => {
      heatmapData.push({ day, hour, value: 0 });
    });
  });
  appointments.forEach(a => {
    const d = new Date(a.date);
    const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    const hourStr = d.getHours() + ':00';
    const cell = heatmapData.find(c => c.day === dayStr && c.hour === hourStr);
    if (cell) cell.value++;
  });

  const statCards = [
    { label: 'No-Show Rate',     value: `${noShowRate}%`, sub: 'Last 30 days',         icon: TrendingDown, color: '#dc2626', bg: '#fef2f2' },
    { label: 'Completion Rate',  value: `${completionRate}%`, sub: 'Last 30 days',  icon: Activity,     color: '#059669', bg: '#ecfdf5' },
    { label: 'Avg. per Day',     value: avgPerDay,            sub: 'Monday – Saturday',     icon: Users,        color: '#1256a3', bg: '#eff6ff' },
  ];

  return (
    <div className="p-5 space-y-5">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div className="metric-icon flex-shrink-0" style={{ background: s.bg }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] text-gray-500 font-medium">{s.label}</p>
              <p className="text-[26px] font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Monthly Bookings bar ── */}
      <div className="card p-5">
        <h2 className="font-display font-semibold text-gray-800 text-[16px] mb-5">Monthly Bookings</h2>
        {loading ? <ChartSkeleton height={220} /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyBookings} barSize={42} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="count" radius={[7, 7, 0, 0]}>
                {monthlyBookings.map((_, i) => (
                  <Cell key={i} fill={i === monthlyBookings.length - 1 ? '#1256a3' : '#dbeafe'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Two-col: Pie + Busiest Days ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Popular Services donut */}
        <div className="card p-5">
          <h2 className="font-display font-semibold text-gray-800 text-[16px] mb-4">Most Popular Services</h2>
          {loading ? <ChartSkeleton height={260} /> : (
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={servicePopularity}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    dataKey="value"
                    activeIndex={activePieIdx}
                    activeShape={ActiveShape}
                    onMouseEnter={(_, i) => setActivePieIdx(i)}
                  >
                    {servicePopularity.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                {servicePopularity.map(s => (
                  <div key={s.name} className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-[12px] text-gray-600 truncate">{s.name}</span>
                    <span className="text-[12px] font-bold text-gray-800 ml-auto flex-shrink-0">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Busiest days horizontal bar */}
        <div className="card p-5">
          <h2 className="font-display font-semibold text-gray-800 text-[16px] mb-4">Busiest Days of Week</h2>
          {loading ? <ChartSkeleton height={260} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={busiestDays} layout="vertical" barSize={20} margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="day" type="category" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="count" radius={[0, 7, 7, 0]}>
                  {busiestDays.map((e, i) => (
                    <Cell key={i} fill={e.count === Math.max(...busiestDays.map(d => d.count)) ? '#1256a3' : '#93c5fd'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Heatmap ── */}
      <div className="card p-5">
        <h2 className="font-display font-semibold text-gray-800 text-[16px]">Busiest Time Slots</h2>
        <p className="text-[12px] text-gray-400 mb-5 mt-0.5">Appointments per hour, per day</p>

        {loading ? <ChartSkeleton height={180} /> : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: 480 }}>
              {/* Hour labels */}
              <div className="flex mb-2" style={{ marginLeft: 40 }}>
                {HOURS.map(h => (
                  <div key={h} className="flex-1 text-center text-[10px] text-gray-400 font-medium">{h}</div>
                ))}
              </div>

              {/* Grid rows */}
              {DAYS.map(day => {
                const row = heatmapData.filter(d => d.day === day);
                return (
                  <div key={day} className="flex items-center gap-1 mb-1.5">
                    <span className="text-[11px] text-gray-500 font-semibold text-right pr-2" style={{ width: 32 }}>{day}</span>
                    <div className="flex flex-1 gap-1">
                      {HOURS.map(hour => {
                        const cell = row.find(r => r.hour === hour);
                        return (
                          <div
                            key={hour}
                            className="heatmap-cell flex-1"
                            style={{ background: heatColor(cell?.value ?? 0), height: 28 }}
                            title={`${day} ${hour}: ${cell?.value ?? 0} appointments`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div className="flex items-center gap-2 mt-4" style={{ marginLeft: 40 }}>
                <span className="text-[10px] text-gray-400">Low</span>
                {[0,2,4,6,8,10].map(v => (
                  <div key={v} className="w-5 h-4 rounded" style={{ background: heatColor(v) }} />
                ))}
                <span className="text-[10px] text-gray-400">High</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
