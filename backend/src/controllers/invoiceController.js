const Invoice = require('../models/Invoice');
const PDFDocument = require('pdfkit');

exports.getInvoices = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { tenantId: req.tenantId };
    if (status) query.status = status;
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, data: invoices, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) { next(error); }
};

exports.createInvoice = async (req, res, next) => {
  try {
    const count = await Invoice.countDocuments({ tenantId: req.tenantId });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    const { lineItems } = req.body;
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = lineItems.reduce((sum, item) => sum + (item.amount * (item.taxRate / 100)), 0);
    const totalAmount = subtotal + taxAmount;
    const invoice = await Invoice.create({ ...req.body, tenantId: req.tenantId, invoiceNumber, subtotal, taxAmount, totalAmount });
    res.status(201).json({ success: true, data: invoice });
  } catch (error) { next(error); }
};

exports.updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === 'paid') update.paidDate = new Date();
    const invoice = await Invoice.findOneAndUpdate({ _id: req.params.id, tenantId: req.tenantId }, update, { new: true });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) { next(error); }
};

exports.generatePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);

    doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', 50, 50);
    doc.fontSize(10).font('Helvetica').text(`Invoice #: ${invoice.invoiceNumber}`, 50, 90);
    doc.text(`Date: ${invoice.issueDate.toLocaleDateString()}`, 50, 105);
    doc.text(`Due: ${invoice.dueDate.toLocaleDateString()}`, 50, 120);
    doc.moveTo(50, 145).lineTo(550, 145).stroke();

    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, 160);
    doc.font('Helvetica').text(invoice.client.name, 50, 178);
    if (invoice.client.email) doc.text(invoice.client.email, 50, 193);

    doc.font('Helvetica-Bold').text('Description', 50, 240).text('Qty', 300, 240).text('Price', 370, 240).text('Amount', 470, 240);
    doc.moveTo(50, 258).lineTo(550, 258).stroke();

    let y = 270;
    invoice.lineItems.forEach(item => {
      doc.font('Helvetica').text(item.description, 50, y).text(item.quantity.toString(), 300, y)
        .text(`$${item.unitPrice.toFixed(2)}`, 370, y).text(`$${item.amount.toFixed(2)}`, 470, y);
      y += 20;
    });

    doc.moveTo(50, y + 10).lineTo(550, y + 10).stroke();
    doc.text('Subtotal:', 370, y + 20).text(`$${invoice.subtotal.toFixed(2)}`, 470, y + 20);
    doc.text('Tax:', 370, y + 35).text(`$${invoice.taxAmount.toFixed(2)}`, 470, y + 35);
    doc.font('Helvetica-Bold').text('Total:', 370, y + 55).text(`$${invoice.totalAmount.toFixed(2)}`, 470, y + 55);
    doc.end();
  } catch (error) { next(error); }
};
