const express = require('express');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const {
  getJobs,
  postJob,
  applyJob,
  getEmployerJobs,
  deleteJob,
  updateJob
} = require('../controllers/jobController');


const router = express.Router();
router.get('/employer/:employerId', protect, getEmployerJobs);
router.delete('/:id', protect, deleteJob);
router.get('/', getJobs);
router.post('/', protect, postJob);
router.post('/:jobId/apply', protect, upload.fields([{ name: 'cv', maxCount: 1 }]), applyJob);
router.put('/:id', protect, updateJob);


module.exports = router;
