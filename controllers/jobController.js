const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find();
    res.status(200).json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

exports.postJob = async (req, res) => {
  try {
    const newJob = await Job.create({
      title: req.body.title,
      description: req.body.description,
      company: req.body.company,
      location: req.body.location,
      contact: req.body.contact,
      salary: req.body.salary,
      poster: req.user.id
    });

    // 🔍 Match job seekers
    const seekers = await User.find({ role: 'jobseeker' });
    const matchTitle = newJob.title.trim().toLowerCase();

    const matchingSeekers = seekers.filter(seeker =>
      seeker.position?.trim().toLowerCase() === matchTitle
    );

    for (const seeker of matchingSeekers) {
      await Notification.create({
        user: seeker._id,
        from: req.user.id,
        type: 'applyEmployee',
        job: newJob._id,
        message: `A new job for "${newJob.title}" has been posted`,
        match: true
      });
    }

    res.status(201).json(newJob);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post job' });
  }
};

exports.applyJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const userId = req.user.id;

    const job = await Job.findById(jobId);
    const seeker = await User.findById(userId);

    if (!job || !seeker) {
      return res.status(404).json({ error: 'Job or User not found' });
    }

    const cvPath = req.files && req.files.cv && req.files.cv[0] ? req.files.cv[0].path : null;
    const coverLetter = req.body.coverLetter;

    // Save notification or application record including CV path and cover letter
    const notification = await Notification.create({
      user: job.poster,
      from: seeker._id,
      type: 'applyJob',
      job: job._id,
      message: `${seeker.name} applied for ${job.title}`,
      match: job.title.trim().toLowerCase() === (seeker.position?.trim().toLowerCase() || ''),
      cv: cvPath,
      coverLetter: coverLetter || ''
    });

    res.status(200).json({ message: 'Applied and CV uploaded', notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Application failed' });
  }
};

exports.getEmployerJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ poster: req.params.employerId });
    res.status(200).json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch employer jobs' });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.poster.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await Job.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete job' });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.poster.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedJob);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update job' });
  }
};

