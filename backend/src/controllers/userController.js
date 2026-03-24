const User = require('../models/User');
const Tenant = require('../models/Tenant');

exports.getUsers = async (req, res, next) => {
  try {
    const { role, isActive, page = 1, limit = 10, search } = req.query;
    const query = { tenantId: req.tenantId };

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({
      users,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    // Check tenant user limit
    const tenant = req.tenant;
    if (tenant.features.maxUsers > 0) {
      const userCount = await User.countDocuments({ tenantId: req.tenantId, isActive: true });
      if (userCount >= tenant.features.maxUsers) {
        return res.status(403).json({ error: `User limit of ${tenant.features.maxUsers} reached for your plan` });
      }
    }

    const user = await User.create({ ...req.body, tenantId: req.tenantId });
    await Tenant.findByIdAndUpdate(req.tenantId, { $inc: { 'usageStats.activeUsers': 1 } });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { password, ...updates } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      updates,
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { isActive: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    await Tenant.findByIdAndUpdate(req.tenantId, { $inc: { 'usageStats.activeUsers': -1 } });
    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    next(err);
  }
};
