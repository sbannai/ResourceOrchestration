const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  status: { type: String, enum: ['provisioning', 'active', 'suspended', 'cancelled'], default: 'provisioning' },
  plan: { type: String, enum: ['starter', 'professional', 'enterprise'], default: 'starter' },
  industry: { type: String, default: 'construction' },
  address: {
    street: String, city: String, state: String, zip: String, country: { type: String, default: 'US' }
  },
  billing: {
    stripeCustomerId: String,
    subscriptionId: String,
    currentPeriodEnd: Date,
    invoiceEmail: String,
    usageCredits: { type: Number, default: 0 }
  },
  features: {
    projectManagement: { type: Boolean, default: true },
    financialManagement: { type: Boolean, default: true },
    documentManagement: { type: Boolean, default: true },
    analytics: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false }
  },
  settings: {
    timezone: { type: String, default: 'America/New_York' },
    currency: { type: String, default: 'USD' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' }
  },
  metadata: { type: Map, of: String }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
