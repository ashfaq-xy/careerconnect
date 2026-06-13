const router = require('express').Router();
const User        = require('../models/User.model');
const Job         = require('../models/Job.model');
const Application = require('../models/Application.model');
const { protect, authorize } = require('../middleware/auth.middleware');
const adminOnly = [protect, authorize('admin')];

router.get('/users', ...adminOnly, async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) { next(err); }
});
router.patch('/users/:id/role', ...adminOnly, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
});
router.delete('/users/:id', ...adminOnly, async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});
router.get('/jobs', ...adminOnly, async (req, res, next) => {
  try {
    const jobs = await Job.find().populate('company','name').populate('postedBy','firstName lastName').sort({ createdAt: -1 }).lean();
    res.json({ success: true, jobs });
  } catch (err) { next(err); }
});
router.get('/stats', ...adminOnly, async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000);
    const [totalUsers,totalJobs,totalApplications,activeJobs,totalRecruiters,totalSeekers,hiredThisMonth,newUsersThisMonth] = await Promise.all([
      User.countDocuments(), Job.countDocuments(), Application.countDocuments(),
      Job.countDocuments({status:'open'}), User.countDocuments({role:'recruiter'}),
      User.countDocuments({role:'jobseeker'}),
      Application.countDocuments({status:'offered',updatedAt:{$gte:thirtyDaysAgo}}),
      User.countDocuments({createdAt:{$gte:thirtyDaysAgo}}),
    ]);
    res.json({ success: true, stats: { totalUsers,totalJobs,totalApplications,activeJobs,totalRecruiters,totalSeekers,hiredThisMonth,newUsersThisMonth } });
  } catch (err) { next(err); }
});
module.exports = router;
