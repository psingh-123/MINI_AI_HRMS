const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// Check in
const checkIn = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const employeeId = req.user.id;
    const organizationId = req.organizationId;

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      organization: organizationId,
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    let attendance;
    if (existingAttendance) {
      // Update existing record (might be a leave or holiday record)
      attendance = existingAttendance;
      attendance.checkIn = {
        time: new Date(),
        location: { latitude, longitude, address },
        deviceId: req.headers['user-agent'],
        ip: req.ip
      };
      attendance.status = 'present';
    } else {
      // Create new attendance record
      attendance = new Attendance({
        organization: organizationId,
        employee: employeeId,
        date: today,
        checkIn: {
          time: new Date(),
          location: { latitude, longitude, address },
          deviceId: req.headers['user-agent'],
          ip: req.ip
        },
        status: 'present'
      });
    }

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('employee', 'name email')
      .populate('approvedBy', 'name');

    res.status(201).json(populatedAttendance);
  } catch (error) {
    console.error('Error in checkIn:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check out
const checkOut = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const employeeId = req.user.id;
    const organizationId = req.organizationId;

    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      organization: organizationId,
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'No check-in record found for today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    attendance.checkOut = {
      time: new Date(),
      location: { latitude, longitude, address },
      deviceId: req.headers['user-agent'],
      ip: req.ip
    };

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('employee', 'name email')
      .populate('approvedBy', 'name');

    res.status(200).json(populatedAttendance);
  } catch (error) {
    console.error('Error in checkOut:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get attendance history for current user
const getMyAttendance = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 30 } = req.query;
    const employeeId = req.user.id;
    const organizationId = req.organizationId;

    const filter = { 
      organization: organizationId, 
      employee: employeeId 
    };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(filter)
      .populate('approvedBy', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(filter);

    res.status(200).json({
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error in getMyAttendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get attendance for all employees (admin)
const getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, status, page = 1, limit = 30 } = req.query;
    const organizationId = req.organizationId;

    const filter = { organization: organizationId };

    if (employeeId) {
      filter.employee = employeeId;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (status) {
      filter.status = status;
    }

    const attendance = await Attendance.find(filter)
      .populate('employee', 'name email')
      .populate('approvedBy', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(filter);

    res.status(200).json({
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error in getAllAttendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get today's attendance status
const getTodayAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const organizationId = req.organizationId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      organization: organizationId,
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('approvedBy', 'name');

    res.status(200).json(attendance);
  } catch (error) {
    console.error('Error in getTodayAttendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add manual attendance (admin)
const addManualAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkInTime, checkOutTime, status, notes } = req.body;
    const organizationId = req.organizationId;
    const approvedBy = req.user.id;

    if (!employeeId || !date) {
      return res.status(400).json({ message: 'Employee ID and date are required' });
    }

    // Check if employee exists
    const employee = await Employee.findOne({ 
      _id: employeeId, 
      organizationId: organizationId 
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      organization: organizationId,
      employee: employeeId,
      date: new Date(date)
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already exists for this date' });
    }

    const attendance = new Attendance({
      organization: organizationId,
      employee: employeeId,
      date: new Date(date),
      checkIn: checkInTime ? { time: new Date(checkInTime) } : undefined,
      checkOut: checkOutTime ? { time: new Date(checkOutTime) } : undefined,
      status: status || 'present',
      notes,
      approvedBy,
      manualEntry: true,
      isApproved: true
    });

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('employee', 'name email')
      .populate('approvedBy', 'name');

    res.status(201).json(populatedAttendance);
  } catch (error) {
    console.error('Error in addManualAttendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get attendance statistics
const getAttendanceStats = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    const organizationId = req.organizationId;

    const filter = { organization: organizationId };
    if (employeeId) filter.employee = employeeId;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const stats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalHours: { $sum: '$totalHours' },
          overtimeHours: { $sum: '$overtimeHours' }
        }
      }
    ]);

    const totalDays = await Attendance.countDocuments(filter);

    res.status(200).json({
      stats,
      totalDays
    });
  } catch (error) {
    console.error('Error in getAttendanceStats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  getTodayAttendance,
  addManualAttendance,
  getAttendanceStats
};
