import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '', tenantSlug: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password, form.tenantSlug);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div>
          <div className="login-logo">
            Construction<span>ERP</span>
          </div>
          <p className="login-tagline">
            Enterprise-grade construction management platform.<br />
            Multi-tenant, secure, and built to scale.
          </p>
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '🏗️', title: 'Project Management', desc: 'Track projects, tasks & milestones' },
              { icon: '📊', title: 'KPI Analytics', desc: 'Real-time insights and reporting' },
              { icon: '💰', title: 'Billing & Accounting', desc: 'Invoice generation and ledger management' },
              { icon: '🔐', title: 'RBAC Security', desc: 'Role-based access control & tenant isolation' },
            ].map(f => (
              <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 24 }}>{f.icon}</span>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{f.title}</div>
                  <div style={{ color: '#9CA3AF', fontSize: 13 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-container">
          <div className="login-title">Welcome back</div>
          <div className="login-subtitle">Sign in to your Construction ERP account</div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Tenant Workspace</label>
              <input
                className="form-input"
                name="tenantSlug"
                value={form.tenantSlug}
                onChange={handleChange}
                placeholder="your-company"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? <><span className="spinner" />Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <span style={{ color: '#9CA3AF', fontSize: 13 }}>New to Construction ERP? </span>
            <a href="/onboarding" style={{ color: '#2563EB', fontSize: 13, fontWeight: 500 }}>Create workspace</a>
          </div>
        </div>
      </div>
    </div>
  );
}
