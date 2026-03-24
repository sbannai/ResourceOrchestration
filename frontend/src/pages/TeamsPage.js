import React, { useState, useEffect } from 'react';
import { tenantService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ROLE_COLORS = { superadmin:'danger', tenant_admin:'primary', project_manager:'info', engineer:'success', accountant:'warning', viewer:'secondary' };

function TeamsPage() {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', role:'viewer' });

  const load = () => {
    tenantService.getUsers().then(({ data }) => setUsers(data.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await tenantService.inviteUser(form);
      toast.success('User invited successfully!');
      setShowModal(false);
      setForm({ firstName:'', lastName:'', email:'', role:'viewer' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to invite'); }
  };

  const toggleActive = async (userId, isActive) => {
    try {
      await tenantService.updateUser(userId, { isActive: !isActive });
      toast.success('User updated');
      load();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Team</h1>
        {hasRole('tenant_admin') && <button className="btn btn-primary" onClick={()=>setShowModal(true)}>+ Invite User</button>}
      </div>
      <div className="card">
        {loading ? <div className="loading">Loading...</div> : (
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th>{hasRole('tenant_admin')&&<th>Actions</th>}</tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:36,height:36,borderRadius:'50%',background:'var(--primary)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700}}>
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <div>
                        <div style={{fontWeight:600}}>{u.firstName} {u.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td><span className={`badge badge-${ROLE_COLORS[u.role]}`}>{u.role.replace('_',' ')}</span></td>
                  <td><span className={`badge badge-${u.isActive?'success':'danger'}`}>{u.isActive?'Active':'Inactive'}</span></td>
                  <td style={{color:'var(--gray)',fontSize:13}}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                  {hasRole('tenant_admin') && (
                    <td><button className={`btn btn-sm ${u.isActive?'btn-outline':'btn-primary'}`} onClick={()=>toggleActive(u._id, u.isActive)}>{u.isActive?'Deactivate':'Activate'}</button></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-header"><h3>Invite Team Member</h3><button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer'}}>×</button></div>
            <form onSubmit={handleInvite}>
              <div className="modal-body">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
                  <div className="form-group"><label className="form-label">First Name</label><input className="form-control" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Last Name</label><input className="form-control" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} required /></div>
                </div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                    {['project_manager','engineer','accountant','viewer'].map(r=><option key={r} value={r}>{r.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamsPage;
