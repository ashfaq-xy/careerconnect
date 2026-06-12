// server/routes/company.routes.js
const router = require('express').Router();
const Company = require('../models/Company.model');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', async (req, res, next) => {
  try {
    const companies = await Company.find().lean();
    res.json({ success: true, companies });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });
    res.json({ success: true, company });
  } catch (err) { next(err); }
});

router.post('/', protect, authorize('recruiter'), async (req, res, next) => {
  try {
    const company = await Company.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, company });
  } catch (err) { next(err); }
});

router.put('/:id', protect, authorize('recruiter', 'admin'), async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, company });
  } catch (err) { next(err); }
});

module.exports = router;
