import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicVoterRoute } from './components/ProtectedRoute';
import { AuthLayout, AdminLayout, VoterLayout } from './components/Layouts';
import { Login, AdminLogin, VerifyOTP } from './pages/Auth';
import { Accreditation } from './pages/Accreditation';
import { VoterContactUpdate } from './pages/VoterContactUpdate';
import { PrivacyPolicy, TermsOfService } from './pages/Legal';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminAnalysis } from './pages/AdminAnalysis';
import { UserList, CreateUser, BulkUpload, BulkActions } from './pages/AdminUsers';
import { OfficeManagement, CreateOffice } from './pages/AdminOffices';
import { CandidateManagement, CreateCandidate } from './pages/AdminCandidates';
import { ElectionResults } from './pages/AdminResults';
import { SystemStatus, SystemConfig } from './pages/AdminSystem';
import { VoterDashboard, SelectOffice, VoteCandidate, ConfirmVote, VoteSuccess, VotingHistory } from './pages/Voter';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/election" replace />} />

          {/* Public Accreditation Route - Locked from Admins */}
          <Route path="/accreditation" element={<PublicVoterRoute><Accreditation /></PublicVoterRoute>} />

          {/* Public Voter Contact Registration & Verification Route - Locked from Admins */}
          <Route path="/contact-update" element={<PublicVoterRoute><VoterContactUpdate /></PublicVoterRoute>} />
          <Route path="/profile-update" element={<PublicVoterRoute><VoterContactUpdate /></PublicVoterRoute>} />

          {/* Auth & Election Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/election" element={<PublicVoterRoute><Login /></PublicVoterRoute>} />
            <Route path="/login" element={<PublicVoterRoute><Login /></PublicVoterRoute>} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/verify-otp" element={<PublicVoterRoute><VerifyOTP /></PublicVoterRoute>} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['super-admin', 'admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="analysis" element={<AdminAnalysis />} />
            <Route path="users" element={<UserList />} />
            <Route path="users/create" element={<CreateUser />} />
            <Route path="users/bulk-upload" element={<BulkUpload />} />
            <Route path="users/bulk-actions" element={<BulkActions />} />
            <Route path="offices" element={<OfficeManagement />} />
            <Route path="offices/create" element={<CreateOffice />} />
            <Route path="candidates" element={<CandidateManagement />} />
            <Route path="candidates/create" element={<CreateCandidate />} />
            <Route path="results" element={<ElectionResults />} />
            <Route path="system-status" element={<SystemStatus />} />
            <Route path="settings" element={<SystemConfig />} />
          </Route>

          {/* Voter Routes */}
          <Route
            path="/voter"
            element={
              <ProtectedRoute allowedRoles={['voter']}>
                <VoterLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<VoterDashboard />} />
            <Route path="ballot" element={<SelectOffice />} />
            <Route path="ballot/:officeId" element={<VoteCandidate />} />
            <Route path="ballot/confirm" element={<ConfirmVote />} />
            <Route path="success" element={<VoteSuccess />} />
            <Route path="history" element={<VotingHistory />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/election" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
