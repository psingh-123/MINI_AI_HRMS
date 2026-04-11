const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  getTodayAttendance,
  addManualAttendance,
  getAttendanceStats
} = require('../controllers/attendanceController');
const { protectEmployee, protectAdmin } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protectEmployee);

// Check in/out
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);

// Get attendance
router.get('/today', getTodayAttendance);
router.get('/my-attendance', getMyAttendance);

// Admin only routes
router.get('/all', protectAdmin, getAllAttendance);
router.post('/manual', protectAdmin, addManualAttendance);
router.get('/stats', protectAdmin, getAttendanceStats);

module.exports = router;
