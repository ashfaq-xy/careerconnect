// server/routes/application.routes.js
const router = require('express').Router();
const {
  applyForJob, getMyApplications, getJobApplicants,
  updateApplicationStatus, withdrawApplication,
} = require('../controllers/application.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// IMPORTANT: /my-applications must be declared BEFORE /:id to avoid route conflict
router.get('/my-applications', protect, authorize('jobseeker'), getMyApplications);
router.get('/job/:jobId', protect, authorize('recruiter', 'admin'), getJobApplicants);
router.post('/apply/:jobId', protect, authorize('jobseeker'), applyForJob);
router.patch('/:id/status', protect, authorize('recruiter'), updateApplicationStatus);
router.delete('/:id', protect, authorize('jobseeker'), withdrawApplication);

module.exports = router;
