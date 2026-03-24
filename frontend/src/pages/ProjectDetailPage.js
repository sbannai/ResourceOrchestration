import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = { planning:'info', active:'success', on_hold:'warning', completed:'primary', cancelled:'danger' };

function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    projectService.getById(id).then(({ data }) => setProject(data.data))
      .catch(() => { toast.error('Project not found'); navigate('/projects'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      const { data } = await projectService.update(id, { status });
      setProject(data.data);
      toast.success('Status updated');
    } catch { toast.error('Update failed'); }
    finally { setUpdating(false); }
  };

  const updateProgress = async (completionPercentage) => {
    try {
      const { data } = await projectService.update(id, { completionPercentage });
      setProject(data.data);
    } catch { toast.error('Update failed'); }
  };

  if (loading) return <div className="loading">Loading project...</div>;
  if (!project) return null;

  const budgetUsed = project.budget?.totalBudget > 0 ? Math.round((project.budget.spentAmount / project.budget.totalBudget) * 100) : 0;
  const daysLeft = project.timeline?.plannedEnd ? Math.ceil((new Date(project.timeline.plannedEnd) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-outline btn-sm" onClick={()=>navigate('/projects')} style={{marginBottom:8}}>← Back</button>
          <h1 className="page-title">{project.name}</h1>
          <p style={{color:'var(--gray)',fontSize:14}}>{project.projectNumber} • {project.type}</p>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span className={`badge badge-${STATUS_COLORS[project.status]}`} style={{fontSize:14,padding:'6px 14px'}}>{project.status.replace('_',' ')}</span>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20}}>
        <div>
          <div className="card" style={{marginBottom:16}}>
            <h3 style={{marginBottom:16,fontWeight:600}}>Project Overview</h3>
            {project.description && <p style={{color:'var(--gray)',marginBottom:16,fontSize:14}}>{project.description}</p>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div><div style={{fontSize:12,color:'var(--gray)'}}>Client</div><div style={{fontWeight:600,marginTop:4}}>{project.client?.name}</div></div>
              <div><div style={{fontSize:12,color:'var(--gray)'}}>Priority</div><div style={{fontWeight:600,marginTop:4,textTransform:'capitalize'}}>{project.priority}</div></div>
              <div><div style={{fontSize:12,color:'var(--gray)'}}>Start Date</div><div style={{fontWeight:600,marginTop:4}}>{project.timeline?.plannedStart ? new Date(project.timeline.plannedStart).toLocaleDateString() : '—'}</div></div>
              <div><div style={{fontSize:12,color:'var(--gray)'}}>End Date</div><div style={{fontWeight:600,marginTop:4}}>{project.timeline?.plannedEnd ? new Date(project.timeline.plannedEnd).toLocaleDateString() : '—'}</div></div>
            </div>
          </div>

          <div className="card" style={{marginBottom:16}}>
            <h3 style={{marginBottom:16,fontWeight:600}}>Completion Progress</h3>
            <div style={{marginBottom:8,display:'flex',justifyContent:'space-between'}}>
              <span style={{fontSize:14}}>Overall Progress</span>
              <span style={{fontWeight:700,fontSize:18}}>{project.completionPercentage}%</span>
            </div>
            <div style={{height:12,background:'#e9ecef',borderRadius:6,overflow:'hidden',marginBottom:12}}>
              <div style={{height:'100%',width:`${project.completionPercentage}%`,background:'var(--success)',borderRadius:6,transition:'width 0.5s'}} />
            </div>
            <input type="range" min="0" max="100" value={project.completionPercentage}
              onChange={e=>updateProgress(parseInt(e.target.value))} style={{width:'100%'}} />
          </div>

          {project.milestones?.length > 0 && (
            <div className="card">
              <h3 style={{marginBottom:16,fontWeight:600}}>Milestones</h3>
              {project.milestones.map((m,i) => (
                <div key={i} style={{display:'flex',gap:12,padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
                  <div style={{width:24,height:24,borderRadius:'50%',background:m.status==='completed'?'var(--success)':'#e9ecef',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:m.status==='completed'?'white':'var(--gray)',flexShrink:0}}>✓</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:500,fontSize:14}}>{m.name}</div>
                    {m.dueDate && <div style={{fontSize:12,color:'var(--gray)'}}>{new Date(m.dueDate).toLocaleDateString()}</div>}
                  </div>
                  <span className={`badge badge-${STATUS_COLORS[m.status] || 'secondary'}`}>{m.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{marginBottom:16}}>
            <h3 style={{marginBottom:16,fontWeight:600}}>Budget</h3>
            <div style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}>
                <span style={{color:'var(--gray)'}}>Total Budget</span>
                <span style={{fontWeight:700}}>${project.budget?.totalBudget?.toLocaleString() || 0}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}>
                <span style={{color:'var(--gray)'}}>Spent</span>
                <span style={{fontWeight:700}}>${project.budget?.spentAmount?.toLocaleString() || 0}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:12}}>
                <span style={{color:'var(--gray)'}}>Remaining</span>
                <span style={{fontWeight:700,color:'var(--success)'}}>${((project.budget?.totalBudget||0) - (project.budget?.spentAmount||0)).toLocaleString()}</span>
              </div>
              <div style={{height:8,background:'#e9ecef',borderRadius:4,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${Math.min(budgetUsed,100)}%`,background:budgetUsed>90?'var(--danger)':'var(--info)',borderRadius:4}} />
              </div>
              <div style={{fontSize:12,color:'var(--gray)',marginTop:4}}>{budgetUsed}% utilized</div>
            </div>
          </div>

          {daysLeft !== null && (
            <div className="card" style={{marginBottom:16,borderLeft:`4px solid ${daysLeft < 0 ? 'var(--danger)' : daysLeft < 30 ? 'var(--warning)' : 'var(--success)'}`}}>
              <div style={{fontSize:12,color:'var(--gray)'}}>Timeline</div>
              <div style={{fontSize:24,fontWeight:700,marginTop:4}}>{daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}</div>
            </div>
          )}

          <div className="card">
            <h3 style={{marginBottom:12,fontWeight:600}}>Update Status</h3>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {['planning','active','on_hold','completed','cancelled'].map(s => (
                <button key={s} className={`btn ${project.status===s ? 'btn-primary' : 'btn-outline'}`}
                  onClick={()=>s!==project.status&&updateStatus(s)} disabled={updating||project.status===s}>
                  {s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailPage;
