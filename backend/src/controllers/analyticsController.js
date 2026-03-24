const Project = require('../models/Project');
const Invoice = require('../models/Invoice');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [projectStats, invoiceStats, monthlyRevenue, projectsByType, projectsByStatus] = await Promise.all([
      Project.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$status', count: { $sum: 1 }, totalBudget: { $sum: '$budget.totalBudget' } } }
      ]),
      Invoice.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
      ]),
      Invoice.aggregate([
        { $match: { tenantId, status: 'paid', paidDate: { $gte: firstOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Project.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Project.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrend = await Invoice.aggregate([
      { $match: { tenantId, status: 'paid', paidDate: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$paidDate' }, month: { $month: '$paidDate' } }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: { projectStats, invoiceStats, monthlyRevenue: monthlyRevenue[0]?.total || 0, projectsByType, projectsByStatus, monthlyTrend }
    });
  } catch (error) { next(error); }
};
