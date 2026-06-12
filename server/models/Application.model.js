// server/models/Application.model.js
const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'interview', 'offered', 'rejected'],
    },
    changedAt: { type: Date, default: Date.now },
    note: String,
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resumeUrl: {
      type: String,
      required: [true, 'Resume URL is required'],
    },
    coverLetter: {
      type: String,
      maxlength: [2000, 'Cover letter cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'interview', 'offered', 'rejected'],
      default: 'applied',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [{ status: 'applied' }],
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    isWithdrawn: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ─── Prevent duplicate applications ──────────────────────────────────────────
applicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

// ─── Quick lookup by applicant ────────────────────────────────────────────────
applicationSchema.index({ applicantId: 1, appliedAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
