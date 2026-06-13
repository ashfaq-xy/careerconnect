const Job     = require('../models/Job.model');
const Company = require('../models/Company.model');

exports.createJob = async (req, res, next) => {
  try {
    const { companyName, ...rest } = req.body;
    let company = await Company.findOne({ name: { $regex: new RegExp(`^${companyName}$`, 'i') } });
    if (!company) company = await Company.create({ name: companyName, createdBy: req.user._id });
    const job = await Job.create({ ...rest, company: company._id, postedBy: req.user._id });
    res.status(201).json({ success: true, job });
  } catch (err) { next(err); }
};

exports.getJobs = async (req, res, next) => {
  try {
    const { keyword, location, jobType, category, experience, salaryMin, salaryMax, status = 'open', page = 1, limit = 10 } = req.query;
    const query = { status };
    if (keyword)    query.$text = { $search: keyword };
    if (location)   query.location = { $regex: location, $options: 'i' };
    if (jobType)    query.jobType  = jobType;
    if (category)   query.category = category;
    if (experience) query.experience = experience;
    if (salaryMin)  query['salaryRange.min'] = { $gte: Number(salaryMin) };
    if (salaryMax)  query['salaryRange.max'] = { $lte: Number(salaryMax) };
    const total = await Job.countDocuments(query);
    const jobs  = await Job.find(query)
      .populate('company', 'name logo location')
      .populate('postedBy', 'firstName lastName profilePicture')
      .sort(keyword ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit)).lean();
    res.json({ success: true, total, jobs, pages: Math.ceil(total / limit), currentPage: Number(page) });
  } catch (err) { next(err); }
};

exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name logo location website industry size')
      .populate('postedBy', 'firstName lastName profilePicture');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    res.json({ success: true, job });
  } catch (err) { next(err); }
};

exports.updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    const { companyName, ...rest } = req.body;
    if (companyName) {
      let company = await Company.findOne({ name: { $regex: new RegExp(`^${companyName}$`, 'i') } });
      if (!company) company = await Company.create({ name: companyName, createdBy: req.user._id });
      rest.company = company._id;
    }
    const updated = await Job.findByIdAndUpdate(req.params.id, rest, { new: true, runValidators: true });
    res.json({ success: true, job: updated });
  } catch (err) { next(err); }
};

exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    job.isDeleted = true;
    await job.save();
    res.json({ success: true, message: 'Job deleted.' });
  } catch (err) { next(err); }
};

exports.getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id })
      .populate('company', 'name logo').sort({ createdAt: -1 }).lean();
    res.json({ success: true, jobs });
  } catch (err) { next(err); }
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (job.postedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    job.status = job.status === 'open' ? 'closed' : 'open';
    await job.save();
    res.json({ success: true, status: job.status });
  } catch (err) { next(err); }
};
