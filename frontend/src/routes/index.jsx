import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import EmployeesPage from '../pages/employees/EmployeesPage';
import AttendancePage from '../pages/attendance/AttendancePage';
import LeavePage from '../pages/leave/LeavePage';
import PayrollPage from '../pages/payroll/PayrollPage';
import CompanyPage from '../pages/company/CompanyPage';

import MainLayout from '../components/layout/MainLayout';

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

            {/* Protected */}
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="leave" element={<LeavePage />} />
                <Route path="payroll" element={<PayrollPage />} />
                <Route path="company" element={<CompanyPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}