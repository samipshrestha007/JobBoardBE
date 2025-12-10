// server/controllers/userController.js
const User         = require('../models/User');
const Notification = require('../models/Notification');

/**
 * GET /api/employees
 * Protected: list all job-seekers
 */
async function getEmployees(req, res) {
  try {
    const employees = await User
      .find({ role: 'jobseeker' })
      .select('name email contact position yearsOfExperience');
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/employees/:employeeId/apply
 * Protected: employer contacts a job-seeker
 */
async function applyEmployee(req, res) {
  try {
    const employerId = req.user.id;
    const employeeId = req.params.employeeId;

    const employee = await User.findById(employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const employer = await User.findById(employerId);
    if (!employer) return res.status(404).json({ error: 'Employer not found' });

    const message = `${employer.name} contacted you for a position`;
    await Notification.create({
      user:    employeeId,   // notify the job-seeker
      from:    employerId,
      type:    'applyEmployee',
      message
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getEmployees,
  applyEmployee
};
