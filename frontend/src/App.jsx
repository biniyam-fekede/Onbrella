import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/MainLayout";
import { ScanErrorBoundary } from "./components/ScanErrorBoundary";
import { MapPage } from "./pages/MapPage";
import ScanPage2 from "./pages/ScanPage2";
import { ActivePage } from "./pages/ActivePage";
import { ThankYouPage } from "./pages/ThankYouPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PersonalInfoPage } from "./pages/PersonalInfoPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { HelpSupportPage } from "./pages/HelpSupportPage";
import { preloadStationData } from "./utils/stationNames";
import { HistoryPage } from "./pages/HistoryPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SubmitComplaintPage } from "./pages/SubmitComplaintPage";
import { TermsPage } from "./pages/TermsPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import LoginPage from "./pages/Login";
import SignUpPage from "./pages/SignUp";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { AdminLayout } from "./components/AdminLayout";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { AdminActivityPage } from "./pages/admin/AdminActivityPage";
import { AdminInventoryPage } from "./pages/admin/AdminInventoryPage";
import { AdminContentPage } from "./pages/admin/AdminContentPage";
import UpdatePasswordPage from "./pages/UpdatePassword";
import { useRental } from "./context/RentalContext";

function RequireNoActiveRental({ children }) {
  const { activeRental } = useRental();

  if (activeRental) {
    return <Navigate to="/active" replace />;
  }

  return children;
}

function RequireActiveRental({ children }) {
  const { activeRental } = useRental();

  if (!activeRental) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RequireLastReturnSummary({ children }) {
  const { activeRental, lastReturnSummary } = useRental();

  if (activeRental) {
    return <Navigate to="/active" replace />;
  }

  if (!lastReturnSummary) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  useEffect(() => {
    // Preload station data from API on app startup
    preloadStationData();
  }, []);

  return (
    <Routes>
    {/* Auth routes (no MainLayout) */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/sign-up" element={<SignUpPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

    {/* Admin routes (AdminLayout, admin role required) */}
    <Route
      path="/admin"
      element={
        <AdminRoute>
          <AdminLayout />
        </AdminRoute>
      }
    >
      <Route index element={<AdminDashboardPage />} />
      <Route path="activity" element={<AdminActivityPage />} />
      <Route path="inventory" element={<AdminInventoryPage />} />
      <Route path="users" element={<AdminUsersPage />} />
      <Route path="reports" element={<AdminReportsPage />} />
      <Route path="content" element={<AdminContentPage />} />
    </Route>

    {/* App routes (wrapped in MainLayout) */}
    <Route
      path="/*"
      element={
        <MainLayout>
          <Routes>
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <RequireNoActiveRental>
                    <MapPage />
                  </RequireNoActiveRental>
                </ProtectedRoute>
              } 
            />
            <Route
              path="/scan"
              element={
                <ProtectedRoute>
                  <RequireNoActiveRental>
                    <ScanErrorBoundary>
                      <ScanPage2 />
                    </ScanErrorBoundary>
                  </RequireNoActiveRental>
                </ProtectedRoute>
              }
            />
            <Route
              path="/scan/return"
              element={
                <ProtectedRoute>
                  <ScanErrorBoundary>
                    <ScanPage2 />
                  </ScanErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route 
              path="/active" 
              element={
                <ProtectedRoute>
                  <RequireActiveRental>
                    <ActivePage />
                  </RequireActiveRental>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/thank-you" 
              element={
                <ProtectedRoute>
                  <RequireLastReturnSummary>
                    <ThankYouPage />
                  </RequireLastReturnSummary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/history" 
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/personal-info"
              element={
                <ProtectedRoute>
                  <PersonalInfoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/payment-methods"
              element={
                <ProtectedRoute>
                  <ComingSoonPage title="Payment Methods" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/help"
              element={
                <ProtectedRoute>
                  <HelpSupportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/help/complaint"
              element={
                <ProtectedRoute>
                  <SubmitComplaintPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/help/terms"
              element={
                <ProtectedRoute>
                  <TermsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/help/privacy"
              element={
                <ProtectedRoute>
                  <PrivacyPolicyPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      }
    />
  </Routes>
  );
}

export default App;