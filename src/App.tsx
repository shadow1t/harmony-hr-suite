import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { CompanyProvider } from "@/hooks/useCompany";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Landing from "./pages/Landing";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Payroll from "./pages/Payroll";
import Recruitment from "./pages/Recruitment";
import Training from "./pages/Training";
import Performance from "./pages/Performance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import CompanySettings from "./pages/CompanySettings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TenantsManagement from "./pages/admin/TenantsManagement";
import MyPortal from "./pages/employee/MyPortal";
import MyAttendance from "./pages/employee/MyAttendance";
import MyLeaves from "./pages/employee/MyLeaves";
import MyPayslips from "./pages/employee/MyPayslips";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const EmployeePage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <EmployeeLayout>{children}</EmployeeLayout>
  </ProtectedRoute>
);

const AdminPage = ({ children }: { children: React.ReactNode }) => (
  <AdminProtectedRoute>
    <AdminLayout>{children}</AdminLayout>
  </AdminProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <CompanyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/subscription-success" element={<SubscriptionSuccess />} />

                {/* HR/Admin routes */}
                <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
                <Route path="/employees" element={<ProtectedPage><Employees /></ProtectedPage>} />
                <Route path="/departments" element={<ProtectedPage><Departments /></ProtectedPage>} />
                <Route path="/attendance" element={<ProtectedPage><Attendance /></ProtectedPage>} />
                <Route path="/leaves" element={<ProtectedPage><Leaves /></ProtectedPage>} />
                <Route path="/payroll" element={<ProtectedPage><Payroll /></ProtectedPage>} />
                <Route path="/recruitment" element={<ProtectedPage><Recruitment /></ProtectedPage>} />
                <Route path="/training" element={<ProtectedPage><Training /></ProtectedPage>} />
                <Route path="/performance" element={<ProtectedPage><Performance /></ProtectedPage>} />
                <Route path="/reports" element={<ProtectedPage><Reports /></ProtectedPage>} />
                <Route path="/settings" element={<ProtectedPage><Settings /></ProtectedPage>} />
                <Route path="/settings/company" element={<ProtectedPage><CompanySettings /></ProtectedPage>} />

                {/* Employee Self-Service routes */}
                <Route path="/my-portal" element={<EmployeePage><MyPortal /></EmployeePage>} />
                <Route path="/my-attendance" element={<EmployeePage><MyAttendance /></EmployeePage>} />
                <Route path="/my-leaves" element={<EmployeePage><MyLeaves /></EmployeePage>} />
                <Route path="/my-payslips" element={<EmployeePage><MyPayslips /></EmployeePage>} />

                {/* Super Admin routes */}
                <Route path="/admin" element={<AdminPage><AdminDashboard /></AdminPage>} />
                <Route path="/admin/tenants" element={<AdminPage><TenantsManagement /></AdminPage>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CompanyProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
