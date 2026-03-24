import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const KPICard = ({ label, value, icon, color, prefix = '', suffix = '' }) => (
  <div className="kpi-card">
    <div className="kpi-icon" style={{ background: `${color}20` }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
    </div>
    <div className="kpi-label">{label}</div>
    <div className="kpi-value" style={{ color }}>
      {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
    </div>
  </div>
);

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, tenant } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/analytics/kpis').then(({ data }) => {
      setKpis(data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Dashboard</div></div>
      </div>
      <div className="page-content flex-center" style={{ height: 400 }}>
        <div className="spinner" style={{ width: 40, height: 40, borderTopColor: '#2563EB', borderWidth: 3 }} />
      </div>
    </div>
  );

  const { kpis: k, charts } = kpis || { kpis: {}, charts: {} };
  const monthly = charts?.monthlyData || [];

  const barData = {
    labels: monthly.map(m => m.month),
    datasets: [
      { label: 'Created', data: monthly.map(m => m.created), backgroundColor: '#BFDBFE' },
      { label: 'Active', data: monthly.map(m => m.active), backgroundColor: '#2563EB' },
      { label: 'Completed', data: monthly.map(m => m.completed), backgroundColor: '#059669' },
    ],
  };

  const statusColors = { planning: '#8B5CF6', active: '#2563EB', on_hold: '#D97706', completed: '#059669', cancelled: '#DC2626' };
  const statusLabels = Object.keys(charts?.statusBreakdown || {});
  const doughnutData = {
    labels: statusLabels.map(s => s.replace('_', ' ').toUpperCase()),
    datasets: [{
      data: statusLabels.map(s => charts.statusBreakdown[s]),
      backgroundColor: statusLabels.map(s => statusColors[s] || '#6B7280'),
      borderWidth: 2,
    }],
  };

  const chartOptions = { responsive: true, plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Welcome back, {user?.name} · {tenant?.name}</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/projects')}>
            + New Project
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="kpi-grid">
          <KPICard label="Total Projects" value={k.totalProjects || 0} icon="🏗️" color="#2563EB" />
          <KPICard label="Active Projects" value={k.activeProjects || 0} icon="⚡" color="#059669" />
          <KPICard label="Completion Rate" value={k.completionRate || 0} icon="📈" color="#7C3AED" suffix="%" />
          <KPICard label="Total Users" value={k.totalUsers || 0} icon="👥" color="#0891B2" />
          <KPICard label="Total Budget" value={Math.round((k.totalBudget || 0) / 1000)} icon="💰" color="#D97706" prefix="$" suffix="K" />
          <KPICard label="Revenue Collected" value={Math.round((k.totalRevenue || 0) / 1000)} icon="💳" color="#059669" prefix="$" suffix="K" />
          <KPICard label="Avg. Progress" value={k.avgProgress || 0} icon="🎯" color="#2563EB" suffix="%" />
          <KPICard label="Pending Revenue" value={Math.round((k.pendingRevenue || 0) / 1000)} icon="⏳" color="#D97706" prefix="$" suffix="K" />
        </div>

        <div className="charts-grid">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Project Activity (6 Months)</div>
                <div className="card-subtitle">Monthly project creation and completion</div>
              </div>
            </div>
            <div style={{ height: 280 }}>
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Projects by Status</div>
                <div className="card-subtitle">Current portfolio breakdown</div>
              </div>
            </div>
            <div style={{ height: 280 }}>
              {statusLabels.length > 0
                ? <Doughnut data={doughnutData} options={chartOptions} />
                : <div className="empty-state"><p>No project data yet</p></div>
              }
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Budget Overview</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>Budget Utilization</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{charts?.budgetUtilization || 0}%</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${Math.min(charts?.budgetUtilization || 0, 100)}%`, background: (charts?.budgetUtilization || 0) > 90 ? '#DC2626' : '#2563EB' }} />
                </div>
              </div>
              <div className="flex-between">
                <span style={{ fontSize: 13, color: '#6B7280' }}>Estimated Budget</span>
                <span style={{ fontWeight: 600 }}>${(k.totalBudget || 0).toLocaleString()}</span>
              </div>
              <div className="flex-between">
                <span style={{ fontSize: 13, color: '#6B7280' }}>Actual Cost</span>
                <span style={{ fontWeight: 600 }}>${(k.actualCost || 0).toLocaleString()}</span>
              </div>
              <div className="flex-between">
                <span style={{ fontSize: 13, color: '#6B7280' }}>Variance</span>
                <span style={{ fontWeight: 600, color: k.budgetVariance >= 0 ? '#059669' : '#DC2626' }}>
                  {k.budgetVariance >= 0 ? '+' : ''}${(k.budgetVariance || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Quick Actions</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Create New Project', icon: '🏗️', path: '/projects' },
                { label: 'View Analytics', icon: '📊', path: '/analytics' },
                { label: 'Manage Billing', icon: '💰', path: '/billing' },
                { label: 'Team Management', icon: '👥', path: '/users' },
                { label: 'Accounting Ledger', icon: '📒', path: '/accounting' },
              ].map(a => (
                <button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', gap: 12 }}
                >
                  <span>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
