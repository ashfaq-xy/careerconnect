// server/controllers/application.controller.js
// PRD v2 compliance:
//   FR-APP-01 — validates job exists, open, deadline, not duplicate; emits new_notification
//   FR-APP-04 — valid statuses: reviewing|shortlisted|interview|offered|rejected; 400 on invalid
//   FR-APP-05 — only applicant can withdraw; decrements applicationCount

const Application = require('../models/Application.model');
const Job         = require('../models/Job.model');
const Notification = require('../models/Notification.model');

// PRD v2 FR-APP-04 — recruiter can set these statuses
const RECRUITER_STATUSES = ['reviewing', 'shortlisted', 'interview', 'offered', 'rejected'];

// ─── Apply for Job ────────────────────────────────────────────────────────────
exports.applyForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { resumeUrl, coverLetter } = req.body;

    const job = await Job.findById(jobId).populate('postedBy', '_id firstName');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    // PRD v2 FR-APP-01 AC — closed job → 400
    if (job.status !== 'open') {
      return res.status(400).json({ success: false, message: 'This job is no longer accepting applications.' });
    }

    // PRD v2 FR-APP-01 AC — past deadline → 400
    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      return res.status(400).json({ success: false, message: 'Application deadline has passed.' });
    }

    const existing = await Application.findOne({ jobId, applicantId: req.user._id });
    // PRD v2 FR-APP-01 AC — duplicate → 409
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already applied for this job.' });
    }

    const application = await Application.create({
      jobId,
      applicantId: req.user._id,
      resumeUrl:   resumeUrl || req.user.resumeUrl || '',
      coverLetter,
    });

    // Atomic increment — PRD v2 FR-APP-05 uses $inc to decrement on withdraw
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

    // In-DB notification for recruiter
    const notification = await Notification.create({
      recipient: job.postedBy._id,
      type:      'APPLICATION_RECEIVED',
      title:     'New Application Received',
      message:   `${req.user.firstName} applied for "${job.title}"`,
      data:      { jobId, applicationId: application._id },
    });

    // PRD v2 §6.3 — emit new_notification to recruiter's private room
    const io = req.app.get('io');
    io.to(job.postedBy._id.toString()).emit('new_notification', notification);

    res.status(201).json({ success: true, application });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already applied for this job.' });
    }
    next(err);
  }
};

// ─── Get My Applications (Job Seeker) ────────────────────────────────────────
exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({
      applicantId: req.user._id,
      isWithdrawn: false,
    })
      .populate({
        path:     'jobId',
        select:   'title location jobType status',
        populate: { path: 'company', select: 'name logo' },
      })
      .sort({ appliedAt: -1 })
      .lean();

    res.json({ success: true, applications });
  } catch (err) {
    next(err);
  }
};

// ─── Get Applicants for a Job (Recruiter / Admin) ────────────────────────────
exports.getJobApplicants = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    // PRD v2 FR-APP-03 AC — non-owner recruiter → 403
    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { jobId, isWithdrawn: false };
    if (status) query.status = status;

    const applications = await Application.find(query)
      .populate('applicantId', 'firstName lastName email profilePicture')
      .sort({ appliedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Application.countDocuments(query);
    res.json({ success: true, total, applications });
  } catch (err) {
    next(err);
  }
};

// ─── Update Application Status (Recruiter) ───────────────────────────────────
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    // PRD v2 FR-APP-04 AC — invalid status → 400
    if (!RECRUITER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${RECRUITER_STATUSES.join(', ')}`,
      });
    }

    const application = await Application.findById(req.params.id).populate('jobId');
    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });

    if (application.jobId.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    application.status = status;
    application.statusHistory.push({ status, note, changedAt: new Date() });
    await application.save();

    // PRD v2 FR-APP-04 AC — seeker receives real-time notification on status change
    const notification = await Notification.create({
      recipient: application.applicantId,
      type:      'STATUS_UPDATE',
      title:     'Application Status Updated',
      message:   `Your application for "${application.jobId.title}" is now: ${status}`,
      data:      { applicationId: application._id, status },
    });

    const io = req.app.get('io');
    io.to(application.applicantId.toString()).emit('new_notification', notification);

    res.json({ success: true, application });
  } catch (err) {
    next(err);
  }
};

// ─── Withdraw Application (Job Seeker) ────────────────────────────────────────
exports.withdrawApplication = async (req, res, next) => {
  try {
    // PRD v2 FR-APP-05 — only the applicant can withdraw; other users → 403
    const application = await Application.findOne({
      _id:         req.params.id,
      applicantId: req.user._id,
    });
    if (!application) return res.status(403).json({ success: false, message: 'Forbidden.' });

    application.isWithdrawn = true;
    await application.save();

    // PRD v2 FR-APP-05 AC — applicationCount decrements correctly
    await Job.findByIdAndUpdate(application.jobId, { $inc: { applicationCount: -1 } });

    res.json({ success: true, message: 'Application withdrawn.' });
  } catch (err) {
    next(err);
  }
};
