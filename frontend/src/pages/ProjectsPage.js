import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../services/api';
import toast from 'react-hot-toast';
import './ProjectsPage.css';

const STATUS_COLORS = { planning:'info', active:'success', on_hold:'warning', completed:'primary', cancelled:'danger' };
const TYPE_LABELS = { residential:'🏠 Residential', commercial:'🏢 Commercial', infrastructure:'🌉 Infrastructure', industrial:'🏭 Industrial', renovation:'🔧 Renovation' };

function ProjectModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ name:'', type:'residential', status:'planning', priority:'medium', 'client.name':'', 'timeline.plannedStart':'', 'timeline.plannedEnd':'', 'budget.totalBudget':'', description:'' });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const data = {
        name: form.name, type: form.type, status: form.status, priority: form.priority,
        description: form.description,
        client: { name: form['client.name'] },
        timeline: { plannedStart: form['timeline.plannedStart'], plannedEnd: form['timeline.plannedEnd'] },
        budget: { totalBudget: parseFloat(form['budget.totalBudget']) || 0 }
      };
      await onSave(data);
      onClose();
    } catch(err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const F = ({label, name, type='text', options}) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {options ? (
        <select className="form-select" value={form[name]} onChange={e=>setForm({...form,[name]:e.target.value})}>
          {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input className="form-control" type={type} value={form[name]} onChange={e=>setForm({...form,[name]:e.target.value})} required={['name','client.name','timeline.plannedStart','timeline.plannedEnd'].includes(name)} />
      )}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>New Project</h3><button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer'}}>×</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <F label="Project Name" name="name" />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
              <F label="Type" name="type" options={Object.entries(TYPE_LABELS).map(([v,l])=>({value:v,label:l}))} />
              <F label="Priority" name="priority" options={['low','medium','high','critical'].map(v=>({value:v,label:v.charAt(0).toUpperCase()+v.slice(1)}))} />
            </div>
            <F label="Client Name" name="client.name" />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
              <F label="Start Date" name="timeline.plannedStart" type="date" />
              <F label="End Date" name="timeline.plannedEnd" type="date" />
            </div>
            <F label="Total Budget ($)" name="budget.totalBudget" type="number" />
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page:1, total:0, pages:1 });
  const [filters, setFilters] = useState({ status:'', type:'', search:'', page:1 });
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([,v])=>v));
      const { data } = await projectService.getAll(params);
      setProjects(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    await projectService.create(data);
    toast.success('Project created!');
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button className="btn btn-primary" onClick={()=>setShowModal(true)}>+ New Project</button>
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="filters">
          <input className="form-control" placeholder="Search projects..." style={{maxWidth:240}}
            value={filters.search} onChange={e=>setFilters({...filters,search:e.target.value,page:1})} />
          <select className="form-select" style={{maxWidth:160}} value={filters.status}
            onChange={e=>setFilters({...filters,status:e.target.value,page:1})}>
            <option value="">All Statuses</option>
            {['planning','active','on_hold','completed','cancelled'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
          <select className="form-select" style={{maxWidth:160}} value={filters.type}
            onChange={e=>setFilters({...filters,type:e.target.value,page:1})}>
            <option value="">All Types</option>
            {Object.keys(TYPE_LABELS).map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading">Loading...</div> : projects.length === 0 ? (
          <div className="empty-state"><div style={{fontSize:48}}>🏗</div><p>No projects found</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Project</th><th>Client</th><th>Type</th><th>Status</th><th>Budget</th><th>Progress</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p._id}>
                  <td>
                    <div style={{fontWeight:600}}>{p.name}</div>
                    <div style={{fontSize:12,color:'var(--gray)'}}>{p.projectNumber}</div>
                  </td>
                  <td>{p.client?.name}</td>
                  <td><span style={{fontSize:13}}>{TYPE_LABELS[p.type] || p.type}</span></td>
                  <td><span className={`badge badge-${STATUS_COLORS[p.status]}`}>{p.status.replace('_',' ')}</span></td>
                  <td>${p.budget?.totalBudget?.toLocaleString() || 0}</td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,height:6,background:'#e9ecef',borderRadius:3}}>
                        <div style={{height:'100%',width:`${p.completionPercentage}%`,background:'var(--success)',borderRadius:3}} />
                      </div>
                      <span style={{fontSize:12,minWidth:30}}>{p.completionPercentage}%</span>
                    </div>
                  </td>
                  <td><Link to={`/projects/${p._id}`} className="btn btn-outline btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pagination.pages > 1 && (
          <div className="pagination">
            <button className="btn btn-outline btn-sm" disabled={filters.page <= 1} onClick={()=>setFilters({...filters,page:filters.page-1})}>‹ Prev</button>
            <span style={{fontSize:13}}>Page {pagination.page} of {pagination.pages}</span>
            <button className="btn btn-outline btn-sm" disabled={filters.page >= pagination.pages} onClick={()=>setFilters({...filters,page:filters.page+1})}>Next ›</button>
          </div>
        )}
      </div>

      <ProjectModal open={showModal} onClose={()=>setShowModal(false)} onSave={handleCreate} />
    </div>
  );
}

export default ProjectsPage;
