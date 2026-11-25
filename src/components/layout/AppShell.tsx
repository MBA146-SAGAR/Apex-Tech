import React, { useState } from 'react';
import {
  BarChart3,
  Bell,
  Briefcase,
  CheckSquare,
  CreditCard,
  FileText,
  Globe2,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useApex } from '../../context/ApexContext';
import { useAuth } from '../../context/AuthContext';
import { NavSection } from '../../types/apex';

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'pipeline', label: 'Sales Pipeline', icon: Briefcase },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'financials', label: 'Financial Management', icon: TrendingUp },
  { id: 'analytics', label: 'Business Analytics', icon: BarChart3 },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'validation', label: 'Venture Validation', icon: CheckSquare },
  { id: 'market', label: 'Market Analysis', icon: Globe2 },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    db,
    alerts,
    currentUser,
    activeSection,
    setActiveSection,
    switchUser,
    canAccessSection,
    toastMessage,
  } = useApex();
  const { firebaseUser, userProfile, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const currentNavLabel = NAV_ITEMS.find((n) => n.id === activeSection)?.label || 'Executive Dashboard';

  const handleNavClick = (id: NavSection) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Dark Navy Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-100 flex flex-col shrink-0 transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <div className="min-w-0">
            <div className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              Apex Tech
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              Financial Intelligence Platform
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const allowed = canAccessSection(item.id);
            if (!allowed) return null;
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-md transition-colors text-left whitespace-nowrap ${
                  active
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs space-y-2">
          <div>
            <div className="text-slate-400">Authenticated Account</div>
            <div className="font-semibold text-white truncate mt-0.5">
              {userProfile?.fullName || firebaseUser?.displayName || currentUser.name}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {firebaseUser?.email}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Workspace Role: {currentUser.role}
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="w-full py-1.5 px-2.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
              <span className="hidden sm:inline whitespace-nowrap">Apex Global Technologies</span>
              <span className="hidden sm:inline">/</span>
              <span className="font-semibold text-slate-900 truncate">{currentNavLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Role Quick-Switch */}
            <select
              aria-label="Switch active user role"
              value={currentUser.id}
              onChange={(e) => switchUser(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700 max-w-[190px]"
            >
              {db.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.role} ({u.name.split(' ')[0]})
                </option>
              ))}
            </select>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAlertsOpen((o) => !o)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                aria-label="Workflow notifications"
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-600 text-white text-[10px] font-mono-num rounded-full flex items-center justify-center">
                    {alerts.length}
                  </span>
                )}
              </button>

              {alertsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-3 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-900">Automated Alerts ({alerts.length})</span>
                    <button
                      onClick={() => setAlertsOpen(false)}
                      className="text-xs text-slate-500 hover:text-slate-900"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {alerts.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3">No active alerts.</p>
                    ) : (
                      alerts.map((al) => (
                        <button
                          key={al.id}
                          onClick={() => {
                            setActiveSection(al.targetSection);
                            setAlertsOpen(false);
                          }}
                          className="w-full text-left py-2 hover:bg-slate-50 px-1 rounded"
                        >
                          <div className="text-xs font-semibold text-slate-900">{al.title}</div>
                          <div className="text-[11px] text-slate-500">{al.description}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => logout()}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-red-700 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          {currentUser.role === 'EXECUTIVE' && (
            <div className="mb-4 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-700">
              Read-only Executive view active. Switch to Admin, Finance Manager, or Sales Manager in the top bar to modify records.
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Live Workflow Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-md shadow-lg border border-slate-700 max-w-sm">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
