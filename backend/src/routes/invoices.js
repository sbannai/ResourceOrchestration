const express = require('express');
const router = express.Router();
const { getInvoices, createInvoice, updateInvoiceStatus, generatePDF } = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getInvoices);
router.post('/', authorize('tenant_admin', 'accountant'), createInvoice);
router.put('/:id/status', authorize('tenant_admin', 'accountant'), updateInvoiceStatus);
router.get('/:id/pdf', generatePDF);

module.exports = router;
