const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  dueDate: Date,
  completedDate: Date,
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'delayed'], default: 'pending' },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 }
});

const projectSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  projectNumber: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['residential', 'commercial', 'infrastructure', 'industrial', 'renovation'], required: true },
  status: { type: String, enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'], default: 'planning' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  client: {
    name: { type: String, required: true },
    email: String,
    phone: String,
    address: String
  },
  location: {
    address: String, city: String, state: String, zip: String, coordinates: { lat: Number, lng: Number }
  },
  timeline: {
    plannedStart: { type: Date, required: true },
    plannedEnd: { type: Date, required: true },
    actualStart: Date,
    actualEnd: Date
  },
  budget: {
    totalBudget: { type: Number, required: true, min: 0 },
    spentAmount: { type: Number, default: 0 },
    contingency: { type: Number, default: 0 }
  },
  team: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    assignedAt: { type: Date, default: Date.now }
  }],
  milestones: [milestoneSchema],
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  tags: [String],
  projectManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  documents: [{ name: String, url: String, type: String, uploadedAt: Date }]
}, { timestamps: true });

projectSchema.index({ tenantId: 1, status: 1 });
projectSchema.index({ tenantId: 1, projectNumber: 1 }, { unique: true });

module.exports = mongoose.model('Project', projectSchema);
