// server/models/Job.model.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [100, 'Job title cannot exceed 100 characters'],
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    requirements: [{ type: String }],
    skills: [{ type: String }],
    jobType: {
      type: String,
      // Use lowercase to match the CreateJob form values
      enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
      required: true,
    },
    location: {
      type: String,
      default: 'Remote',
    },
    salaryRange: {
      min:      { type: Number, default: 0 },
      max:      { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },
    applicationDeadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'draft'],
      default: 'open',
    },
    applicationCount: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: [
        'Engineering', 'Design', 'Marketing', 'Sales',
        'Finance', 'HR', 'Operations', 'Product', 'Other',
      ],
      default: 'Other',
    },
    experience: {
      type: String,
      // Match the CreateJob form values
      enum: ['entry', 'mid', 'senior', 'lead'],
      default: 'entry',
    },
    openings: {
      type: Number,
      default: 1,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Full-text search index ───────────────────────────────────────────────────
jobSchema.index({ title: 'text', description: 'text', skills: 'text', requirements: 'text' });

// ─── Compound indexes for common queries ──────────────────────────────────────
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ postedBy: 1, status: 1 });
jobSchema.index({ company: 1 });

// ─── Soft delete filter ───────────────────────────────────────────────────────
jobSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('Job', jobSchema);
