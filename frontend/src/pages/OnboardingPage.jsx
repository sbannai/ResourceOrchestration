import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    tenantName: '', adminName: '', adminEmail: '',
    adminPassword: '', confirmPassword: '', plan: 'starter',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.adminPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/onboarding/provision', {
        tenantName: form.tenantName,
        adminEmail: form.adminEmail,
        adminName: form.adminName,
        adminPassword: form.adminPassword,
        plan: form.plan,
      });
      setSuccess(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Provisioning failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    { id: 'starter', name: 'Starter', price: '$49/mo', users: '5 users', projects: '10 projects' },
    { id: 'professional', name: 'Professional', price: '$149/mo', users: '25 users', projects: '100 projects' },
    { id: 'enterprise', name: 'Enterprise', price: 'Custom', users: 'Unlimited', projects: 'Unlimited' },
  ];

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Workspace Created!</h2>
          <p style={{ color: '#6B7280', marginBottom: 24 }}>
            Your Construction ERP workspace <strong>{success.tenant.name}</strong> is ready.
          </p>
          <div style={{ background: '#F0F9FF', borderRadius: 8, padding: 16, marginBottom: 24, textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>Login credentials:</div>
            <div style={{ fontSize: 14 }}><strong>Workspace:</strong> {success.tenant.slug}</div>
            <div style={{ fontSize: 14 }}><strong>Email:</strong> {success.admin.email}</div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800 }}>Construction<span style={{ color: '#2563EB' }}>ERP</span></h1>
          <p style={{ color: '#9CA3AF', marginTop: 8 }}>Set up your enterprise workspace in minutes</p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Create Your Workspace</h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Company / Organization Name</label>
              <input className="form-input" name="tenantName" value={form.tenantName} onChange={handleChange} placeholder="Acme Construction Co." required />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Admin Full Name</label>
                <input className="form-input" name="adminName" value={form.adminName} onChange={handleChange} placeholder="John Smith" required />
              </div>
              <div className="form-group">
                <label className="form-label">Admin Email</label>
                <input className="form-input" type="email" name="adminEmail" value={form.adminEmail} onChange={handleChange} placeholder="admin@company.com" required />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" name="adminPassword" value={form.adminPassword} onChange={handleChange} placeholder="Min 8 characters" required minLength={8} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-input" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password" required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select Plan</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => setForm({ ...form, plan: plan.id })}
                    style={{
                      padding: 16, borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${form.plan === plan.id ? '#2563EB' : '#E5E7EB'}`,
                      background: form.plan === plan.id ? '#EFF6FF' : '#fff',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{plan.name}</div>
                    <div style={{ color: '#2563EB', fontWeight: 700, fontSize: 16, margin: '4px 0' }}>{plan.price}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{plan.users} · {plan.projects}</div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} disabled={loading}>
              {loading ? <><span className="spinner" />Provisioning workspace...</> : 'Create Workspace'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <a href="/login" style={{ color: '#2563EB', fontSize: 13 }}>Already have a workspace? Sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}
