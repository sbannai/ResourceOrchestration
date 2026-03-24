import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const statusBadge = { draft: 'badge-gray', sent: 'badge-primary', paid: 'badge-success', overdue: 'badge-danger', cancelled: 'badge-gray' };

function InvoiceModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({
    'client.name': '', 'client.email': '', notes: '',
    dueDate: '', items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0 }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, value) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: field === 'description' ? value : Number(value) };
    setForm({ ...form, items });
  };

  const subtotal = form.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = form.items.reduce((s, i) => s + i.quantity * i.unitPrice * (i.taxRate / 100), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/billing', {
        client: { name: form['client.name'], email: form['client.email'] },
        items: form.items,
        dueDate: form.dueDate,
        notes: form.notes,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div className="modal-title">New Invoice</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6B7280' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Client Name *</label>
                <input className="form-input" value={form['client.name']} onChange={e => setForm({ ...form, 'client.name': e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Client Email</label>
                <input className="form-input" type="email" value={form['client.email']} onChange={e => setForm({ ...form, 'client.email': e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label className="form-label" style={{ margin: 0 }}>Invoice Items</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>
              </div>
              {form.items.map((item, i) => (
                <div key={i} style={{ background: '#F9FAFB', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div className="form-group">
                    <input className="form-input" placeholder="Description *" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 11 }}>Qty</label>
                      <input className="form-input" type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: 11 }}>Unit Price ($)</label>
                      <input className="form-input" type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: 11 }}>Tax Rate (%)</label>
                      <input className="form-input" type="number" min="0" max="100" value={item.taxRate} onChange={e => updateItem(i, 'taxRate', e.target.value)} />
                    </div>
                    <button type="button" onClick={() => removeItem(i)} className="btn btn-danger btn-sm" disabled={form.items.length === 1}>✕</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 16, textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Subtotal: <strong>${subtotal.toFixed(2)}</strong></div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Tax: <strong>${tax.toFixed(2)}</strong></div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Total: ${(subtotal + tax).toFixed(2)}</div>
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" />Creating...</> : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 20, ...(statusFilter && { status: statusFilter }) });
      const [invRes, sumRes] = await Promise.all([
        api.get(`/billing?${params}`),
        api.get('/billing/revenue-summary'),
      ]);
      setInvoices(invRes.data.invoices);
      setPagination(invRes.data.pagination);
      setSummary(sumRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (id, status) => {
    await api.patch(`/billing/${id}/status`, { status });
    fetchData();
  };

  const handleDownloadPDF = (id) => {
    window.open(`/api/billing/${id}/pdf`, '_blank');
  };

  const getSummaryValue = (status) => {
    const item = summary.find(s => s._id === status);
    return item ? item.total : 0;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Billing & Invoices</div>
          <div className="page-subtitle">{pagination.total} total invoices</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ New Invoice</button>
        </div>
      </div>

      <div className="page-content">
        {/* Revenue summary */}
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Paid', value: getSummaryValue('paid'), color: '#059669', prefix: '$' },
            { label: 'Pending / Sent', value: getSummaryValue('sent'), color: '#2563EB', prefix: '$' },
            { label: 'Overdue', value: getSummaryValue('overdue'), color: '#DC2626', prefix: '$' },
            { label: 'Draft', value: getSummaryValue('draft'), color: '#6B7280', prefix: '$' },
          ].map(item => (
            <div key={item.label} className="kpi-card">
              <div className="kpi-label">{item.label}</div>
              <div className="kpi-value" style={{ color: item.color, fontSize: 22 }}>
                {item.prefix}{item.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <select className="form-select" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {['draft', 'sent', 'paid', 'overdue', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div className="flex-center" style={{ height: 300 }}>
              <div className="spinner" style={{ width: 36, height: 36, borderTopColor: '#2563EB', borderWidth: 3 }} />
            </div>
          ) : invoices.length === 0 ? (
            <div className="empty-state"><h3>No invoices yet</h3><p>Create your first invoice to start tracking revenue.</p></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Issued</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv._id}>
                      <td><code style={{ fontSize: 12 }}>{inv.invoiceNumber}</code></td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{inv.client?.name}</div>
                        {inv.client?.email && <div style={{ fontSize: 11, color: '#6B7280' }}>{inv.client.email}</div>}
                      </td>
                      <td><span className={`badge ${statusBadge[inv.status] || 'badge-gray'}`}>{inv.status}</span></td>
                      <td style={{ fontWeight: 600 }}>${inv.totalAmount.toLocaleString()}</td>
                      <td style={{ fontSize: 12 }}>{new Date(inv.issuedDate).toLocaleDateString()}</td>
                      <td style={{ fontSize: 12, color: inv.status === 'overdue' ? '#DC2626' : 'inherit' }}>
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadPDF(inv._id)}>📄 PDF</button>
                          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                            <select
                              className="form-select"
                              style={{ fontSize: 12, padding: '4px 8px', width: 100 }}
                              value={inv.status}
                              onChange={e => handleStatusChange(inv._id, e.target.value)}
                            >
                              {['draft', 'sent', 'paid', 'overdue', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <InvoiceModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchData} />
    </div>
  );
}
