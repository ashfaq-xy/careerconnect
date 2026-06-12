// server/routes/job.routes.js
const router = require('express').Router();
const {
  createJob, getJobs, getJobById, updateJob,
  deleteJob, getMyJobs, toggleJobStatus,
} = require('../controllers/job.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', getJobs);
router.get('/my-jobs', protect, authorize('recruiter'), getMyJobs);
router.get('/:id', getJobById);
router.post('/', protect, authorize('recruiter'), createJob);
router.put('/:id', protect, authorize('recruiter', 'admin'), updateJob);
router.delete('/:id', protect, authorize('recruiter', 'admin'), deleteJob);
router.patch('/:id/status', protect, authorize('recruiter'), toggleJobStatus);

module.exports = router;
