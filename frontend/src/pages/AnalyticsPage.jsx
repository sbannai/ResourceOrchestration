import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement
} from 'chart.js';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement);

export default function AnalyticsPage() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/kpis').then(({ data }) => setKpis(data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div className="page-header"><div className="page-title">Analytics</div></div>
      <div className="flex-center" style={{ height: 400 }}>
        <div className="spinner" style={{ width: 40, height: 40, borderTopColor: '#2563EB', borderWidth: 3 }} />
      </div>
    </div>
  );

  const { kpis: k, charts } = kpis || { kpis: {}, charts: {} };
  const monthly = charts?.monthlyData || [];

  const activityBar = {
    labels: monthly.map(m => m.month),
    datasets: [
      { label: 'Projects Created', data: monthly.map(m => m.created), backgroundColor: '#BFDBFE', borderRadius: 4 },
      { label: 'Active', data: monthly.map(m => m.active), backgroundColor: '#2563EB', borderRadius: 4 },
      { label: 'Completed', data: monthly.map(m => m.completed), backgroundColor: '#059669', borderRadius: 4 },
    ],
  };

  const statusLabels = Object.keys(charts?.statusBreakdown || {});
  const statusColors = { planning: '#8B5CF6', active: '#2563EB', on_hold: '#D97706', completed: '#059669', cancelled: '#DC2626' };
  const statusDoughnut = {
    labels: statusLabels.map(s => s.replace('_', ' ')),
    datasets: [{
      data: statusLabels.map(s => charts.statusBreakdown[s]),
      backgroundColor: statusLabels.map(s => statusColors[s] || '#6B7280'),
      borderWidth: 3, borderColor: '#fff',
    }],
  };

  const chartOpts = { responsive: true, plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false };

  const metrics = [
    { label: 'Project Completion Rate', value: k.completionRate, suffix: '%', color: '#2563EB' },
    { label: 'Budget Utilization', value: charts?.budgetUtilization || 0, suffix: '%', color: '#D97706' },
    { label: 'Avg Project Progress', value: k.avgProgress, suffix: '%', color: '#059669' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Analytics & KPIs</div>
          <div className="page-subtitle">Real-time project performance insights</div>
        </div>
      </div>

      <div className="page-content">
        {/* KPI summary */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 24 }}>
          {[
            { l: 'Total Projects', v: k.totalProjects || 0, icon: '🏗️' },
            { l: 'Completed', v: k.completedProjects || 0, icon: '✅' },
            { l: 'Active', v: k.activeProjects || 0, icon: '⚡' },
            { l: 'Completion Rate', v: `${k.completionRate || 0}%`, icon: '📈' },
            { l: 'Total Users', v: k.totalUsers || 0, icon: '👥' },
            { l: 'Revenue', v: `$${Math.round((k.totalRevenue || 0) / 1000)}K`, icon: '💰' },
          ].map(item => (
            <div key={item.l} className="kpi-card">
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div className="kpi-label">{item.l}</div>
              <div className="kpi-value" style={{ fontSize: 24 }}>{item.v}</div>
            </div>
          ))}
        </div>

        {/* Performance meters */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title" style={{ marginBottom: 20 }}>Key Performance Metrics</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {metrics.map(m => (
              <div key={m.label}>
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>{m.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.value}{m.suffix}</span>
                </div>
                <div className="progress-bar-container" style={{ height: 12 }}>
                  <div className="progress-bar" style={{ width: `${Math.min(m.value, 100)}%`, background: m.color, borderRadius: 6 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>0%</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>100%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="charts-grid">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Monthly Project Activity</div>
                <div className="card-subtitle">6-month trend analysis</div>
              </div>
            </div>
            <div style={{ height: 300 }}>
              <Bar data={activityBar} options={chartOpts} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Portfolio Status Distribution</div>
                <div className="card-subtitle">Current project breakdown</div>
              </div>
            </div>
            <div style={{ height: 300 }}>
              {statusLabels.length > 0
                ? <Doughnut data={statusDoughnut} options={chartOpts} />
                : <div className="empty-state"><p>No project data available</p></div>
              }
            </div>
          </div>
        </div>

        {/* Budget analysis */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>Financial Overview</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {[
              { label: 'Total Budget', value: `$${(k.totalBudget || 0).toLocaleString()}`, color: '#2563EB', bg: '#EFF6FF' },
              { label: 'Actual Cost', value: `$${(k.actualCost || 0).toLocaleString()}`, color: '#D97706', bg: '#FEF3C7' },
              { label: 'Budget Variance', value: `$${(k.budgetVariance || 0).toLocaleString()}`, color: k.budgetVariance >= 0 ? '#059669' : '#DC2626', bg: k.budgetVariance >= 0 ? '#D1FAE5' : '#FEE2E2' },
              { label: 'Revenue Collected', value: `$${(k.totalRevenue || 0).toLocaleString()}`, color: '#059669', bg: '#D1FAE5' },
            ].map(f => (
              <div key={f.label} style={{ background: f.bg, borderRadius: 8, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: f.color }}>{f.value}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
