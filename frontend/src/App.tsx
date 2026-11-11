import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { getUser } from './lib/auth';

// Public pages
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import HowItWorksPage from './pages/public/HowItWorksPage';
import DepartmentsPage from './pages/public/DepartmentsPage';
import ContactPage from './pages/public/ContactPage';
import FAQPage from './pages/public/FAQPage';
import TrackPublicPage from './pages/public/TrackPublicPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Citizen pages
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import SubmitGrievance from './pages/citizen/SubmitGrievance';
import TrackGrievance from './pages/citizen/TrackGrievance';
import CitizenGrievanceDetail from './pages/citizen/CitizenGrievanceDetail';

// CMO pages
import CMODashboard from './pages/cmo/CMODashboard';
import CMOGrievanceDetail from './pages/cmo/CMOGrievanceDetail';

// Officer pages
import OfficerDashboard from './pages/officer/OfficerDashboard';
import OfficerGrievanceDetail from './pages/officer/OfficerGrievanceDetail';

const queryClient = new QueryClient();

function ProtectedRoute({ children, role }: { children: ReactNode; role?: string }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    if (user.role === 'CMO_ADMIN') return <Navigate to="/cmo/dashboard" replace />;
    if (user.role === 'OFFICER') return <Navigate to="/officer/dashboard" replace />;
    return <Navigate to="/citizen/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/track" element={<TrackPublicPage />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Citizen */}
          <Route
            path="/citizen/dashboard"
            element={
              <ProtectedRoute role="CITIZEN">
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/submit"
            element={
              <ProtectedRoute role="CITIZEN">
                <SubmitGrievance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/track"
            element={
              <ProtectedRoute role="CITIZEN">
                <TrackGrievance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/grievances/:id"
            element={
              <ProtectedRoute role="CITIZEN">
                <CitizenGrievanceDetail />
              </ProtectedRoute>
            }
          />

          {/* CMO */}
          <Route
            path="/cmo/dashboard"
            element={
              <ProtectedRoute role="CMO_ADMIN">
                <CMODashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cmo/grievances/:id"
            element={
              <ProtectedRoute role="CMO_ADMIN">
                <CMOGrievanceDetail />
              </ProtectedRoute>
            }
          />

          {/* Officer */}
          <Route
            path="/officer/dashboard"
            element={
              <ProtectedRoute role="OFFICER">
                <OfficerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer/grievances/:id"
            element={
              <ProtectedRoute role="OFFICER">
                <OfficerGrievanceDetail />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
