/**
 * DSP KnowledgeHub AI — Standalone HR & Employee Process Platform
 * Main Application Routing & Session Architecture
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import KnowledgeHub from './pages/KnowledgeHub';
import MyLeave from './pages/MyLeave';
import MyReimbursements from './pages/MyReimbursements';
import MyRequests from './pages/MyRequests';
import MyActivity from './pages/MyActivity';
import Profile from './pages/Profile';
import Approvals from './pages/Approvals';
import AdminIntegrations from './pages/AdminIntegrations';
import OnboardingPage from './pages/Onboarding';
import OnboardingHR from './pages/OnboardingHR';
import { useAppStore } from './store/useAppStore';
import {
  PoliciesPage,
  LeaveProcessPage,
  OnboardingProcessPage,
  ITAccessProcessPage,
  ExpenseProcessPage,
  ComplianceProcessPage,
  HelpDirectoryPage
} from './pages/ProcessViews';

export default function App() {
  const { checkAuth } = useAppStore();

  // Restore authenticated session automatically on application mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public authentication route */}
        <Route path="/login" element={<Login />} />

        {/* Authenticated workspace routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* 1. Default Landing Page: Personalized Employee Self-Service Dashboard */}
            <Route path="/" element={<EmployeeDashboard />} />

            {/* 2. Intelligent AI Employee Assistant (3D Core + RAG + live personal queries) */}
            <Route path="/assistant" element={<KnowledgeHub />} />

            {/* 3. Core Self-Service Workflows */}
            <Route path="/leave" element={<MyLeave />} />
            <Route path="/reimbursements" element={<MyReimbursements />} />
            <Route path="/requests" element={<MyRequests />} />
            <Route path="/activity" element={<MyActivity />} />
            <Route path="/profile" element={<Profile />} />

            {/* 4. Knowledge Library & Process Dossiers */}
            <Route path="/policies" element={<PoliciesPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/it-access" element={<ITAccessProcessPage />} />
            <Route path="/compliance" element={<ComplianceProcessPage />} />
            <Route path="/directory" element={<HelpDirectoryPage />} />
          </Route>
        </Route>

        {/* 5. Role-Protected Workspaces */}
        <Route element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN', 'COMPLIANCE']} />}>
          <Route element={<Layout />}>
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/onboarding/hr" element={<OnboardingHR />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<Layout />}>
            <Route path="/admin" element={<AdminIntegrations />} />
          </Route>
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
