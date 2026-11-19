/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ApexProvider, useApex } from './context/ApexContext';
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

export default function App() {
  return (
    <ApexProvider>
      <AppShell>
        <WorkspaceRouter />
      </AppShell>
    </ApexProvider>
  );
}
