import React from 'react';
import { useApex } from '../../context/ApexContext';
import { formatINR, formatPct } from '../../utils/formatters';
import { KpiCard, SectionHeader } from '../ui/DataPrimitives';
import { BreakEvenChart, LineTrendChart } from '../charts/FinanceCharts';

export function BusinessAnalyticsView() {
  const { db, financials } = useApex();

  const series = financials.monthlySeries;
  const lastRev = series[series.length - 1]?.revenue || 0;
  const prevRev = series[series.length - 2]?.revenue || lastRev;
  const revenueGrowth = prevRev > 0 ? ((lastRev - prevRev) / prevRev) * 100 : 0;

  const lastExp = series[series.length - 1]?.expenses || 0;
  const prevExp = series[series.length - 2]?.expenses || lastExp;
  const expenseGrowth = prevExp > 0 ? ((lastExp - prevExp) / prevExp) * 100 : 0;

  const scenarios = [
    {
      name: 'Conservative',
      customers: 8,
      price: 20000,
      variable: 3000,
      fixed: 120000,
      notes: 'Early-stage startup adoption, minimal AWS cluster',
    },
    {
      name: 'Base (Venture Target)',
      customers: db.assumptions.expectedCustomers,
      price: db.assumptions.sellingPrice,
      variable: db.assumptions.variableCostPerCustomer,
      fixed: db.assumptions.monthlyFixedCost,
      notes: 'Steady Indian mid-market SaaS adoption across Tier-1 hubs',
    },
    {
      name: 'Ambitious',
      customers: 45,
      price: 30000,
      variable: 3000,
      fixed: 200000,
      notes: 'Strong referral momentum, upper-tier adoption, support scaling',
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Business Performance Analytics"
        subtitle="Growth velocity, break-even sensitivity, retention, and scenario modeling · DEMO DATA"
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Revenue Growth (MoM)"
          value={formatPct(revenueGrowth)}
          subtext={`Nov vs Oct (${formatINR(lastRev, true)})`}
          trend={{ text: revenueGrowth >= 0 ? 'Expanding' : 'Contracting', positive: revenueGrowth >= 0 }}
        />
        <KpiCard
          label="Customer Growth (MoM)"
          value={formatPct(financials.customerGrowthRate)}
          subtext={`${financials.paidCustomers} active paid logos`}
        />
        <KpiCard
          label="Expense Growth (MoM)"
          value={formatPct(expenseGrowth)}
          subtext={`Nov OpEx: ${formatINR(lastExp, true)}`}
          trend={{ text: expenseGrowth <= revenueGrowth ? 'Healthy leverage' : 'Watch OpEx', positive: expenseGrowth <= revenueGrowth }}
        />
        <KpiCard
          label="Customer Retention"
          value={formatPct(financials.retentionRate)}
          subtext="Active paid vs churned ratio"
          trend={{ text: 'Low churn', positive: financials.retentionRate >= 90 }}
        />
        <KpiCard
          label="Sales Conversion Rate"
          value={formatPct(financials.leadConversionRate)}
          subtext={`Demo conv: ${formatPct(financials.demoConversionRate)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Break-Even Analysis Curve</h2>
              <p className="text-xs text-slate-500">
                Revenue ({formatINR(db.assumptions.sellingPrice)}/cust) vs. Total Cost (
                {formatINR(db.assumptions.monthlyFixedCost)} fixed + {formatINR(db.assumptions.variableCostPerCustomer)}/cust)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-emerald-600 inline-block" /> Revenue
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-red-600 inline-block" /> Total Cost
              </span>
            </div>
          </div>
          <BreakEvenChart
            sellingPrice={db.assumptions.sellingPrice}
            variableCost={db.assumptions.variableCostPerCustomer}
            fixedCost={db.assumptions.monthlyFixedCost}
            currentCustomers={financials.paidCustomers}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Monthly Operating Surplus Trajectory</h2>
            <p className="text-xs text-slate-500">Net monthly profitability after fixed & variable expenses</p>
          </div>
          <LineTrendChart data={series} valueKey="surplus" color="#16a34a" isCurrency />
        </div>
      </div>

      {/* Scenario Modeling Matrix from Venture Plan */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Venture Scenario Financial Comparison</h2>
          <p className="text-xs text-slate-500">Conservative, Base, and Ambitious monthly unit economics models</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="text-left py-3 px-4 font-semibold">Scenario</th>
                <th className="text-right py-3 px-3 font-semibold">Customers</th>
                <th className="text-right py-3 px-3 font-semibold">Price / Mo</th>
                <th className="text-right py-3 px-3 font-semibold">Monthly Revenue</th>
                <th className="text-right py-3 px-3 font-semibold">Fixed Cost</th>
                <th className="text-right py-3 px-3 font-semibold">Variable Cost</th>
                <th className="text-right py-3 px-3 font-semibold">Operating Surplus</th>
                <th className="text-right py-3 px-4 font-semibold">Break-Even</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono-num">
              {scenarios.map((sc) => {
                const rev = sc.customers * sc.price;
                const varCost = sc.customers * sc.variable;
                const surplus = rev - sc.fixed - varCost;
                const be = Math.ceil(sc.fixed / (sc.price - sc.variable));
                return (
                  <tr key={sc.name} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-900">{sc.name}</div>
                      <div className="text-slate-500">{sc.notes}</div>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-800">{sc.customers}</td>
                    <td className="py-3 px-3 text-right text-slate-800">{formatINR(sc.price)}</td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900">{formatINR(rev)}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{formatINR(sc.fixed)}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{formatINR(varCost)}</td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-700">{formatINR(surplus)}</td>
                    <td className="py-3 px-4 text-right text-blue-700">{be} cust.</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
