const mongoose = require('mongoose');

// Chart of Accounts
const accountSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  accountCode: { type: String, required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
    required: true,
  },
  category: String,
  balance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

accountSchema.index({ tenantId: 1, accountCode: 1 }, { unique: true });

// Journal Entry
const journalEntrySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  entryNumber: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  reference: String,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  lines: [{
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    accountCode: String,
    accountName: String,
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    description: String,
  }],
  totalDebit: Number,
  totalCredit: Number,
  status: { type: String, enum: ['draft', 'posted', 'reversed'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

journalEntrySchema.index({ tenantId: 1, date: -1 });

const Account = mongoose.model('Account', accountSchema);
const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);

module.exports = { Account, JournalEntry };
