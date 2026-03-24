const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { Account } = require('../models/Accounting');
const logger = require('../utils/logger');

const DEFAULT_CHART_OF_ACCOUNTS = [
  { accountCode: '1000', name: 'Cash', type: 'asset', category: 'Current Assets' },
  { accountCode: '1100', name: 'Accounts Receivable', type: 'asset', category: 'Current Assets' },
  { accountCode: '1500', name: 'Equipment', type: 'asset', category: 'Fixed Assets' },
  { accountCode: '2000', name: 'Accounts Payable', type: 'liability', category: 'Current Liabilities' },
  { accountCode: '2100', name: 'Payroll Payable', type: 'liability', category: 'Current Liabilities' },
  { accountCode: '3000', name: 'Owner Equity', type: 'equity', category: 'Equity' },
  { accountCode: '4000', name: 'Contract Revenue', type: 'revenue', category: 'Revenue' },
  { accountCode: '4100', name: 'Change Order Revenue', type: 'revenue', category: 'Revenue' },
  { accountCode: '5000', name: 'Direct Labor', type: 'expense', category: 'Direct Costs' },
  { accountCode: '5100', name: 'Materials', type: 'expense', category: 'Direct Costs' },
  { accountCode: '5200', name: 'Subcontractors', type: 'expense', category: 'Direct Costs' },
  { accountCode: '6000', name: 'Office Expenses', type: 'expense', category: 'Operating Expenses' },
];

exports.provisionTenant = async (req, res, next) => {
  try {
    const { tenantName, adminEmail, adminName, adminPassword, plan = 'starter' } = req.body;

    // Generate unique slug
    const slug = tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const existingTenant = await Tenant.findOne({ slug });
    if (existingTenant) {
      return res.status(400).json({ error: 'Tenant slug already exists. Please choose a different name.' });
    }

    // Create tenant in provisioning state
    const tenant = await Tenant.create({
      name: tenantName,
      slug,
      adminEmail,
      plan,
      status: 'provisioning',
      features: getPlanFeatures(plan),
    });

    logger.info(`Tenant provisioning started: ${tenant.slug}`);

    // Create admin user
    const adminUser = await User.create({
      tenantId: tenant._id,
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'tenant_admin',
      isActive: true,
    });

    // Initialize billing hook
    await initializeBilling(tenant, plan);

    // Initialize chart of accounts
    await initializeChartOfAccounts(tenant._id);

    // Activate tenant
    tenant.status = 'active';
    tenant.usageStats.activeUsers = 1;
    await tenant.save();

    logger.info(`Tenant provisioned successfully: ${tenant.slug}`);

    res.status(201).json({
      message: 'Tenant provisioned successfully',
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        plan: tenant.plan,
      },
      admin: {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getPlanFeatures = (plan) => {
  const plans = {
    starter: { maxUsers: 5, maxProjects: 10, analyticsEnabled: true, billingEnabled: false, advancedReporting: false },
    professional: { maxUsers: 25, maxProjects: 100, analyticsEnabled: true, billingEnabled: true, advancedReporting: false },
    enterprise: { maxUsers: -1, maxProjects: -1, analyticsEnabled: true, billingEnabled: true, advancedReporting: true },
  };
  return plans[plan] || plans.starter;
};

const initializeBilling = async (tenant, plan) => {
  // Stripe integration placeholder
  logger.info(`Billing initialized for tenant: ${tenant.slug}, plan: ${plan}`);
  return true;
};

const initializeChartOfAccounts = async (tenantId) => {
  const accounts = DEFAULT_CHART_OF_ACCOUNTS.map(acc => ({ ...acc, tenantId }));
  await Account.insertMany(accounts);
  logger.info(`Chart of accounts initialized for tenant: ${tenantId}`);
};

exports.getTenantStatus = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ status: tenant.status, provisioned: tenant.status === 'active' });
  } catch (err) {
    next(err);
  }
};
