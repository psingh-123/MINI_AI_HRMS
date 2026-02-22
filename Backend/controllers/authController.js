const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

module.exports = { registerAdmin, loginAdmin, loginEmployee };
