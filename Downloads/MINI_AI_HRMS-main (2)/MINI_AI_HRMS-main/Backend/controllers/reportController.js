const Report = require('../models/Report');
const Employee = require('../models/Employee');
const Chat = require('../models/Chat');

// Create a new report
const createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, description, severity, anonymous } = req.body;
    const reportedBy = req.user.id;
    const organizationId = req.organizationId;

    if (!reportedUserId || !reason || !description) {
      return res.status(400).json({
        message: 'Reported user, reason, and description are required'
      });
    }

    // Check if reported user exists and belongs to same organization
    const reportedUser = await Employee.findOne({
      _id: reportedUserId,
      organizationId: organizationId
    });

    if (!reportedUser) {
      return res.status(404).json({ message: 'Reported user not found' });
    }

    // Check if user is not reporting themselves
    if (reportedUserId === reportedBy) {
      return res.status(400).json({ message: 'You cannot report yourself' });
    }

    const report = new Report({
      organization: organizationId,
      reportedBy,
      reportedUser: reportedUserId,
      reason,
      description,
      severity: severity || 'medium',
      anonymous: anonymous || false
    });

    await report.save();

    const populatedReport = await Report.findById(report._id)
      .populate('reportedBy', 'name email')
      .populate('reportedUser', 'name email')
      .populate('reviewedBy', 'name email');

    // Automatically create a chat thread linked to the report
    const chat = new Chat({
      organization: organizationId,
      participants: [reportedBy],
      isAdminChat: true,
      isGroupChat: false,
      linkedReport: report._id
    });
    await chat.save();

    res.status(201).json(populatedReport);
  } catch (error) {
    console.error('Error in createReport:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all reports (for admin)
const getAllReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const organizationId = req.organizationId;
    console.log("getAllReports: organizationId ->", organizationId);

    const filter = { organization: organizationId };
    if (status) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate('reportedBy', 'name email')
      .populate('reportedUser', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(filter);

    res.status(200).json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error in getAllReports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get reports filed by current user
const getMyReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const reportedBy = req.user.id;
    const organizationId = req.organizationId;

    const filter = {
      organization: organizationId,
      reportedBy
    };
    console.log("getMyReports: filter ->", filter);
    if (status) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate('reportedUser', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(filter);

    res.status(200).json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error in getMyReports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get reports against current user
const getReportsAgainstMe = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const reportedUser = req.user.id;
    const organizationId = req.organizationId;

    const filter = {
      organization: organizationId,
      reportedUser
    };
    if (status) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate('reportedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(filter);

    res.status(200).json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error in getReportsAgainstMe:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update report status (for admin)
const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, reviewNotes, resolution } = req.body;
    const reviewedBy = req.user.id;
    const userRole = req.role;

    if (userRole === 'ADMIN' || userRole === 'HR') {
      return res.status(403).json({ message: 'Admin/HR not authorized to update report status' });
    }

    if (!['pending', 'under_review', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    report.reviewedBy = reviewedBy;
    report.reviewNotes = reviewNotes;

    if (resolution) {
      report.resolution = resolution;
    }

    if (status === 'resolved' || status === 'dismissed') {
      report.resolutionDate = new Date();
    }

    await report.save();

    const updatedReport = await Report.findById(reportId)
      .populate('reportedBy', 'name email')
      .populate('reportedUser', 'name email')
      .populate('reviewedBy', 'name email');

    res.status(200).json(updatedReport);
  } catch (error) {
    console.error('Error in updateReportStatus:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get report statistics (for admin)
const getReportStats = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    const stats = await Report.aggregate([
      { $match: { organization: organizationId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const reasonStats = await Report.aggregate([
      { $match: { organization: organizationId } },
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      }
    ]);

    const severityStats = await Report.aggregate([
      { $match: { organization: organizationId } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      statusStats: stats,
      reasonStats,
      severityStats
    });
  } catch (error) {
    console.error('Error in getReportStats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createReport,
  getAllReports,
  getMyReports,
  getReportsAgainstMe,
  updateReportStatus,
  getReportStats
};
