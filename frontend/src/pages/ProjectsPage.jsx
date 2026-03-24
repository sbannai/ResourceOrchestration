import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusBadge = {
  planning: 'badge-purple', active: 'badge-primary',
  on_hold: 'badge-warning', completed: 'badge-success', cancelled: 'badge-danger',
};
const priorityBadge = { low: 'badge-gray', medium: 'badge-primary', high: 'badge-warning', critical: 'badge-danger' };

function ProjectModal({ open, onClose, onSaved, project }) {
  const [form, setForm] = useState({
    name: '', projectCode: '', description: '', status: 'planning',
    priority: 'medium', 'budget.estimated': '', 'timeline.startDate': '', 'timeline.endDate': '',
    'client.name': '', 'location.city': '', 'location.state': '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        projectCode: project.projectCode || '',
        description: project.description || '',
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        'budget.estimated': project.budget?.estimated || '',
        'timeline.startDate': project.timeline?.startDate ? project.timeline.startDate.slice(0, 10) : '',
        'timeline.endDate': project.timeline?.endDate ? project.timeline.endDate.slice(0, 10) : '',
        'client.name': project.client?.name || '',
        'location.city': project.location?.city || '',
        'location.state': project.location?.state || '',
      });
    } else {
      setForm({ name: '', projectCode: '', description: '', status: 'planning', priority: 'medium', 'budget.estimated': '', 'timeline.startDate': '', 'timeline.endDate': '', 'client.name': '', 'location.city': '', 'location.state': '' });
    }
  }, [project, open]);

  if (!open) return null;

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: form.name, projectCode: form.projectCode, description: form.description,
        status: form.status, priority: form.priority,
        budget: { estimated: Number(form['budget.estimated']) || 0 },
        timeline: { startDate: form['timeline.startDate'], endDate: form['timeline.endDate'] },
        client: { name: form['client.name'] },
        location: { city: form['location.city'], state: form['location.state'] },
      };
      if (project) {
        await api.put(`/projects/${project._id}`, payload);
      } else {
        await api.post('/projects', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{project ? 'Edit Project' : 'New Project'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6B7280' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Project Code *</label>
                <input className="form-input" name="projectCode" value={form.projectCode} onChange={handleChange} placeholder="PRJ-001" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                  {['planning', 'active', 'on_hold', 'completed', 'cancelled'].map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" name="priority" value={form.priority} onChange={handleChange}>
                  {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Client Name</label>
                <input className="form-input" name="client.name" value={form['client.name']} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Budget ($)</label>
                <input className="form-input" type="number" name="budget.estimated" value={form['budget.estimated']} onChange={handleChange} />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input className="form-input" type="date" name="timeline.startDate" value={form['timeline.startDate']} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input className="form-input" type="date" name="timeline.endDate" value={form['timeline.endDate']} onChange={handleChange} />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" name="location.city" value={form['location.city']} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" name="location.state" value={form['location.state']} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" />Saving...</> : 'Save Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const fetchProjects = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const { data } = await api.get(`/projects?${params}`);
      setProjects(data.projects);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    await api.delete(`/projects/${id}`);
    fetchProjects();
  };

  const canEdit = hasRole('tenant_admin', 'project_manager');

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Projects</div>
          <div className="page-subtitle">{pagination.total} total projects</div>
        </div>
        <div className="header-actions">
          {canEdit && (
            <button className="btn btn-primary" onClick={() => { setEditProject(null); setModalOpen(true); }}>
              + New Project
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-wrapper">
              <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                className="search-input form-input"
                style={{ paddingLeft: 36, width: 240 }}
                placeholder="Search projects..."
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <select className="form-select" style={{ width: 140 }} value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Status</option>
              {['planning', 'active', 'on_hold', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <select className="form-select" style={{ width: 140 }} value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}>
              <option value="">All Priority</option>
              {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ status: '', priority: '', search: '' })}>Clear</button>
          </div>
        </div>

        {loading ? (
          <div className="flex-center" style={{ height: 300 }}>
            <div className="spinner" style={{ width: 36, height: 36, borderTopColor: '#2563EB', borderWidth: 3 }} />
          </div>
        ) : projects.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <h3>No projects found</h3>
              <p>{canEdit ? 'Create your first project to get started.' : 'No projects available yet.'}</p>
              {canEdit && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModalOpen(true)}>Create Project</button>}
            </div>
          </div>
        ) : (
          <>
            <div className="card" style={{ padding: 0 }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Progress</th>
                      <th>Budget</th>
                      <th>Client</th>
                      <th>End Date</th>
                      {canEdit && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(p => (
                      <tr key={p._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p._id}`)}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>{p.location?.city}{p.location?.city && p.location?.state ? ', ' : ''}{p.location?.state}</div>
                        </td>
                        <td><code style={{ fontSize: 12, background: '#F3F4F6', padding: '2px 6px', borderRadius: 4 }}>{p.projectCode}</code></td>
                        <td><span className={`badge ${statusBadge[p.status] || 'badge-gray'}`}>{p.status.replace('_', ' ')}</span></td>
                        <td><span className={`badge ${priorityBadge[p.priority] || 'badge-gray'}`}>{p.priority}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar-container" style={{ width: 80 }}>
                              <div className="progress-bar" style={{ width: `${p.progress}%` }} />
                            </div>
                            <span style={{ fontSize: 12, color: '#6B7280' }}>{p.progress}%</span>
                          </div>
                        </td>
                        <td>${(p.budget?.estimated || 0).toLocaleString()}</td>
                        <td>{p.client?.name || '—'}</td>
                        <td style={{ fontSize: 12 }}>{p.timeline?.endDate ? new Date(p.timeline.endDate).toLocaleDateString() : '—'}</td>
                        {canEdit && (
                          <td onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => { setEditProject(p); setModalOpen(true); }}>Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>Del</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {pagination.pages > 1 && (
              <div className="flex-center" style={{ marginTop: 16, gap: 8 }}>
                {Array.from({ length: pagination.pages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`btn ${pagination.page === i + 1 ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => fetchProjects(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchProjects}
        project={editProject}
      />
    </div>
  );
}
