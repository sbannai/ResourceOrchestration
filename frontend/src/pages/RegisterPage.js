import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPages.css';

function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', companyName: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome aboard.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-control" type={type} placeholder={placeholder} value={form[key]}
        onChange={e => setForm({...form, [key]: e.target.value})} required />
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card" style={{maxWidth: 480}}>
        <div className="auth-logo">🏛 Construction ERP</div>
        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Start your 14-day free trial. No credit card required.</p>
        <form onSubmit={handleSubmit}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px'}}>
            {field('firstName', 'First Name', 'text', 'John')}
            {field('lastName', 'Last Name', 'text', 'Smith')}
          </div>
          {field('companyName', 'Company Name', 'text', 'ABC Construction Co.')}
          {field('email', 'Work Email', 'email', 'john@company.com')}
          {field('password', 'Password', 'password', 'Min. 8 characters')}
          <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%'}} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
