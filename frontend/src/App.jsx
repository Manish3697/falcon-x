import React from 'react';
import { FalconProvider, useFalcon } from './context/FalconContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { TestScenarioBar } from './components/layout/TestScenarioBar';

import { DashboardView } from './components/views/DashboardView';
import { LiveTrafficView } from './components/views/LiveTrafficView';
import { DevicesView } from './components/views/DevicesView';
import { AlertsView } from './components/views/AlertsView';
import { RiskAnalysisView } from './components/views/RiskAnalysisView';
import { NetworkRulesView } from './components/views/NetworkRulesView';
import { EventLogsView } from './components/views/EventLogsView';
import { SystemStatusView } from './components/views/SystemStatusView';
import { SettingsView } from './components/views/SettingsView';

const MainContent = () => {
  const { activeTab } = useFalcon();

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'traffic':
        return <LiveTrafficView />;
      case 'devices':
        return <DevicesView />;
      case 'alerts':
        return <AlertsView />;
      case 'risk':
        return <RiskAnalysisView />;
      case 'rules':
        return <NetworkRulesView />;
      case 'logs':
        return <EventLogsView />;
      case 'status':
        return <SystemStatusView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-falcon-bg overflow-y-auto">
      <Header />
      <TestScenarioBar />
      <main className="p-6 flex-1 max-w-[1600px] w-full mx-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <FalconProvider>
      <div className="flex h-screen bg-falcon-bg overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
    </FalconProvider>
  );
}
