const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 0 },
  amount: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  invoiceNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'], default: 'draft' },
  client: {
    name: { type: String, required: true },
    email: String,
    address: String
  },
  lineItems: [lineItemSchema],
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  paidDate: Date,
  notes: String,
  pdfUrl: String
}, { timestamps: true });

invoiceSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
