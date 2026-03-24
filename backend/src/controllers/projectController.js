const Project = require('../models/Project');
const logger = require('../config/logger');

exports.getProjects = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 10, search } = req.query;
    const query = { tenantId: req.tenantId };
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { projectNumber: { $regex: search, $options: 'i' } }];

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('projectManagerId', 'firstName lastName email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: projects, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate('team.userId', 'firstName lastName email role')
      .populate('projectManagerId', 'firstName lastName email');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (error) { next(error); }
};

exports.createProject = async (req, res, next) => {
  try {
    const projectCount = await Project.countDocuments({ tenantId: req.tenantId });
    const projectNumber = `PRJ-${String(projectCount + 1).padStart(5, '0')}`;
    const project = await Project.create({ ...req.body, tenantId: req.tenantId, projectNumber });
    logger.info(`Project created: ${projectNumber} for tenant: ${req.tenantId}`);
    res.status(201).json({ success: true, data: project });
  } catch (error) { next(error); }
};

exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (error) { next(error); }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) { next(error); }
};

exports.getKPIs = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const [total, active, completed, onHold] = await Promise.all([
      Project.countDocuments({ tenantId }),
      Project.countDocuments({ tenantId, status: 'active' }),
      Project.countDocuments({ tenantId, status: 'completed' }),
      Project.countDocuments({ tenantId, status: 'on_hold' })
    ]);

    const budgetAgg = await Project.aggregate([
      { $match: { tenantId } },
      { $group: { _id: null, totalBudget: { $sum: '$budget.totalBudget' }, totalSpent: { $sum: '$budget.spentAmount' } } }
    ]);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const avgCompletion = await Project.aggregate([
      { $match: { tenantId, status: 'active' } },
      { $group: { _id: null, avg: { $avg: '$completionPercentage' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalProjects: total, activeProjects: active, completedProjects: completed,
        onHoldProjects: onHold, completionRate,
        avgActiveCompletion: Math.round(avgCompletion[0]?.avg || 0),
        totalBudget: budgetAgg[0]?.totalBudget || 0,
        totalSpent: budgetAgg[0]?.totalSpent || 0,
        budgetUtilization: budgetAgg[0]?.totalBudget > 0 ? Math.round((budgetAgg[0].totalSpent / budgetAgg[0].totalBudget) * 100) : 0
      }
    });
  } catch (error) { next(error); }
};
