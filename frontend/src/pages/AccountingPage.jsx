import React, { useState, useEffect } from 'react';
import api from '../services/api';

const typeBadge = { asset: 'badge-success', liability: 'badge-danger', equity: 'badge-purple', revenue: 'badge-primary', expense: 'badge-warning' };

export default function AccountingPage() {
  const [accounts, setAccounts] = useState([]);
  const [journal, setJournal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accounts');
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '', reference: '',
    lines: [
      { accountCode: '', accountName: '', debit: '', credit: '', description: '' },
      { accountCode: '', accountName: '', debit: '', credit: '', description: '' },
    ],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accRes, jrnRes] = await Promise.all([
        api.get('/accounting/accounts'),
        api.get('/accounting/journal'),
      ]);
      setAccounts(accRes.data);
      setJournal(jrnRes.data.entries || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateLine = (i, field, value) => {
    const lines = [...newEntry.lines];
    lines[i] = { ...lines[i], [field]: value };
    setNewEntry({ ...newEntry, lines });
  };

  const addLine = () => setNewEntry({
    ...newEntry,
    lines: [...newEntry.lines, { accountCode: '', accountName: '', debit: '', credit: '', description: '' }]
  });

  const totalDebit = newEntry.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = newEntry.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handlePostEntry = async (e) => {
    e.preventDefault();
    setError('');
    if (!isBalanced) { setError('Entry must balance: debits must equal credits'); return; }
    setSaving(true);
    try {
      await api.post('/accounting/journal', {
        date: newEntry.date,
        description: newEntry.description,
        reference: newEntry.reference,
        lines: newEntry.lines.map(l => ({ ...l, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })).filter(l => l.debit > 0 || l.credit > 0),
        status: 'posted',
      });
      setNewEntry({
        date: new Date().toISOString().slice(0, 10), description: '', reference: '',
        lines: [
          { accountCode: '', accountName: '', debit: '', credit: '', description: '' },
          { accountCode: '', accountName: '', debit: '', credit: '', description: '' },
        ],
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post entry');
    } finally {
      setSaving(false);
    }
  };

  // Group accounts by type
  const accountsByType = accounts.reduce((acc, a) => {
    if (!acc[a.type]) acc[a.type] = [];
    acc[a.type].push(a);
    return acc;
  }, {});

  const tabs = ['accounts', 'journal', 'new entry'];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Accounting</div>
          <div className="page-subtitle">Chart of Accounts, Journal & General Ledger</div>
        </div>
      </div>

      <div className="page-content">
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

        {loading ? (
          <div className="flex-center" style={{ height: 300 }}>
            <div className="spinner" style={{ width: 36, height: 36, borderTopColor: '#2563EB', borderWidth: 3 }} />
          </div>
        ) : activeTab === 'accounts' ? (
          <div>
            {Object.entries(accountsByType).map(([type, accs]) => (
              <div key={type} className="card" style={{ marginBottom: 16, padding: 0 }}>
                <div style={{ padding: '12px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className={`badge ${typeBadge[type] || 'badge-gray'}`} style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{type}</span>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>{accs.length} accounts</span>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Account Name</th>
                        <th>Category</th>
                        <th style={{ textAlign: 'right' }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accs.map(a => (
                        <tr key={a._id}>
                          <td><code style={{ fontSize: 12 }}>{a.accountCode}</code></td>
                          <td style={{ fontWeight: 500 }}>{a.name}</td>
                          <td style={{ fontSize: 12, color: '#6B7280' }}>{a.category}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: a.balance < 0 ? '#DC2626' : '#111827' }}>
                            ${Math.abs(a.balance).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'journal' ? (
          <div className="card" style={{ padding: 0 }}>
            {journal.length === 0 ? (
              <div className="empty-state"><h3>No journal entries yet</h3><p>Post your first journal entry to get started.</p></div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Entry #</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Reference</th>
                      <th style={{ textAlign: 'right' }}>Debit</th>
                      <th style={{ textAlign: 'right' }}>Credit</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journal.map(entry => (
                      <tr key={entry._id}>
                        <td><code style={{ fontSize: 12 }}>{entry.entryNumber}</code></td>
                        <td style={{ fontSize: 12 }}>{new Date(entry.date).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 500 }}>{entry.description}</td>
                        <td style={{ fontSize: 12, color: '#6B7280' }}>{entry.reference || '—'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>${(entry.totalDebit || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>${(entry.totalCredit || 0).toLocaleString()}</td>
                        <td>
                          <span className={`badge ${entry.status === 'posted' ? 'badge-success' : 'badge-gray'}`}>{entry.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            <div className="card-title" style={{ marginBottom: 20 }}>New Journal Entry</div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handlePostEntry}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-input" type="date" value={newEntry.date} onChange={e => setNewEntry({ ...newEntry, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Reference</label>
                  <input className="form-input" value={newEntry.reference} onChange={e => setNewEntry({ ...newEntry, reference: e.target.value })} placeholder="INV-001, PO-123..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input className="form-input" value={newEntry.description} onChange={e => setNewEntry({ ...newEntry, description: e.target.value })} required />
              </div>

              {/* Lines */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', marginBottom: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px 12px', background: '#F9FAFB', fontWeight: 600, fontSize: 12 }}>Account Code</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', background: '#F9FAFB', fontWeight: 600, fontSize: 12 }}>Account Name</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', background: '#F9FAFB', fontWeight: 600, fontSize: 12 }}>Description</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', background: '#F9FAFB', fontWeight: 600, fontSize: 12 }}>Debit</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', background: '#F9FAFB', fontWeight: 600, fontSize: 12 }}>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newEntry.lines.map((line, i) => (
                      <tr key={i}>
                        <td style={{ padding: '4px 8px' }}>
                          <input className="form-input" style={{ fontSize: 13 }} placeholder="1000" value={line.accountCode} onChange={e => updateLine(i, 'accountCode', e.target.value)} list="account-codes" />
                          <datalist id="account-codes">
                            {accounts.map(a => <option key={a.accountCode} value={a.accountCode}>{a.name}</option>)}
                          </datalist>
                        </td>
                        <td style={{ padding: '4px 8px' }}>
                          <input className="form-input" style={{ fontSize: 13 }} placeholder="Cash" value={line.accountName} onChange={e => updateLine(i, 'accountName', e.target.value)} />
                        </td>
                        <td style={{ padding: '4px 8px' }}>
                          <input className="form-input" style={{ fontSize: 13 }} value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} />
                        </td>
                        <td style={{ padding: '4px 8px' }}>
                          <input className="form-input" style={{ fontSize: 13, textAlign: 'right' }} type="number" min="0" step="0.01" value={line.debit} onChange={e => updateLine(i, 'debit', e.target.value)} />
                        </td>
                        <td style={{ padding: '4px 8px' }}>
                          <input className="form-input" style={{ fontSize: 13, textAlign: 'right' }} type="number" min="0" step="0.01" value={line.credit} onChange={e => updateLine(i, 'credit', e.target.value)} />
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: '#F9FAFB', fontWeight: 600 }}>
                      <td colSpan="3" style={{ padding: '10px 12px', fontSize: 13 }}>Totals</td>
                      <td style={{ textAlign: 'right', padding: '10px 12px', color: isBalanced ? '#059669' : '#DC2626' }}>${totalDebit.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px 12px', color: isBalanced ? '#059669' : '#DC2626' }}>${totalCredit.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {!isBalanced && totalDebit > 0 && (
                <div className="alert alert-error" style={{ marginBottom: 16 }}>
                  Entry is out of balance by ${Math.abs(totalDebit - totalCredit).toFixed(2)}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={addLine}>+ Add Line</button>
                <button type="submit" className="btn btn-primary" disabled={saving || !isBalanced}>
                  {saving ? <><span className="spinner" />Posting...</> : 'Post Journal Entry'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
