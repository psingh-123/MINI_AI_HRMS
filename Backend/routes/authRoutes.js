const express = require("express");
const router = express.Router();

const {
  registerAdmin,
  loginAdmin,
  loginEmployee,
} = require("../controllers/authController");

router.post("/admin/register", registerAdmin);
router.post("/admin/login", loginAdmin);

router.post("/employee/login", loginEmployee);

module.exports = router;
