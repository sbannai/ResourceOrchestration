import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

function UserModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer', phone: '', department: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/users', form);
      onSaved();
      onClose();
      setForm({ name: '', email: '', password: '', role: 'viewer', phone: '', department: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Invite New User</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6B7280' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
              </div>
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {['viewer', 'foreman', 'engineer', 'project_manager', 'tenant_admin'].map(r => (
                    <option key={r} value={r}>{r.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" />Creating...</> : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const roleBadge = {
  super_admin: 'badge-danger', tenant_admin: 'badge-primary',
  project_manager: 'badge-purple', engineer: 'badge-success',
  foreman: 'badge-warning', viewer: 'badge-gray',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 20, ...(search && { search }) });
      const { data } = await api.get(`/users?${params}`);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this user?')) return;
    await api.delete(`/users/${id}`);
    fetchUsers();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">User Management</div>
          <div className="page-subtitle">{pagination.total} total users</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Invite User</button>
        </div>
      </div>

      <div className="page-content">
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <input
            className="form-input"
            style={{ maxWidth: 300 }}
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div className="flex-center" style={{ height: 300 }}>
              <div className="spinner" style={{ width: 36, height: 36, borderTopColor: '#2563EB', borderWidth: 3 }} />
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <h3>No users found</h3>
              <p>Invite team members to get started.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="user-avatar" style={{ width: 36, height: 36, fontSize: 13, background: '#2563EB' }}>
                            {u.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                            <div style={{ fontSize: 12, color: '#6B7280' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge ${roleBadge[u.role] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{u.role?.replace('_', ' ')}</span></td>
                      <td>{u.department || '—'}</td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#6B7280' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                      <td>
                        {u.isActive && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(u._id)}>Deactivate</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <UserModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchUsers} />
    </div>
  );
}
