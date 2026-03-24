const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const logger = require('../config/logger');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '15m' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' });
  return { accessToken, refreshToken };
};

exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, companyName } = req.body;

    // Create tenant
    const slug = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    const tenant = await Tenant.create({ name: companyName, slug, status: 'provisioning' });

    // Create admin user
    const user = await User.create({ tenantId: tenant._id, firstName, lastName, email, password, role: 'tenant_admin' });

    // Provision tenant
    tenant.status = 'active';
    await tenant.save();

    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: { token: refreshToken, createdAt: new Date() } }, lastLogin: new Date() });

    logger.info(`New tenant registered: ${tenant.slug}, user: ${email}`);
    res.status(201).json({ success: true, data: { user, tenant, accessToken, refreshToken } });
  } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account suspended' });

    const tenant = await Tenant.findById(user.tenantId);
    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: { token: refreshToken, createdAt: new Date() } },
      lastLogin: new Date()
    });

    logger.info(`User logged in: ${email}`);
    res.json({ success: true, data: { user, tenant, accessToken, refreshToken } });
  } catch (error) { next(error); }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    if (!tokenExists) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, {
      $pull: { refreshTokens: { token: refreshToken } },
      $push: { refreshTokens: { token: newRefreshToken, createdAt: new Date() } }
    });

    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch (error) { next(error); }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, { $pull: { refreshTokens: { token: refreshToken } } });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) { next(error); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('tenantId');
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};
