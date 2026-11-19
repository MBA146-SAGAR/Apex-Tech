import React, { useState } from 'react';
import { Database, RotateCcw, Shield, UserPlus } from 'lucide-react';
import { useApex } from '../../context/ApexContext';
import { UserRole } from '../../types/apex';
import { downloadCSV, formatINR, formatPct } from '../../utils/formatters';
import { Modal, SectionHeader, StatusText } from '../ui/DataPrimitives';

export function SettingsView() {
  const {
    db,
    financials,
    currentUser,
    switchUser,
    updateAssumptions,
    addUser,
    updateUserRole,
    resetDemoData,
  } = useApex();

  const isAdmin = currentUser.role === 'ADMIN';
  const [assumptionsForm, setAssumptionsForm] = useState(db.assumptions);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'FINANCE MANAGER' as UserRole,
    department: 'Finance',
    active: true,
  });

  const handleSaveAssumptions = (e: React.FormEvent) => {
    e.preventDefault();
    updateAssumptions(assumptionsForm);
  };

  const exportSchemaBlueprint = () => {
    const schema = {
      platform: 'Apex Tech – Financial Intelligence Platform',
      tables: [
        { name: 'Users', primaryKey: 'id', recordCount: db.users.length },
        { name: 'Customers', primaryKey: 'id', recordCount: db.customers.length },
        { name: 'Leads', primaryKey: 'id', recordCount: db.leads.length },
        { name: 'Subscriptions', primaryKey: 'id', refs: ['customerId -> Customers.id'], recordCount: db.subscriptions.length },
        { name: 'RevenueTransactions', primaryKey: 'id', refs: ['customerId', 'subscriptionId'], recordCount: db.revenueTransactions.length },
        { name: 'ExpenseTransactions', primaryKey: 'id', recordCount: db.expenseTransactions.length },
        { name: 'MarketingCampaigns', primaryKey: 'id', recordCount: db.marketingCampaigns.length },
        { name: 'ValidationTasks', primaryKey: 'id', recordCount: db.validationTasks.length },
        { name: 'CustomerFeedback', primaryKey: 'id', recordCount: db.customerFeedback.length },
        { name: 'FinancialReports', primaryKey: 'id', recordCount: db.financialReports.length },
      ],
    };
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'apex-tech-database-schema.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Platform Settings, Assumptions & Access Control"
        subtitle="Configure financial calculation parameters, manage role-based security filters, and export relational tables"
        actions={
          isAdmin && (
            <button
              onClick={resetDemoData}
              className="px-3 py-2 text-xs font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-md flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Demo Data
            </button>
          )
        }
      />

      {/* Role Switcher / Active Sign-In */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-700" />
              Role-Based Access Control (RBAC) Sign-In Simulator
            </h2>
            <p className="text-xs text-slate-500">
              Signed in as <strong>{currentUser.name}</strong> ({currentUser.role}). Switch roles below to verify module permissions.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setUserModalOpen(true)}
              className="px-3 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md flex items-center gap-1.5 self-start"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Team User
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="text-left py-2.5 px-3 font-semibold">User</th>
                <th className="text-left py-2.5 px-3 font-semibold">Email</th>
                <th className="text-left py-2.5 px-3 font-semibold">Department</th>
                <th className="text-left py-2.5 px-3 font-semibold">Assigned Role</th>
                <th className="text-left py-2.5 px-3 font-semibold">Access Scope</th>
                <th className="text-right py-2.5 px-3 font-semibold">Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.users.map((u) => (
                <tr key={u.id} className={u.id === currentUser.id ? 'bg-blue-50/50' : ''}>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="py-2.5 px-3 text-slate-600 font-mono-num">{u.email}</td>
                  <td className="py-2.5 px-3 text-slate-600">{u.department}</td>
                  <td className="py-2.5 px-3">
                    {isAdmin && u.id !== currentUser.id ? (
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                        className="border border-slate-200 rounded px-2 py-1 text-xs bg-white"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="FINANCE MANAGER">FINANCE MANAGER</option>
                        <option value="SALES MANAGER">SALES MANAGER</option>
                        <option value="EXECUTIVE">EXECUTIVE</option>
                      </select>
                    ) : (
                      <span className="font-medium text-slate-800">{u.role}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {u.role === 'ADMIN'
                      ? 'Full system access'
                      : u.role === 'FINANCE MANAGER'
                        ? 'Financials, Subscriptions, Analytics, Reports'
                        : u.role === 'SALES MANAGER'
                          ? 'CRM, Pipeline, Marketing, Validation'
                          : 'Read-only Executive Dashboards & Reports'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {u.id === currentUser.id ? (
                      <StatusText label="Active Session" tone="positive" />
                    ) : (
                      <button
                        onClick={() => switchUser(u.id)}
                        className="text-blue-700 hover:underline font-medium"
                      >
                        Switch Role
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Calculation Engine Assumptions (Admin Editable) */}
      <form onSubmit={handleSaveAssumptions} className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Venture Financial Engine Assumptions</h2>
            <p className="text-xs text-slate-500">
              Base pricing and cost parameters driving break-even, contribution margin, and TAM/SAM/SOM calculations.
            </p>
          </div>
          {!isAdmin && <StatusText label="Admin permission required to edit" tone="warning" />}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-600 mb-1">Selling Price (₹/mo)</label>
            <input
              type="number"
              disabled={!isAdmin}
              value={assumptionsForm.sellingPrice}
              onChange={(e) => setAssumptionsForm({ ...assumptionsForm, sellingPrice: Number(e.target.value) })}
              className="w-full border border-slate-200 rounded px-3 py-2 font-mono-num disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Variable Cost / Customer (₹/mo)</label>
            <input
              type="number"
              disabled={!isAdmin}
              value={assumptionsForm.variableCostPerCustomer}
              onChange={(e) =>
                setAssumptionsForm({ ...assumptionsForm, variableCostPerCustomer: Number(e.target.value) })
              }
              className="w-full border border-slate-200 rounded px-3 py-2 font-mono-num disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Expected Base Customers</label>
            <input
              type="number"
              disabled={!isAdmin}
              value={assumptionsForm.expectedCustomers}
              onChange={(e) =>
                setAssumptionsForm({ ...assumptionsForm, expectedCustomers: Number(e.target.value) })
              }
              className="w-full border border-slate-200 rounded px-3 py-2 font-mono-num disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Monthly Fixed Cost (₹)</label>
            <input
              type="number"
              disabled={!isAdmin}
              value={assumptionsForm.monthlyFixedCost}
              onChange={(e) =>
                setAssumptionsForm({ ...assumptionsForm, monthlyFixedCost: Number(e.target.value) })
              }
              className="w-full border border-slate-200 rounded px-3 py-2 font-mono-num disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1">TAM Potential Customers</label>
            <input
              type="number"
              disabled={!isAdmin}
              value={assumptionsForm.tamCustomers}
              onChange={(e) => setAssumptionsForm({ ...assumptionsForm, tamCustomers: Number(e.target.value) })}
              className="w-full border border-slate-200 rounded px-3 py-2 font-mono-num disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">SAM Serviceable Customers</label>
            <input
              type="number"
              disabled={!isAdmin}
              value={assumptionsForm.samCustomers}
              onChange={(e) => setAssumptionsForm({ ...assumptionsForm, samCustomers: Number(e.target.value) })}
              className="w-full border border-slate-200 rounded px-3 py-2 font-mono-num disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">SOM Obtainable Customers</label>
            <input
              type="number"
              disabled={!isAdmin}
              value={assumptionsForm.somCustomers}
              onChange={(e) => setAssumptionsForm({ ...assumptionsForm, somCustomers: Number(e.target.value) })}
              className="w-full border border-slate-200 rounded px-3 py-2 font-mono-num disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Annual Spend / Customer (₹)</label>
            <input
              type="number"
              disabled={!isAdmin}
              value={assumptionsForm.annualSpendPerCustomer}
              onChange={(e) =>
                setAssumptionsForm({ ...assumptionsForm, annualSpendPerCustomer: Number(e.target.value) })
              }
              className="w-full border border-slate-200 rounded px-3 py-2 font-mono-num disabled:bg-slate-50"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="font-mono-num text-slate-700 space-x-4">
            <span>Expected Rev: {formatINR(financials.baselineExpectedRevenue)}</span>
            <span>·</span>
            <span>Surplus: {formatINR(financials.baselineOperatingSurplus)}</span>
            <span>·</span>
            <span>Margin: {formatPct(financials.baselineContributionMarginPct)}</span>
            <span>·</span>
            <span>Break-Even: ~{financials.baselineBreakEvenCustomers} cust.</span>
          </div>
          {isAdmin && (
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md"
            >
              Update Financial Engine
            </button>
          )}
        </div>
      </form>

      {/* Google Sheets / Relational Database Export */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-700" />
          Relational Tables & Google Sheets CSV Export (10 Tables)
        </h2>
        <p className="text-xs text-slate-500">
          Export any structured table directly to CSV for Google Sheets / AppSheet sync, or download the relational schema blueprint.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => downloadCSV('Customers.csv', db.customers as unknown as Record<string, unknown>[])}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded hover:bg-slate-50"
          >
            Customers ({db.customers.length})
          </button>
          <button
            onClick={() => downloadCSV('Leads.csv', db.leads as unknown as Record<string, unknown>[])}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded hover:bg-slate-50"
          >
            Leads ({db.leads.length})
          </button>
          <button
            onClick={() => downloadCSV('Subscriptions.csv', db.subscriptions as unknown as Record<string, unknown>[])}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded hover:bg-slate-50"
          >
            Subscriptions ({db.subscriptions.length})
          </button>
          <button
            onClick={() =>
              downloadCSV('RevenueTransactions.csv', db.revenueTransactions as unknown as Record<string, unknown>[])
            }
            className="px-3 py-1.5 text-xs border border-slate-200 rounded hover:bg-slate-50"
          >
            Revenue ({db.revenueTransactions.length})
          </button>
          <button
            onClick={() =>
              downloadCSV('ExpenseTransactions.csv', db.expenseTransactions as unknown as Record<string, unknown>[])
            }
            className="px-3 py-1.5 text-xs border border-slate-200 rounded hover:bg-slate-50"
          >
            Expenses ({db.expenseTransactions.length})
          </button>
          <button
            onClick={exportSchemaBlueprint}
            className="px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 bg-blue-50/40 rounded hover:bg-blue-50"
          >
            Download Schema JSON
          </button>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal open={userModalOpen} title="Add Team User" onClose={() => setUserModalOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addUser(newUser);
            setUserModalOpen(false);
            setNewUser({ ...newUser, name: '', email: '' });
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="block text-slate-600 mb-1">Full Name *</label>
            <input
              required
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="w-full border border-slate-200 rounded px-2.5 py-2"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Email *</label>
            <input
              required
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full border border-slate-200 rounded px-2.5 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 bg-white"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="FINANCE MANAGER">FINANCE MANAGER</option>
                <option value="SALES MANAGER">SALES MANAGER</option>
                <option value="EXECUTIVE">EXECUTIVE</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Department</label>
              <input
                value={newUser.department}
                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                className="w-full border border-slate-200 rounded px-2.5 py-2"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setUserModalOpen(false)} className="px-4 py-2 text-slate-600">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white bg-blue-700 hover:bg-blue-800 rounded-md">
              Create User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
