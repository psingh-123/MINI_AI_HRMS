const express = require('express');
const router = express.Router();
const {
  createMeeting,
  getMyMeetings,
  getAllMeetings,
  getMeetingDetails,
  updateMeeting,
  deleteMeeting,
  startMeeting,
  endMeeting,
  joinMeeting,
  admitParticipant,
  getActiveSessions
} = require('../controllers/meetingController');
const { protectEmployee, protectAdmin } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protectEmployee);

// Create meeting
router.post('/', (req, res) => createMeeting(req, res));

// Get meetings
router.get('/my-meetings', (req, res) => getMyMeetings(req, res));
router.get('/all', protectAdmin, (req, res) => getAllMeetings(req, res));
router.get('/active/:meetingId', (req, res) => getActiveSessions(req, res));

// Meeting operations
router.get('/:meetingId', (req, res) => getMeetingDetails(req, res));
router.put('/:meetingId', (req, res) => updateMeeting(req, res));
router.delete('/:meetingId', (req, res) => deleteMeeting(req, res));
router.post('/:meetingId/start', (req, res) => startMeeting(req, res));
router.post('/:meetingId/end', (req, res) => endMeeting(req, res));
router.post('/:meetingId/join', (req, res) => joinMeeting(req, res));
router.post('/:meetingId/admit', (req, res) => admitParticipant(req, res));

module.exports = router;
