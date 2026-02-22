const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const taskRoutes = require("./routes/taskRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const aiRoutes = require("./routes/aiRoutes");

// Middleware
const { errorHandler, notFound } = require("./middleware/errorMiddleWare");

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // for JSON body parsing

// Connect Database
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/employee-auth", require("./routes/employeeAuthRoutes"));
app.use("/api/debug", require("./routes/debugRoutes"));

// Default Route
app.get("/", (req, res) => {
  res.send("Mini AI-HRMS Backend is Running...");
});

// Error Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
