const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice');
const logger = require('../utils/logger');

const generateInvoiceNumber = (tenantId) => {
  const date = new Date();
  const prefix = 'INV';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}${month}-${random}`;
};

exports.getInvoices = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { tenantId: req.tenantId };
    if (status) query.status = status;

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('projectId', 'name projectCode')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({
      invoices,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

exports.createInvoice = async (req, res, next) => {
  try {
    const invoiceNumber = generateInvoiceNumber(req.tenantId);

    // Calculate totals
    const items = req.body.items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice * (1 + (item.taxRate || 0) / 100),
    }));

    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const taxAmount = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice * (i.taxRate || 0) / 100), 0);
    const totalAmount = subtotal + taxAmount;

    const invoice = await Invoice.create({
      ...req.body,
      tenantId: req.tenantId,
      invoiceNumber,
      items,
      subtotal,
      taxAmount,
      totalAmount,
    });

    logger.info(`Invoice ${invoiceNumber} created for tenant ${req.tenantId}`);
    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
};

exports.generateInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate('projectId', 'name projectCode');

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(24).fillColor('#2563EB').text('Construction ERP', 50, 50);
    doc.fontSize(10).fillColor('#6B7280').text('Enterprise Construction Management Platform', 50, 80);

    // Invoice title
    doc.fontSize(20).fillColor('#111827').text('INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(10).fillColor('#6B7280')
      .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 80, { align: 'right' })
      .text(`Issued: ${new Date(invoice.issuedDate).toLocaleDateString()}`, 400, 95, { align: 'right' })
      .text(`Due: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`, 400, 110, { align: 'right' });

    // Divider
    doc.moveTo(50, 130).lineTo(550, 130).strokeColor('#E5E7EB').stroke();

    // Bill to
    doc.fontSize(10).fillColor('#6B7280').text('BILL TO:', 50, 150);
    doc.fontSize(12).fillColor('#111827').text(invoice.client.name, 50, 165);
    if (invoice.client.email) doc.fontSize(10).fillColor('#6B7280').text(invoice.client.email, 50, 180);
    if (invoice.client.address) doc.text(invoice.client.address, 50, 195);

    // Items table header
    const tableTop = 240;
    doc.fontSize(10).fillColor('#FFFFFF');
    doc.rect(50, tableTop, 500, 20).fill('#2563EB');
    doc.text('Description', 60, tableTop + 5);
    doc.text('Qty', 300, tableTop + 5);
    doc.text('Unit Price', 360, tableTop + 5);
    doc.text('Total', 480, tableTop + 5);

    // Items
    let y = tableTop + 25;
    invoice.items.forEach((item, i) => {
      if (i % 2 === 0) doc.rect(50, y - 5, 500, 20).fill('#F9FAFB');
      doc.fillColor('#111827').fontSize(10)
        .text(item.description, 60, y, { width: 230 })
        .text(item.quantity.toString(), 300, y)
        .text(`$${item.unitPrice.toFixed(2)}`, 360, y)
        .text(`$${item.total.toFixed(2)}`, 480, y);
      y += 25;
    });

    // Totals
    doc.moveTo(350, y + 10).lineTo(550, y + 10).strokeColor('#E5E7EB').stroke();
    y += 20;
    doc.fontSize(10).fillColor('#6B7280')
      .text('Subtotal:', 380, y).fillColor('#111827').text(`$${invoice.subtotal.toFixed(2)}`, 480, y);
    y += 18;
    doc.fillColor('#6B7280').text('Tax:', 380, y).fillColor('#111827').text(`$${invoice.taxAmount.toFixed(2)}`, 480, y);
    y += 18;
    doc.fontSize(12).fillColor('#2563EB').text('Total:', 380, y).text(`$${invoice.totalAmount.toFixed(2)}`, 480, y);

    // Status badge
    y += 40;
    const statusColor = { paid: '#059669', sent: '#2563EB', overdue: '#DC2626', draft: '#6B7280' }[invoice.status] || '#6B7280';
    doc.fontSize(10).fillColor(statusColor).text(`Status: ${invoice.status.toUpperCase()}`, 50, y);

    if (invoice.notes) {
      y += 30;
      doc.fontSize(10).fillColor('#6B7280').text('Notes:', 50, y);
      doc.fillColor('#111827').text(invoice.notes, 50, y + 15, { width: 500 });
    }

    doc.end();
  } catch (err) {
    next(err);
  }
};

exports.updateInvoiceStatus = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { status: req.body.status, ...(req.body.status === 'paid' && { paidDate: new Date() }) },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

exports.getRevenueSummary = async (req, res, next) => {
  try {
    const summary = await Invoice.aggregate([
      { $match: { tenantId: req.tenantId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' },
        },
      },
    ]);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};
