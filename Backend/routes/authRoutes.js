const express = require("express");
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  loginEmployee,
  login,
  getProfile,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

router.post("/admin/register", registerAdmin);
router.post("/admin/login", loginAdmin);


router.post("/login", login);
router.get("/profile", protect, getProfile);

router.get("/profile", protect, getProfile);

router.post("/employee/login", loginEmployee);

module.exports = router;
