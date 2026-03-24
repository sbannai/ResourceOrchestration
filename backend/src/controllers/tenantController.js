const Tenant = require('../models/Tenant');
const User = require('../models/User');

exports.getTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    res.json({ success: true, data: tenant });
  } catch (error) { next(error); }
};

exports.updateTenant = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'address', 'settings'];
    const updates = {};
    allowedFields.forEach(field => { if (req.body[field]) updates[field] = req.body[field]; });
    const tenant = await Tenant.findByIdAndUpdate(req.tenantId, updates, { new: true, runValidators: true });
    res.json({ success: true, data: tenant });
  } catch (error) { next(error); }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ tenantId: req.tenantId }).select('-password -refreshTokens');
    res.json({ success: true, data: users });
  } catch (error) { next(error); }
};

exports.inviteUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });
    const tempPassword = Math.random().toString(36).slice(-8);
    const user = await User.create({ tenantId: req.tenantId, firstName, lastName, email, password: tempPassword, role });
    res.status(201).json({ success: true, data: user, message: 'User invited. Temporary password sent.' });
  } catch (error) { next(error); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.userId, tenantId: req.tenantId },
      { role, isActive },
      { new: true }
    ).select('-password -refreshTokens');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

// Superadmin only
exports.getAllTenants = async (req, res, next) => {
  try {
    const tenants = await Tenant.find().sort('-createdAt');
    res.json({ success: true, data: tenants });
  } catch (error) { next(error); }
};

exports.provisionTenant = async (req, res, next) => {
  try {
    const { name, adminEmail, adminFirstName, adminLastName, plan } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const tenant = await Tenant.create({ name, slug, plan: plan || 'starter', status: 'provisioning' });
    const tempPassword = Math.random().toString(36).slice(-10);
    await User.create({ tenantId: tenant._id, firstName: adminFirstName, lastName: adminLastName, email: adminEmail, password: tempPassword, role: 'tenant_admin' });
    tenant.status = 'active';
    await tenant.save();
    res.status(201).json({ success: true, data: tenant, message: `Tenant provisioned. Admin password: ${tempPassword}` });
  } catch (error) { next(error); }
};
