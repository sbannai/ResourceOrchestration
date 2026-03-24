import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { tenantService } from '../services/api';
import toast from 'react-hot-toast';

function SettingsPage() {
  const { tenant } = useAuth();
  const [form, setForm] = useState({ name: tenant?.name || '', settings: { timezone: tenant?.settings?.timezone || 'America/New_York', currency: tenant?.settings?.currency || 'USD' } });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await tenantService.update(form);
      toast.success('Settings saved!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Settings</h1></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div className="card">
          <h3 style={{marginBottom:20,fontWeight:600}}>Company Settings</h3>
          <form onSubmit={handleSave}>
            <div className="form-group"><label className="form-label">Company Name</label><input className="form-control" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select className="form-select" value={form.settings.timezone} onChange={e=>setForm({...form,settings:{...form.settings,timezone:e.target.value}})}>
                {['America/New_York','America/Chicago','America/Denver','America/Los_Angeles','UTC'].map(tz=><option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={form.settings.currency} onChange={e=>setForm({...form,settings:{...form.settings,currency:e.target.value}})}>
                {['USD','EUR','GBP','CAD','AUD'].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':'Save Changes'}</button>
          </form>
        </div>
        <div className="card">
          <h3 style={{marginBottom:20,fontWeight:600}}>Subscription</h3>
          <div style={{padding:'16px',background:'#f8f9fa',borderRadius:8,marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:18,textTransform:'capitalize'}}>{tenant?.plan || 'Starter'} Plan</div>
            <div style={{color:'var(--gray)',fontSize:13,marginTop:4}}>Status: <span style={{color:'var(--success)',fontWeight:600,textTransform:'capitalize'}}>{tenant?.status}</span></div>
          </div>
          <div style={{fontSize:14,color:'var(--gray)',marginBottom:16}}>
            <div style={{marginBottom:8}}>✅ Project Management</div>
            <div style={{marginBottom:8}}>✅ Financial Management</div>
            <div style={{marginBottom:8}}>✅ Document Management</div>
            <div style={{marginBottom:8,color:tenant?.features?.analytics?'inherit':'#ccc'}}>📊 Advanced Analytics {tenant?.features?.analytics?'':'(Upgrade)'}</div>
            <div style={{color:tenant?.features?.apiAccess?'inherit':'#ccc'}}>🔌 API Access {tenant?.features?.apiAccess?'':'(Upgrade)'}</div>
          </div>
          <button className="btn btn-secondary">Upgrade Plan</button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
