import React, { useState, useEffect, useCallback } from 'react';
import { invoiceService } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = { draft:'secondary', sent:'info', paid:'success', overdue:'danger', cancelled:'danger' };

function InvoiceModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ 'client.name':'', 'client.email':'', dueDate:'', notes:'' });
  const [items, setItems] = useState([{ description:'', quantity:1, unitPrice:0, taxRate:0, amount:0 }]);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      updated[i].amount = (parseFloat(updated[i].quantity)||0) * (parseFloat(updated[i].unitPrice)||0);
    }
    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await onSave({
        client: { name: form['client.name'], email: form['client.email'] },
        dueDate: form.dueDate, notes: form.notes,
        lineItems: items.map(i => ({ ...i, quantity: parseFloat(i.quantity)||0, unitPrice: parseFloat(i.unitPrice)||0, amount: parseFloat(i.amount)||0, taxRate: parseFloat(i.taxRate)||0 }))
      });
      onClose();
    } catch(err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const total = items.reduce((s,i) => s + (parseFloat(i.amount)||0) * (1 + (parseFloat(i.taxRate)||0)/100), 0);

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:680}}>
        <div className="modal-header"><h3>New Invoice</h3><button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer'}}>×</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
              <div className="form-group"><label className="form-label">Client Name</label><input className="form-control" value={form['client.name']} onChange={e=>setForm({...form,'client.name':e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Client Email</label><input className="form-control" type="email" value={form['client.email']} onChange={e=>setForm({...form,'client.email':e.target.value})} /></div>
            </div>
            <div className="form-group"><label className="form-label">Due Date</label><input className="form-control" type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} required /></div>
            <h4 style={{marginBottom:12,fontWeight:600}}>Line Items</h4>
            {items.map((item, i) => (
              <div key={i} style={{display:'grid',gridTemplateColumns:'3fr 1fr 1fr 1fr auto',gap:'0 8px',marginBottom:8,alignItems:'end'}}>
                <div className="form-group" style={{marginBottom:0}}>{i===0&&<label className="form-label">Description</label>}<input className="form-control" placeholder="Description" value={item.description} onChange={e=>updateItem(i,'description',e.target.value)} required /></div>
                <div className="form-group" style={{marginBottom:0}}>{i===0&&<label className="form-label">Qty</label>}<input className="form-control" type="number" min="0" value={item.quantity} onChange={e=>updateItem(i,'quantity',e.target.value)} /></div>
                <div className="form-group" style={{marginBottom:0}}>{i===0&&<label className="form-label">Unit Price</label>}<input className="form-control" type="number" min="0" step="0.01" value={item.unitPrice} onChange={e=>updateItem(i,'unitPrice',e.target.value)} /></div>
                <div className="form-group" style={{marginBottom:0}}>{i===0&&<label className="form-label">Tax %</label>}<input className="form-control" type="number" min="0" value={item.taxRate} onChange={e=>updateItem(i,'taxRate',e.target.value)} /></div>
                <button type="button" onClick={()=>setItems(items.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'var(--danger)',cursor:'pointer',paddingBottom:8,fontSize:18}}>×</button>
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={()=>setItems([...items,{description:'',quantity:1,unitPrice:0,taxRate:0,amount:0}])}>+ Add Item</button>
            <div style={{textAlign:'right',marginTop:16,fontSize:16,fontWeight:700}}>Total: ${total.toFixed(2)}</div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':'Create Invoice'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const { data } = await invoiceService.getAll(params);
      setInvoices(data.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    await invoiceService.create(data);
    toast.success('Invoice created!');
    load();
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await invoiceService.updateStatus(id, status);
      toast.success('Status updated');
      load();
    } catch { toast.error('Update failed'); }
  };

  const handleDownloadPDF = async (id, invNumber) => {
    try {
      const { data } = await invoiceService.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url; a.download = `invoice-${invNumber}.pdf`; a.click();
    } catch { toast.error('PDF generation failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
        <button className="btn btn-primary" onClick={()=>setShowModal(true)}>+ New Invoice</button>
      </div>
      <div className="card" style={{marginBottom:20}}>
        <div style={{display:'flex',gap:12}}>
          <select className="form-select" style={{maxWidth:160}} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['draft','sent','paid','overdue','cancelled'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="card">
        {loading ? <div className="loading">Loading...</div> : invoices.length === 0 ? (
          <div className="empty-state"><div style={{fontSize:48}}>🧾</div><p>No invoices found</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Invoice #</th><th>Client</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv._id}>
                  <td style={{fontWeight:600}}>{inv.invoiceNumber}</td>
                  <td>{inv.client?.name}</td>
                  <td style={{fontWeight:600}}>${inv.totalAmount?.toFixed(2)}</td>
                  <td style={{color:new Date(inv.dueDate)<new Date()&&inv.status!=='paid'?'var(--danger)':undefined}}>
                    {new Date(inv.dueDate).toLocaleDateString()}
                  </td>
                  <td><span className={`badge badge-${STATUS_COLORS[inv.status]}`}>{inv.status}</span></td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      {inv.status === 'draft' && <button className="btn btn-outline btn-sm" onClick={()=>handleStatusUpdate(inv._id,'sent')}>Send</button>}
                      {inv.status === 'sent' && <button className="btn btn-outline btn-sm" onClick={()=>handleStatusUpdate(inv._id,'paid')}>Mark Paid</button>}
                      <button className="btn btn-outline btn-sm" onClick={()=>handleDownloadPDF(inv._id, inv.invoiceNumber)}>PDF</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <InvoiceModal open={showModal} onClose={()=>setShowModal(false)} onSave={handleCreate} />
    </div>
  );
}

export default InvoicesPage;
