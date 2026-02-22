// const jwt = require("jsonwebtoken");
// const Organization = require("../models/Organization");
// const Employee = require("../models/Employee");

// // const protect = async (req, res, next) => {
// //   let token;

// //   if (
// //     req.headers.authorization &&
// //     req.headers.authorization.startsWith("Bearer")
// //   ) {
// //     try {
// //       token = req.headers.authorization.split(" ")[1];

// //       const decoded = jwt.verify(token, process.env.JWT_SECRET);

// //       // decoded should contain role and id
// //       if (decoded.role === "ADMIN") {
// //         req.user = await Organization.findById(decoded.id).select("-password");
// //       } else if (decoded.role === "EMPLOYEE") {
// //         req.user = await Employee.findById(decoded.id).select("-password");
// //       }

// //       req.role = decoded.role;
// //       req.organizationId = decoded.organizationId;

// //       next();
// //     } catch (error) {
// //       res.status(401);
// //       return next(new Error("Not authorized, token failed"));
// //     }
// //   }

// //   if (!token) {
// //     res.status(401);
// //     return next(new Error("Not authorized, no token"));
// //   }
// // };

// // const jwt = require("jsonwebtoken");

// const protect = (req, res, next) => {
//   let token;

//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//   }

//   if (!token) {
//     return res.status(401).json({ error: "Not authorized, no token" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // 🔥 VERY IMPORTANT
//     req.user = { id: decoded.id };
//     req.role = decoded.role;
//     req.organizationId = decoded.organizationId;

//     next();
//   } catch (error) {
//     return res.status(401).json({ error: "Token failed" });
//   }
// };

// module.exports = { protect };

// const adminOnly = (req, res, next) => {
//   if (req.role === "admin") {
//     next();
//   } else {
//     res.status(403);
//     return next(new Error("Access denied. Admin only."));
//   }
// };

// module.exports = { protect, adminOnly };

const jwt = require("jsonwebtoken");

/*
==================================================
   Protect Middleware (for both admin & employee)
==================================================
*/
const protect = (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('protect middleware: token present');
    console.log('protect middleware: decoded payload ->', decoded);

    // Attach decoded values to request
    req.user = { id: decoded.id };
    // normalize role to uppercase so checks are case-insensitive
    req.role = decoded.role ? decoded.role.toString().toUpperCase() : decoded.role;
    req.organizationId = decoded.organizationId;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalid or expired" });
  }
};

/*
==================================================
   Admin Only Middleware
==================================================
*/
const adminOnly = (req, res, next) => {
  if (req.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
};

/*
==================================================
   Employee Only Middleware
==================================================
*/
const employeeOnly = (req, res, next) => {
  if (req.role !== "EMPLOYEE") {
    return res.status(403).json({ error: "Employee access only" });
  }
  next();
};

module.exports = {
  protect,
  adminOnly,
  employeeOnly,
};