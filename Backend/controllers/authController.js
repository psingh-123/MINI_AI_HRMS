const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const Organization = require("../models/Organization");
const Employee = require("../models/Employee");

// Generate Token
const generateToken = (id, role, organizationId) => {
  return jwt.sign({ id, role, organizationId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Admin Register
const registerAdmin = async (req, res) => {
  const { companyName, email, password } = req.body;

  const orgExists = await Organization.findOne({ email });

  if (orgExists) {
    res.status(400);
    throw new Error("Organization already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const organization = await Organization.create({
    companyName,
    email,
    password: hashedPassword,
  });

  res.status(201).json({
    _id: organization._id,
    companyName: organization.companyName,
    email: organization.email,
    token: generateToken(organization._id, "ADMIN", organization._id),
  });
};

// Admin Login
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  const organization = await Organization.findOne({ email });

  if (organization && (await bcrypt.compare(password, organization.password))) {
    res.json({
      _id: organization._id,
      companyName: organization.companyName,
      email: organization.email,
      token: generateToken(organization._id, "ADMIN", organization._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
};

// Employee Login
const loginEmployee = async (req, res) => {
  const { email, password } = req.body;

  const employee = await Employee.findOne({ email });

  if (employee && (await bcrypt.compare(password, employee.password))) {
    res.json({
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      organizationId: employee.organizationId,
      token: generateToken(employee._id, "EMPLOYEE", employee.organizationId),
    });
  } else {
    res.status(401);
    throw new Error("Invalid employee email or password");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        orgId: user.organizationId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get profile for currently authenticated user/admin
const getProfile = async (req, res) => {
  try {
    // req.user.id is normalized in protect middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (req.role === "ADMIN") {
      // Admins are organizations in this model
      const organization = await Organization.findById(req.user.id).select("-password");
      if (!organization) return res.status(404).json({ message: "Organization not found" });
      return res.json(organization);
    }

    // For users (admin/hr/employee) try User first
    const user = await User.findById(req.user.id).select("-password");
    if (user) return res.json(user);

    // Fallback: try Employee record
    const employee = await Employee.findById(req.user.id).select("-password");
    if (employee) return res.json(employee);

    return res.status(404).json({ message: "Profile not found" });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerAdmin, loginAdmin, loginEmployee, login, getProfile };
