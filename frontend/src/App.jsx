import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import RegisterOrganization from "./pages/RegisterOrganization";
import AdminLogin from "./pages/AdminLogin";
import EmployeeLogin from "./pages/EmployeeLogin";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";
import Employees from "./pages/Employees";
import EditEmployee from "./pages/EditEmployee";
import AddEmployee from "./pages/AddEmployee";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Tasks from "./pages/Tasks";
import AssignTask from "./pages/AssignTask";
import EmployeeProfile from "./pages/EmployeeProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import Features from "./pages/Features";
import Solutions from "./pages/Solution";
import Pricing from "./pages/Pricing";
import Resources from "./pages/Resources";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register-org" element={<RegisterOrganization />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <Layout>
                <Employees />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-employee/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <EditEmployee />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-employee"
          element={
            <ProtectedRoute>
              <Layout>
                <AddEmployee />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Layout>
                <Tasks />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assign-task"
          element={
            <ProtectedRoute>
              <Layout>
                <AssignTask />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee-profile"
          element={
            <ProtectedRoute>
              <EmployeeProfile />
            </ProtectedRoute>
          }
        />

        <Route path="/features" element={<Features />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/resources" element={<Resources />} />

      </Routes>
    </>
  );
}

export default App;