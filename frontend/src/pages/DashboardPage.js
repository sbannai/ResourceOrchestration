import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend, Filler } from 'chart.js';
import { analyticsService, projectService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend, Filler);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="stat-card" style={{borderTop: `4px solid ${color}`}}>
      <div className="stat-header">
        <span className="stat-icon" style={{background: color + '20', color}}>{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsService.getDashboard(), projectService.getKPIs()])
      .then(([analyticsRes, kpiRes]) => {
        setStats(analyticsRes.data.data);
        setKpis(kpiRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const projectStatusData = {
    labels: stats?.projectsByStatus?.map(s => s._id) || [],
    datasets: [{
      data: stats?.projectsByStatus?.map(s => s.count) || [],
      backgroundColor: ['#27ae60', '#2980b9', '#f39c12', '#e74c3c', '#95a5a6'],
      borderWidth: 0
    }]
  };

  const trendLabels = stats?.monthlyTrend?.map(t => MONTHS[t._id.month - 1]) || [];
  const trendData = {
    labels: trendLabels,
    datasets: [{
      label: 'Revenue ($)',
      data: stats?.monthlyTrend?.map(t => t.revenue) || [],
      backgroundColor: 'rgba(30,58,95,0.15)',
      borderColor: '#1e3a5f',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  };

  const projectTypeData = {
    labels: stats?.projectsByType?.map(t => t._id) || [],
    datasets: [{
      label: 'Projects',
      data: stats?.projectsByType?.map(t => t.count) || [],
      backgroundColor: ['#1e3a5f', '#f5821f', '#27ae60', '#e74c3c', '#9b59b6'],
      borderRadius: 6
    }]
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{color: 'var(--gray)', marginTop: 4}}>Welcome back, {user?.firstName}! Here's what's happening.</p>
        </div>
        <Link to="/projects" className="btn btn-primary">+ New Project</Link>
      </div>

      <div className="stats-grid">
        <StatCard icon="🏗" label="Total Projects" value={kpis?.totalProjects || 0} sub={`${kpis?.activeProjects || 0} active`} color="#1e3a5f" />
        <StatCard icon="✅" label="Completion Rate" value={`${kpis?.completionRate || 0}%`} sub={`${kpis?.completedProjects || 0} completed`} color="#27ae60" />
        <StatCard icon="💰" label="Total Budget" value={`$${((kpis?.totalBudget || 0) / 1000000).toFixed(1)}M`} sub={`${kpis?.budgetUtilization || 0}% utilized`} color="#f5821f" />
        <StatCard icon="📊" label="Revenue This Month" value={`$${((stats?.monthlyRevenue || 0) / 1000).toFixed(0)}K`} sub="Invoices paid" color="#2980b9" />
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <h3 className="chart-title">Revenue Trend (6 months)</h3>
          <Line data={trendData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        </div>
        <div className="card chart-card chart-sm">
          <h3 className="chart-title">Projects by Status</h3>
          <Doughnut data={projectStatusData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, cutout: '65%' }} />
        </div>
        <div className="card chart-card">
          <h3 className="chart-title">Projects by Type</h3>
          <Bar data={projectTypeData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        </div>
        <div className="card kpi-card">
          <h3 className="chart-title">Key Metrics</h3>
          <div className="kpi-list">
            <div className="kpi-item">
              <span>Active Projects</span>
              <span className="kpi-val">{kpis?.activeProjects || 0}</span>
            </div>
            <div className="kpi-item">
              <span>On Hold</span>
              <span className="kpi-val text-warning">{kpis?.onHoldProjects || 0}</span>
            </div>
            <div className="kpi-item">
              <span>Avg. Progress</span>
              <span className="kpi-val">{kpis?.avgActiveCompletion || 0}%</span>
            </div>
            <div className="kpi-item">
              <span>Budget Spent</span>
              <span className="kpi-val">${((kpis?.totalSpent || 0) / 1000).toFixed(0)}K</span>
            </div>
          </div>
          <div className="budget-bar-wrap">
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6}}>
              <span>Budget Utilization</span>
              <span>{kpis?.budgetUtilization || 0}%</span>
            </div>
            <div className="budget-bar-bg">
              <div className="budget-bar-fill" style={{width:`${Math.min(kpis?.budgetUtilization || 0, 100)}%`, background: (kpis?.budgetUtilization || 0) > 90 ? 'var(--danger)' : 'var(--success)'}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
