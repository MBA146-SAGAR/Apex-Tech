/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ApexProvider, useApex } from './context/ApexContext';
import { ErrorBoundary } from './components/auth/ErrorBoundary';
import { AuthPage } from './components/auth/AuthPage';
import { VerifyEmailGate } from './components/auth/VerifyEmailGate';
import { AppShell } from './components/layout/AppShell';
import { ExecutiveDashboardView } from './components/views/ExecutiveDashboardView';
import { CustomersView } from './components/views/CustomersView';
import { SalesPipelineView } from './components/views/SalesPipelineView';
import { SubscriptionsView } from './components/views/SubscriptionsView';
import { FinancialManagementView } from './components/views/FinancialManagementView';
import { BusinessAnalyticsView } from './components/views/BusinessAnalyticsView';
import { MarketingView } from './components/views/MarketingView';
import { VentureValidationView } from './components/views/VentureValidationView';
import { MarketAnalysisView } from './components/views/MarketAnalysisView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';

function WorkspaceRouter() {
  const { activeSection, canAccessSection } = useApex();

  if (!canAccessSection(activeSection)) {
    return <ExecutiveDashboardView />;
  }

  switch (activeSection) {
    case 'dashboard':
      return <ExecutiveDashboardView />;
    case 'customers':
      return <CustomersView />;
    case 'pipeline':
      return <SalesPipelineView />;
    case 'subscriptions':
      return <SubscriptionsView />;
    case 'financials':
      return <FinancialManagementView />;
    case 'analytics':
      return <BusinessAnalyticsView />;
    case 'marketing':
      return <MarketingView />;
    case 'validation':
      return <VentureValidationView />;
    case 'market':
      return <MarketAnalysisView />;
    case 'reports':
      return <ReportsView />;
    case 'settings':
      return <SettingsView />;
    default:
      return <ExecutiveDashboardView />;
  }
}

function AuthGate() {
  const { firebaseUser, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-lg px-6 py-5 text-center space-y-2">
          <div className="text-sm font-semibold text-slate-900">Apex Tech</div>
          <div className="text-xs text-slate-500">Verifying authenticated session...</div>
        </div>
      </div>
    );
  }

  // Require login before accessing any route or feature
  if (!firebaseUser) {
    return <AuthPage />;
  }

  // Require verified email before entering the application workspace
  if (!firebaseUser.emailVerified) {
    return <VerifyEmailGate />;
  }

  return (
    <ApexProvider>
      <AppShell>
        <WorkspaceRouter />
      </AppShell>
    </ApexProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ErrorBoundary>
  );
}
