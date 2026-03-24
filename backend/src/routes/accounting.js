const express = require('express');
const router = express.Router();
const { Account, JournalEntry } = require('../models/Accounting');
const { protect, tenantIsolation, authorize } = require('../middleware/auth');

router.use(protect, tenantIsolation);

// Chart of Accounts
router.get('/accounts', async (req, res, next) => {
  try {
    const accounts = await Account.find({ tenantId: req.tenantId, isActive: true }).sort({ accountCode: 1 });
    res.json(accounts);
  } catch (err) { next(err); }
});

router.post('/accounts', authorize('tenant_admin'), async (req, res, next) => {
  try {
    const account = await Account.create({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(account);
  } catch (err) { next(err); }
});

// Journal Entries
router.get('/journal', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await JournalEntry.countDocuments({ tenantId: req.tenantId });
    const entries = await JournalEntry.find({ tenantId: req.tenantId })
      .populate('createdBy', 'name')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ date: -1 });
    res.json({ entries, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

router.post('/journal', authorize('tenant_admin'), async (req, res, next) => {
  try {
    const entryCount = await JournalEntry.countDocuments({ tenantId: req.tenantId });
    const entryNumber = `JE-${new Date().getFullYear()}-${String(entryCount + 1).padStart(4, '0')}`;

    const totalDebit = req.body.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = req.body.lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ error: 'Journal entry must balance: debits must equal credits' });
    }

    const entry = await JournalEntry.create({
      ...req.body,
      tenantId: req.tenantId,
      entryNumber,
      totalDebit,
      totalCredit,
      createdBy: req.user._id,
    });
    res.status(201).json(entry);
  } catch (err) { next(err); }
});

// Ledger - account balance summary
router.get('/ledger', async (req, res, next) => {
  try {
    const accounts = await Account.find({ tenantId: req.tenantId, isActive: true }).sort({ accountCode: 1 });
    const ledger = accounts.map(acc => ({
      accountCode: acc.accountCode,
      name: acc.name,
      type: acc.type,
      category: acc.category,
      balance: acc.balance,
    }));
    res.json(ledger);
  } catch (err) { next(err); }
});

module.exports = router;
