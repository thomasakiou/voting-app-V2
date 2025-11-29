import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthLayout, AdminLayout, VoterLayout } from './components/Layouts';
import { Login, ResetPassword, ChangePassword, FirstTimePasswordChange } from './pages/Auth';
import { PrivacyPolicy, TermsOfService } from './pages/Legal';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserList, CreateUser, BulkUpload, BulkActions } from './pages/AdminUsers';
import { OfficeManagement, CreateOffice } from './pages/AdminOffices';
import { CandidateManagement, CreateCandidate } from './pages/AdminCandidates';
import { ElectionResults } from './pages/AdminResults';
import { SystemStatus, SystemConfig } from './pages/AdminSystem';
import { VoterDashboard, SelectOffice, VoteCandidate, ConfirmVote, VoteSuccess, VotingHistory } from './pages/Voter';
import { VoterAnalytics } from './pages/VoterAnalytics';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/first-time-password" element={<FirstTimePasswordChange />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['super-admin', 'admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
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
            <Route path="change-password" element={<ChangePassword />} />
          </Route>

          {/* Voter Routes */}
          <Route path="/voter" element={
            <ProtectedRoute allowedRoles={['voter']}>
              <VoterLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<VoterDashboard />} />
            <Route path="ballot" element={<SelectOffice />} />
            <Route path="ballot/:officeId" element={<VoteCandidate />} />
            <Route path="ballot/confirm" element={<ConfirmVote />} />
            <Route path="success" element={<VoteSuccess />} />
            <Route path="history" element={<VotingHistory />} />
            <Route path="analytics" element={<VoterAnalytics />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;