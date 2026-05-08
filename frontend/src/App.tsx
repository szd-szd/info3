import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomeRedirect } from './pages/HomeRedirect';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminEmployees } from './pages/admin/AdminEmployees';
import { AdminEmployeeForm } from './pages/admin/AdminEmployeeForm';
import { AdminLeaveRequests } from './pages/admin/AdminLeaveRequests';
import { EmployeeLayout } from './pages/employee/EmployeeLayout';
import { EmployeeHome } from './pages/employee/EmployeeHome';
import { EmployeeProfile } from './pages/employee/EmployeeProfile';
import { EmployeeLeaves } from './pages/employee/EmployeeLeaves';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRh>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="employes" element={<AdminEmployees />} />
            <Route path="employes/nouveau" element={<AdminEmployeeForm />} />
            <Route path="employes/:id" element={<AdminEmployeeForm />} />
            <Route path="conges" element={<AdminLeaveRequests />} />
          </Route>
          <Route
            path="/app"
            element={
              <ProtectedRoute requireEmployee>
                <EmployeeLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<EmployeeHome />} />
            <Route path="profil" element={<EmployeeProfile />} />
            <Route path="conges" element={<EmployeeLeaves />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
