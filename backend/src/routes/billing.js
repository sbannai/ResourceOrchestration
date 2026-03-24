const express = require('express');
const router = express.Router();
const {
  getInvoices, createInvoice, generateInvoicePDF,
  updateInvoiceStatus, getRevenueSummary
} = require('../controllers/billingController');
const { protect, tenantIsolation, authorize } = require('../middleware/auth');

router.use(protect, tenantIsolation);

router.get('/revenue-summary', getRevenueSummary);
router.route('/').get(getInvoices).post(authorize('tenant_admin', 'project_manager'), createInvoice);
router.get('/:id/pdf', generateInvoicePDF);
router.patch('/:id/status', authorize('tenant_admin'), updateInvoiceStatus);

module.exports = router;
