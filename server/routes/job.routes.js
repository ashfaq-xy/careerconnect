const router = require('express').Router();
const {
  createJob, getJobs, getJob, updateJob,
  deleteJob, getMyJobs, toggleStatus,
} = require('../controllers/job.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/',             getJobs);
router.get('/my-jobs',      protect, authorize('recruiter'), getMyJobs);
router.get('/:id',          getJob);
router.post('/',            protect, authorize('recruiter'), createJob);
router.put('/:id',          protect, authorize('recruiter', 'admin'), updateJob);
router.delete('/:id',       protect, authorize('recruiter', 'admin'), deleteJob);
router.patch('/:id/status', protect, authorize('recruiter', 'admin'), toggleStatus);

module.exports = router;
