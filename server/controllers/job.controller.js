// server/controllers/job.controller.js
const Job = require('../models/Job.model');
const Application = require('../models/Application.model');

// ─── Create Job ───────────────────────────────────────────────────────────────
exports.createJob = async (req, res, next) => {
  try {
    const job = await Job.create({ ...req.body, postedBy: req.user._id });
    res.status(201).json({ success: true, job });
  } catch (err) {
    next(err);
  }
};

// ─── Get All Jobs (with filters & pagination) ─────────────────────────────────
exports.getJobs = async (req, res, next) => {
  try {
    const {
      keyword, location, jobType, category, experience,
      salaryMin, salaryMax, status = 'open',
      page = 1, limit = 10, sortBy = 'createdAt',
    } = req.query;

    const query = { status };

    if (keyword) {
      query.$text = { $search: keyword };
    }
    if (location) query.location = { $regex: location, $options: 'i' };
    if (jobType) query.jobType = jobType;
    if (category) query.category = category;
    if (experience) query.experience = experience;
    if (salaryMin || salaryMax) {
      query['salaryRange.min'] = { $gte: Number(salaryMin) || 0 };
      if (salaryMax) query['salaryRange.max'] = { $lte: Number(salaryMax) };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions = keyword
      ? { score: { $meta: 'textScore' }, createdAt: -1 }
      : { [sortBy]: -1 };

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('company', 'name logo location')
        .populate('postedBy', 'firstName lastName')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Job.countDocuments(query),
    ]);

    res.json({
      success: true,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      jobs,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Job ───────────────────────────────────────────────────────────
exports.getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name logo location website description')
      .populate('postedBy', 'firstName lastName profilePicture');

    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    res.json({ success: true, job });
  } catch (err) {
    next(err);
  }
};

// ─── Update Job ───────────────────────────────────────────────────────────────
exports.updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, job: updated });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Job (soft delete) ─────────────────────────────────────────────────
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    await Job.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ success: true, message: 'Job deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Get My Posted Jobs (Recruiter) ──────────────────────────────────────────
exports.getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id })
      .populate('company', 'name logo')
      .sort({ createdAt: -1 })
      .lean();

    // Attach application counts
    const jobIds = jobs.map((j) => j._id);
    const counts = await Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$jobId', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
    const jobsWithCounts = jobs.map((j) => ({
      ...j,
      applicationCount: countMap[j._id.toString()] || 0,
    }));

    res.json({ success: true, jobs: jobsWithCounts });
  } catch (err) {
    next(err);
  }
};

// ─── Toggle Job Status (open/closed) ─────────────────────────────────────────
exports.toggleJobStatus = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    job.status = job.status === 'open' ? 'closed' : 'open';
    await job.save();
    res.json({ success: true, status: job.status });
  } catch (err) {
    next(err);
  }
};
