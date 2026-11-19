import React from 'react';
import { ArrowUpRight, AlertTriangle, CalendarClock } from 'lucide-react';
import { useApex } from '../../context/ApexContext';
import { formatINR, formatPct } from '../../utils/formatters';
import { KpiCard, SectionHeader } from '../ui/DataPrimitives';
import { LineTrendChart, RevenueExpenseBarChart } from '../charts/FinanceCharts';

export function ExecutiveDashboardView() {
  const { db, financials, alerts, setActiveSection } = useApex();

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Executive Financial Dashboard"
        subtitle="Live unit economics, recurring revenue, and operating surplus calculated from underlying tables · DEMO DATA"
        actions={
          <button
            onClick={() => setActiveSection('reports')}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors whitespace-nowrap"
          >
            Generate Executive Report
          </button>
        }
      />

      {/* Primary KPI Grid (12 Dynamic Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Monthly Recurring Revenue (MRR)"
          value={formatINR(financials.mrr)}
          subtext={`Target Base: ${formatINR(financials.baselineExpectedRevenue)}`}
          trend={{
            text: `${financials.activeSubscriptions} active plans`,
            positive: true,
          }}
        />
        <KpiCard
          label="Annual Recurring Revenue (ARR)"
          value={formatINR(financials.arr)}
          subtext="Annualized from active subscriptions"
          trend={{ text: '12× MRR', positive: true }}
        />
        <KpiCard
          label="Total Cumulative Revenue"
          value={formatINR(financials.totalRevenue)}
          subtext={`Sub: ${formatINR(financials.subscriptionRevenue, true)} · Other: ${formatINR(financials.otherRevenue, true)}`}
        />
        <KpiCard
          label="Monthly Profitability (Nov)"
          value={formatINR(financials.monthlyProfitability)}
          subtext={`Rev ${formatINR(financials.currentMonthRevenue, true)} − Exp ${formatINR(financials.currentMonthOperatingExpenses, true)}`}
          trend={{
            text: financials.monthlyProfitability >= 0 ? 'Surplus' : 'Deficit',
            positive: financials.monthlyProfitability >= 0,
            negative: financials.monthlyProfitability < 0,
          }}
        />

        <KpiCard
          label="Total Customers"
          value={String(financials.totalCustomers)}
          subtext={`${financials.paidCustomers} Paid · ${financials.trialCustomers} Trial`}
          trend={{
            text: `+${formatPct(financials.customerGrowthRate, 1)} MoM`,
            positive: financials.customerGrowthRate >= 0,
          }}
        />
        <KpiCard
          label="Active Subscriptions"
          value={String(financials.activeSubscriptions)}
          subtext={`${financials.overdueSubscriptions} overdue payment alert`}
          trend={{
            text: financials.overdueSubscriptions > 0 ? 'Action needed' : 'All current',
            negative: financials.overdueSubscriptions > 0,
            positive: financials.overdueSubscriptions === 0,
          }}
        />
        <KpiCard
          label="Monthly Operating Expenses"
          value={formatINR(financials.currentMonthOperatingExpenses)}
          subtext={`Fixed ${formatINR(db.assumptions.monthlyFixedCost, true)} · Var ${formatINR(financials.paidCustomers * db.assumptions.variableCostPerCustomer, true)}`}
        />
        <KpiCard
          label="Total Variable Costs (Cumulative)"
          value={formatINR(financials.variableExpenses)}
          subtext={`${formatINR(db.assumptions.variableCostPerCustomer)} per customer/mo`}
        />

        <KpiCard
          label="Contribution Margin"
          value={formatPct(financials.contributionMarginPct)}
          subtext={`${formatINR(financials.contributionPerCustomer)} contribution/customer`}
          trend={{ text: `Break-even: ${financials.breakEvenCustomers} cust.`, positive: true }}
        />
        <KpiCard
          label="Cumulative Operating Surplus"
          value={formatINR(financials.operatingSurplus)}
          subtext={`Total Rev − Total Exp (${formatINR(financials.totalExpenses, true)})`}
          trend={{
            text: financials.operatingSurplus >= 0 ? 'Positive' : 'Negative',
            positive: financials.operatingSurplus >= 0,
            negative: financials.operatingSurplus < 0,
          }}
        />
        <KpiCard
          label="Customer Acquisition Cost (CAC)"
          value={formatINR(financials.cac)}
          subtext={`Target CAC: ₹35,000 · LTV: ${formatINR(financials.contributionPerCustomer * 24, true)}`}
          trend={{
            text: financials.cac <= 35000 ? 'Within target' : 'Above target',
            positive: financials.cac <= 35000,
            negative: financials.cac > 35000,
          }}
        />
        <KpiCard
          label="Customer Growth Rate (MoM)"
          value={formatPct(financials.customerGrowthRate)}
          subtext="Net paid logo expansion month-over-month"
          trend={{
            text: `${financials.leadConversionRate.toFixed(1)}% lead-to-paid`,
            positive: true,
          }}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Revenue vs. Operating Expenses</h2>
              <p className="text-xs text-slate-500">6-month cashflow comparison (June – November 2026)</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue-700 rounded-xs inline-block" /> Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-slate-900 rounded-xs inline-block" /> Expenses
              </span>
            </div>
          </div>
          <RevenueExpenseBarChart data={financials.monthlySeries} />
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Expense Composition</h2>
            <p className="text-xs text-slate-500 mb-4">Cumulative operating expenditure by category</p>
            <div className="space-y-3">
              {financials.expenseByCategory.slice(0, 6).map((item) => (
                <div key={item.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 font-medium truncate">{item.category}</span>
                    <span className="font-mono-num text-slate-900">
                      {formatINR(item.amount, true)} ({item.pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-800 rounded-full"
                      style={{ width: `${Math.min(100, item.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setActiveSection('financials')}
            className="mt-4 text-xs font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1 self-start"
          >
            Inspect Financial Ledger <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Charts Row 2: Subscription Growth & Customer Acquisition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Subscription Revenue Trend (MRR)</h2>
            <p className="text-xs text-slate-500">Monthly recurring billing trajectory</p>
          </div>
          <LineTrendChart data={financials.monthlySeries} valueKey="mrr" color="#1d4ed8" isCurrency />
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Paid Customer Acquisition</h2>
            <p className="text-xs text-slate-500">Cumulative paying logos over 6 months (Target Base: {db.assumptions.expectedCustomers})</p>
          </div>
          <LineTrendChart
            data={financials.monthlySeries}
            valueKey="customers"
            color="#16a34a"
            isCurrency={false}
          />
        </div>
      </div>

      {/* Automated Workflows & Venture Plan Validation Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Automated Workflow Notifications</h2>
              <p className="text-xs text-slate-500">Live renewal, overdue payment, follow-up, and task alerts</p>
            </div>
            <span className="text-xs font-mono-num text-slate-500">{alerts.length} active</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">All workflows nominal. No pending alerts.</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {alert.severity === 'critical' ? (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    ) : (
                      <CalendarClock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{alert.title}</div>
                      <div className="text-xs text-slate-500">{alert.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSection(alert.targetSection)}
                    className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap shrink-0"
                  >
                    Open
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Venture Plan Baseline Validation</h2>
              <p className="text-xs text-slate-500">Live November metrics vs. DGU Venture Quest base model</p>
            </div>
            <button
              onClick={() => setActiveSection('settings')}
              className="text-xs font-medium text-blue-700 hover:underline"
            >
              Configure Model
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="text-left py-2 font-medium">Metric</th>
                  <th className="text-right py-2 font-medium">Venture Base</th>
                  <th className="text-right py-2 font-medium">Live Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono-num">
                <tr>
                  <td className="py-2 font-sans text-slate-700">Paid Customers</td>
                  <td className="py-2 text-right text-slate-600">{db.assumptions.expectedCustomers}</td>
                  <td className="py-2 text-right font-semibold text-slate-900">{financials.paidCustomers}</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans text-slate-700">Monthly Revenue</td>
                  <td className="py-2 text-right text-slate-600">{formatINR(financials.baselineExpectedRevenue)}</td>
                  <td className="py-2 text-right font-semibold text-slate-900">{formatINR(financials.currentMonthRevenue)}</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans text-slate-700">Monthly Operating Cost</td>
                  <td className="py-2 text-right text-slate-600">{formatINR(financials.baselineTotalOperatingCost)}</td>
                  <td className="py-2 text-right font-semibold text-slate-900">{formatINR(financials.currentMonthOperatingExpenses)}</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans text-slate-700">Operating Surplus</td>
                  <td className="py-2 text-right text-slate-600">{formatINR(financials.baselineOperatingSurplus)}</td>
                  <td className="py-2 text-right font-semibold text-emerald-700">{formatINR(financials.monthlyProfitability)}</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans text-slate-700">Contribution Margin</td>
                  <td className="py-2 text-right text-slate-600">{formatPct(financials.baselineContributionMarginPct)}</td>
                  <td className="py-2 text-right font-semibold text-slate-900">{formatPct(financials.contributionMarginPct)}</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans text-slate-700">Break-Even Threshold</td>
                  <td className="py-2 text-right text-slate-600">~{financials.baselineBreakEvenCustomers} customers</td>
                  <td className="py-2 text-right font-semibold text-blue-700">{financials.breakEvenCustomers} customers</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
