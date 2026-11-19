import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useApex } from '../../context/ApexContext';
import { ExpenseCategory, ExpenseType } from '../../types/apex';
import { formatINR, formatPct } from '../../utils/formatters';
import { KpiCard, Modal, SectionHeader } from '../ui/DataPrimitives';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Fixed Expenses',
  'Variable Expenses',
  'Employee Salaries',
  'Cloud Hosting',
  'API Integration Costs',
  'Marketing Expenses',
  'Administrative Expenses',
  'Other Operational Expenses',
];

export function FinancialManagementView() {
  const { db, financials, canEditSection, addRevenueTransaction, addExpenseTransaction } = useApex();
  const editable = canEditSection('financials');

  const [tab, setTab] = useState<'profitability' | 'revenue' | 'expenses'>('profitability');
  const [periodGranularity, setPeriodGranularity] = useState<'Monthly' | 'Quarterly' | 'Annual'>('Monthly');
  const [revModalOpen, setRevModalOpen] = useState(false);
  const [expModalOpen, setExpModalOpen] = useState(false);

  const [revForm, setRevForm] = useState({
    date: '2026-11-19',
    customerId: db.customers[0]?.id || '',
    subscriptionId: db.subscriptions[0]?.id || '',
    category: 'Subscription Revenue' as 'Subscription Revenue' | 'Other Revenue',
    amount: 25000,
    notes: '',
  });

  const [expForm, setExpForm] = useState({
    date: '2026-11-19',
    category: 'Cloud Hosting' as ExpenseCategory,
    expenseType: 'Fixed' as ExpenseType,
    amount: 15000,
    vendor: '',
    notes: '',
  });

  const periodSummary = useMemo(() => {
    const groups = new Map<string, { rev: number; fixed: number; variable: number; other: number }>();

    const getKey = (date: string, month: string, quarter: string) => {
      if (periodGranularity === 'Monthly') return month;
      if (periodGranularity === 'Quarterly') return quarter;
      return date.slice(0, 4);
    };

    for (const r of db.revenueTransactions) {
      const k = getKey(r.date, r.month, r.quarter);
      const cur = groups.get(k) || { rev: 0, fixed: 0, variable: 0, other: 0 };
      cur.rev += r.amount;
      groups.set(k, cur);
    }

    for (const e of db.expenseTransactions) {
      const k = getKey(e.date, e.month, e.quarter);
      const cur = groups.get(k) || { rev: 0, fixed: 0, variable: 0, other: 0 };
      if (e.expenseType === 'Fixed') cur.fixed += e.amount;
      else if (e.expenseType === 'Variable') cur.variable += e.amount;
      else cur.other += e.amount;
      groups.set(k, cur);
    }

    return Array.from(groups.entries())
      .map(([period, v]) => {
        const totalExp = v.fixed + v.variable + v.other;
        return {
          period,
          revenue: v.rev,
          fixed: v.fixed,
          variable: v.variable,
          other: v.other,
          totalExp,
          surplus: v.rev - totalExp,
        };
      })
      .sort((a, b) => b.period.localeCompare(a.period));
  }, [db.revenueTransactions, db.expenseTransactions, periodGranularity]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Financial Management & Profitability"
        subtitle="Automated revenue ledger, expense categorization, and unit economics engine · DEMO DATA"
        actions={
          editable && (
            <>
              <button
                onClick={() => setRevModalOpen(true)}
                className="px-3 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Log Revenue
              </button>
              <button
                onClick={() => setExpModalOpen(true)}
                className="px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-md flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Log Expense
              </button>
            </>
          )
        }
      />

      {/* Core Accounting Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Cumulative Revenue"
          value={formatINR(financials.totalRevenue)}
          subtext={`Sub: ${formatINR(financials.subscriptionRevenue, true)} · Other: ${formatINR(financials.otherRevenue, true)}`}
        />
        <KpiCard
          label="Total Cumulative Expenses"
          value={formatINR(financials.totalExpenses)}
          subtext={`Fixed ${formatINR(financials.fixedExpenses, true)} · Var ${formatINR(financials.variableExpenses, true)}`}
        />
        <KpiCard
          label="Cumulative Operating Surplus"
          value={formatINR(financials.operatingSurplus)}
          subtext="Total Revenue − Total Expenses"
          trend={{
            text: financials.operatingSurplus >= 0 ? 'Net Positive' : 'Net Deficit',
            positive: financials.operatingSurplus >= 0,
            negative: financials.operatingSurplus < 0,
          }}
        />
        <KpiCard
          label="Contribution Per Customer"
          value={formatINR(financials.contributionPerCustomer)}
          subtext={`${formatPct(financials.contributionMarginPct)} margin · Break-even: ${financials.breakEvenCustomers} cust.`}
        />
      </div>

      {/* Module Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white border border-slate-200 rounded-lg p-3">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'profitability', label: 'Profitability & Period Summary' },
            { id: 'revenue', label: `Revenue Ledger (${db.revenueTransactions.length})` },
            { id: 'expenses', label: `Expense Ledger (${db.expenseTransactions.length})` },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as typeof tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === item.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'profitability' && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
            {(['Monthly', 'Quarterly', 'Annual'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setPeriodGranularity(g)}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  periodGranularity === g ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'profitability' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">{periodGranularity} P&L Statement</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Period</th>
                    <th className="text-right py-3 px-3 font-semibold">Total Revenue</th>
                    <th className="text-right py-3 px-3 font-semibold">Fixed Expenses</th>
                    <th className="text-right py-3 px-3 font-semibold">Variable Expenses</th>
                    <th className="text-right py-3 px-3 font-semibold">Other OpEx</th>
                    <th className="text-right py-3 px-3 font-semibold">Total Expenses</th>
                    <th className="text-right py-3 px-4 font-semibold">Operating Surplus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono-num">
                  {periodSummary.map((row) => (
                    <tr key={row.period} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{row.period}</td>
                      <td className="py-2.5 px-3 text-right text-slate-900">{formatINR(row.revenue)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{formatINR(row.fixed)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{formatINR(row.variable)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{formatINR(row.other)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-800">{formatINR(row.totalExp)}</td>
                      <td
                        className={`py-2.5 px-4 text-right font-semibold ${
                          row.surplus >= 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {formatINR(row.surplus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formula Audit Box */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Automated Unit Economics Formulas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-slate-500">Contribution Per Customer</div>
                <div className="font-mono-num font-semibold text-slate-900 mt-1">
                  {formatINR(db.assumptions.sellingPrice)} − {formatINR(db.assumptions.variableCostPerCustomer)} ={' '}
                  {formatINR(financials.baselineContributionPerCustomer)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-slate-500">Contribution Margin (%)</div>
                <div className="font-mono-num font-semibold text-slate-900 mt-1">
                  ({formatINR(financials.baselineContributionPerCustomer)} / {formatINR(db.assumptions.sellingPrice)}) × 100 ={' '}
                  {formatPct(financials.baselineContributionMarginPct)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-slate-500">Break-Even Customers</div>
                <div className="font-mono-num font-semibold text-blue-700 mt-1">
                  {formatINR(db.assumptions.monthlyFixedCost)} / {formatINR(financials.baselineContributionPerCustomer)} ≈{' '}
                  {financials.baselineBreakEvenCustomers} customers
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'revenue' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Transaction ID</th>
                  <th className="text-left py-3 px-3 font-semibold">Date</th>
                  <th className="text-left py-3 px-3 font-semibold">Customer</th>
                  <th className="text-left py-3 px-3 font-semibold">Category</th>
                  <th className="text-right py-3 px-3 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.revenueTransactions.map((r) => {
                  const cust = db.customers.find((c) => c.id === r.customerId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono-num font-medium text-slate-900">{r.id}</td>
                      <td className="py-2.5 px-3 font-mono-num text-slate-600">{r.date}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{cust?.companyName || r.customerId}</td>
                      <td className="py-2.5 px-3 text-slate-700">{r.category}</td>
                      <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-emerald-700">
                        {formatINR(r.amount)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{r.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Expense ID</th>
                  <th className="text-left py-3 px-3 font-semibold">Date</th>
                  <th className="text-left py-3 px-3 font-semibold">Category</th>
                  <th className="text-left py-3 px-3 font-semibold">Type</th>
                  <th className="text-left py-3 px-3 font-semibold">Vendor</th>
                  <th className="text-right py-3 px-3 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.expenseTransactions.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono-num font-medium text-slate-900">{e.id}</td>
                    <td className="py-2.5 px-3 font-mono-num text-slate-600">{e.date}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{e.category}</td>
                    <td className="py-2.5 px-3 text-slate-600">{e.expenseType}</td>
                    <td className="py-2.5 px-3 text-slate-700">{e.vendor}</td>
                    <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-red-700">
                      {formatINR(e.amount)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{e.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Revenue Modal */}
      <Modal open={revModalOpen} title="Log Revenue Transaction" onClose={() => setRevModalOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addRevenueTransaction(revForm);
            setRevModalOpen(false);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={revForm.date}
                onChange={(e) => setRevForm({ ...revForm, date: e.target.value })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 font-mono-num"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Category</label>
              <select
                value={revForm.category}
                onChange={(e) =>
                  setRevForm({
                    ...revForm,
                    category: e.target.value as 'Subscription Revenue' | 'Other Revenue',
                  })
                }
                className="w-full border border-slate-200 rounded px-2.5 py-2 bg-white"
              >
                <option value="Subscription Revenue">Subscription Revenue</option>
                <option value="Other Revenue">Other Revenue</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Customer</label>
              <select
                value={revForm.customerId}
                onChange={(e) => setRevForm({ ...revForm, customerId: e.target.value })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 bg-white"
              >
                {db.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                value={revForm.amount}
                onChange={(e) => setRevForm({ ...revForm, amount: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 font-mono-num"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Notes</label>
            <input
              value={revForm.notes}
              onChange={(e) => setRevForm({ ...revForm, notes: e.target.value })}
              className="w-full border border-slate-200 rounded px-2.5 py-2"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setRevModalOpen(false)} className="px-4 py-2 text-slate-600">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white bg-blue-700 hover:bg-blue-800 rounded-md">
              Save Revenue
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Expense Modal */}
      <Modal open={expModalOpen} title="Log Expense Transaction" onClose={() => setExpModalOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addExpenseTransaction(expForm);
            setExpModalOpen(false);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={expForm.date}
                onChange={(e) => setExpForm({ ...expForm, date: e.target.value })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 font-mono-num"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Expense Type</label>
              <select
                value={expForm.expenseType}
                onChange={(e) => setExpForm({ ...expForm, expenseType: e.target.value as ExpenseType })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 bg-white"
              >
                <option value="Fixed">Fixed</option>
                <option value="Variable">Variable</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Category</label>
              <select
                value={expForm.category}
                onChange={(e) => setExpForm({ ...expForm, category: e.target.value as ExpenseCategory })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 bg-white"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                value={expForm.amount}
                onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 font-mono-num"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Vendor *</label>
            <input
              required
              value={expForm.vendor}
              onChange={(e) => setExpForm({ ...expForm, vendor: e.target.value })}
              placeholder="e.g. AWS Mumbai Region"
              className="w-full border border-slate-200 rounded px-2.5 py-2"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Notes</label>
            <input
              value={expForm.notes}
              onChange={(e) => setExpForm({ ...expForm, notes: e.target.value })}
              className="w-full border border-slate-200 rounded px-2.5 py-2"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setExpModalOpen(false)} className="px-4 py-2 text-slate-600">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white bg-blue-700 hover:bg-blue-800 rounded-md">
              Save Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
