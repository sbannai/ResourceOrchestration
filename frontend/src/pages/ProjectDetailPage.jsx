import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusBadge = {
  planning: 'badge-purple', active: 'badge-primary',
  on_hold: 'badge-warning', completed: 'badge-success', cancelled: 'badge-danger',
};
const taskStatusBadge = { todo: 'badge-gray', in_progress: 'badge-primary', review: 'badge-warning', done: 'badge-success' };

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newTask, setNewTask] = useState({ name: '', description: '', priority: 'medium', status: 'todo', dueDate: '' });
  const [savingTask, setSavingTask] = useState(false);
  const { hasRole } = useAuth();

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data);
    } catch {
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    setSavingTask(true);
    try {
      await api.post(`/projects/${id}/tasks`, newTask);
      setNewTask({ name: '', description: '', priority: 'medium', status: 'todo', dueDate: '' });
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add task');
    } finally {
      setSavingTask(false);
    }
  };

  const handleTaskStatusChange = async (taskId, status) => {
    try {
      await api.put(`/projects/${id}/tasks/${taskId}`, { status });
      fetchProject();
    } catch {}
  };

  const handleProgressUpdate = async (progress) => {
    try {
      await api.put(`/projects/${id}`, { progress });
      fetchProject();
    } catch {}
  };

  if (loading) return <div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" style={{ width: 40, height: 40, borderTopColor: '#2563EB', borderWidth: 3 }} /></div>;
  if (!project) return null;

  const canEdit = hasRole('tenant_admin', 'project_manager', 'engineer');
  const tasksByStatus = { todo: [], in_progress: [], review: [], done: [] };
  project.tasks?.forEach(t => { if (tasksByStatus[t.status]) tasksByStatus[t.status].push(t); });

  const tabs = ['overview', 'tasks', 'milestones', 'team'];

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 20 }}>←</button>
            <div>
              <div className="page-title">{project.name}</div>
              <div className="page-subtitle">
                <code style={{ fontSize: 12, background: '#F3F4F6', padding: '1px 6px', borderRadius: 4 }}>{project.projectCode}</code>
                {' · '}
                <span className={`badge ${statusBadge[project.status] || 'badge-gray'}`}>{project.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, color: '#6B7280' }}>Progress: {project.progress}%</label>
            {canEdit && (
              <input
                type="range" min="0" max="100" value={project.progress}
                onChange={e => handleProgressUpdate(Number(e.target.value))}
                style={{ width: 100 }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 500, textTransform: 'capitalize',
                color: activeTab === tab ? '#2563EB' : '#6B7280',
                borderBottom: activeTab === tab ? '2px solid #2563EB' : '2px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid-2">
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>Project Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Description', project.description || '—'],
                  ['Client', project.client?.name || '—'],
                  ['Priority', project.priority],
                  ['Location', [project.location?.city, project.location?.state].filter(Boolean).join(', ') || '—'],
                  ['Project Manager', project.projectManager?.name || '—'],
                  ['Start Date', project.timeline?.startDate ? new Date(project.timeline.startDate).toLocaleDateString() : '—'],
                  ['End Date', project.timeline?.endDate ? new Date(project.timeline.endDate).toLocaleDateString() : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex-between">
                    <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 13, color: '#111827', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>Budget & Progress</div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>Overall Progress</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{project.progress}%</span>
                </div>
                <div className="progress-bar-container" style={{ height: 10 }}>
                  <div className="progress-bar" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Estimated Budget', `$${(project.budget?.estimated || 0).toLocaleString()}`],
                  ['Actual Cost', `$${(project.budget?.actual || 0).toLocaleString()}`],
                  ['Variance', `$${((project.budget?.estimated || 0) - (project.budget?.actual || 0)).toLocaleString()}`],
                  ['Total Tasks', project.tasks?.length || 0],
                  ['Completed Tasks', project.tasks?.filter(t => t.status === 'done').length || 0],
                  ['Team Size', project.team?.length || 0],
                ].map(([label, value]) => (
                  <div key={label} className="flex-between">
                    <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            {canEdit && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-title" style={{ marginBottom: 16 }}>Add New Task</div>
                <form onSubmit={handleAddTask}>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Task Name *</label>
                      <input className="form-input" value={newTask.name} onChange={e => setNewTask({ ...newTask, name: e.target.value })} required placeholder="e.g., Foundation inspection" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Due Date</label>
                      <input className="form-input" type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Priority</label>
                      <select className="form-select" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
                        {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="form-select" value={newTask.status} onChange={e => setNewTask({ ...newTask, status: e.target.value })}>
                        {['todo', 'in_progress', 'review', 'done'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input className="form-input" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={savingTask}>
                    {savingTask ? <><span className="spinner" />Adding...</> : '+ Add Task'}
                  </button>
                </form>
              </div>
            )}

            {/* Kanban-style task board */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {Object.entries(tasksByStatus).map(([status, tasks]) => (
                <div key={status}>
                  <div style={{ padding: '8px 12px', background: '#F3F4F6', borderRadius: '8px 8px 0 0', fontWeight: 600, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{status.replace('_', ' ')}</span>
                    <span className={`badge ${taskStatusBadge[status]}`}>{tasks.length}</span>
                  </div>
                  <div style={{ background: '#F9FAFB', borderRadius: '0 0 8px 8px', minHeight: 200, padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tasks.map(task => (
                      <div key={task._id} className="card" style={{ padding: 12, cursor: 'pointer' }}>
                        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>{task.name}</div>
                        {task.description && <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>{task.description}</div>}
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <span className={`badge badge-sm ${{ low: 'badge-gray', medium: 'badge-primary', high: 'badge-warning', critical: 'badge-danger' }[task.priority]}`} style={{ fontSize: 10, padding: '1px 6px' }}>{task.priority}</span>
                          {task.dueDate && <span style={{ fontSize: 10, color: '#6B7280' }}>{new Date(task.dueDate).toLocaleDateString()}</span>}
                        </div>
                        {canEdit && (
                          <select
                            className="form-select"
                            style={{ marginTop: 8, fontSize: 12, padding: '4px 8px' }}
                            value={task.status}
                            onChange={e => handleTaskStatusChange(task._id, e.target.value)}
                            onClick={e => e.stopPropagation()}
                          >
                            {['todo', 'in_progress', 'review', 'done'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Milestones</div>
            {project.milestones?.length === 0 || !project.milestones ? (
              <div className="empty-state"><p>No milestones defined yet.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {project.milestones.map(m => (
                  <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, border: '1px solid #E5E7EB', borderRadius: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: m.status === 'completed' ? '#059669' : '#D97706', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{m.name}</div>
                      {m.description && <div style={{ fontSize: 12, color: '#6B7280' }}>{m.description}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{m.dueDate ? new Date(m.dueDate).toLocaleDateString() : '—'}</div>
                    <span className={`badge ${m.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{m.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Team Members</div>
            {!project.team?.length ? (
              <div className="empty-state"><p>No team members assigned.</p></div>
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
                  <tbody>
                    {project.team.map(m => (
                      <tr key={m._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                              {m.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 500 }}>{m.name}</span>
                          </div>
                        </td>
                        <td>{m.email}</td>
                        <td><span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{m.role?.replace('_', ' ')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
