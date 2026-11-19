import React, { useMemo, useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { useApex } from '../../context/ApexContext';
import { BillingFrequency, PaymentStatus, PlanName, SubscriptionStatus } from '../../types/apex';
import { PLAN_PRICES } from '../../utils/financialEngine';
import { daysUntil, formatINR } from '../../utils/formatters';
import { KpiCard, Modal, SectionHeader, StatusText } from '../ui/DataPrimitives';

export function SubscriptionsView() {
  const { db, financials, canEditSection, addSubscription, markSubscriptionPaid, updateSubscriptionStatus } =
    useApex();
  const editable = canEditSection('subscriptions');

  const [filter, setFilter] = useState<'All' | 'Active' | 'Overdue' | 'Upcoming Renewals' | 'Trial'>('All');
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    customerId: db.customers[0]?.id || '',
    planName: 'Standard' as PlanName,
    startDate: '2026-11-19',
    endDate: '2027-11-18',
    billingFrequency: 'Monthly' as BillingFrequency,
    amount: 25000,
    paymentStatus: 'Paid' as PaymentStatus,
    renewalDate: '2026-12-19',
    status: 'Active' as SubscriptionStatus,
  });

  const upcomingCount = db.subscriptions.filter(
    (s) => s.status === 'Active' && daysUntil(s.renewalDate) <= 14 && daysUntil(s.renewalDate) >= 0
  ).length;

  const filtered = useMemo(() => {
    return db.subscriptions.filter((s) => {
      if (filter === 'Active') return s.status === 'Active';
      if (filter === 'Overdue') return s.paymentStatus === 'Overdue';
      if (filter === 'Trial') return s.status === 'Trial';
      if (filter === 'Upcoming Renewals')
        return s.status === 'Active' && daysUntil(s.renewalDate) <= 14 && daysUntil(s.renewalDate) >= 0;
      return true;
    });
  }, [db.subscriptions, filter]);

  const planDistribution = (['Conservative', 'Standard', 'Premium'] as PlanName[]).map((plan) => {
    const matching = db.subscriptions.filter((s) => s.planName === plan && s.status === 'Active');
    return {
      plan,
      price: PLAN_PRICES[plan],
      count: matching.length,
      mrr: matching.reduce((acc, s) => acc + s.amount, 0),
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSubscription(form);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Subscription & Revenue Management"
        subtitle="Manage Conservative, Standard, and Premium plans, billing renewals, and payment collection · DEMO DATA"
        actions={
          editable && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Subscription
            </button>
          )
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Monthly Recurring Revenue"
          value={formatINR(financials.mrr)}
          subtext={`ARR: ${formatINR(financials.arr)}`}
        />
        <KpiCard
          label="Active Paid Subscriptions"
          value={String(financials.activeSubscriptions)}
          subtext={`Variable cost: ${formatINR(db.assumptions.variableCostPerCustomer)}/cust`}
        />
        <KpiCard
          label="Upcoming Renewals (14d)"
          value={String(upcomingCount)}
          subtext="Automated reminder queue"
          trend={{ text: upcomingCount > 0 ? 'Due soon' : 'None due', positive: upcomingCount === 0 }}
        />
        <KpiCard
          label="Overdue Payments"
          value={String(financials.overdueSubscriptions)}
          subtext="Requires collection follow-up"
          trend={{
            text: financials.overdueSubscriptions > 0 ? 'Action needed' : 'All settled',
            negative: financials.overdueSubscriptions > 0,
            positive: financials.overdueSubscriptions === 0,
          }}
        />
      </div>

      {/* Pricing Tiers Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {planDistribution.map((tier) => (
          <div key={tier.plan} className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-slate-900">{tier.plan} Plan</h3>
              <span className="text-sm font-semibold font-mono-num text-blue-700">
                {formatINR(tier.price)}/mo
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {tier.plan === 'Conservative'
                ? 'For early-stage startups · Core CSV dashboarding'
                : tier.plan === 'Standard'
                  ? 'For mid-market SaaS teams · Automated board decks'
                  : 'For scaling finance orgs · Multi-entity & custom KPIs'}
            </p>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-mono-num">
              <span className="text-slate-600">{tier.count} active accounts</span>
              <span className="font-semibold text-slate-900">MRR: {formatINR(tier.mrr)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-1.5 flex-wrap bg-white border border-slate-200 rounded-lg p-3">
        {(['All', 'Active', 'Upcoming Renewals', 'Overdue', 'Trial'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === tab ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="text-left py-3 px-4 font-semibold">Subscription ID</th>
                <th className="text-left py-3 px-3 font-semibold">Customer</th>
                <th className="text-left py-3 px-3 font-semibold">Plan & Cycle</th>
                <th className="text-right py-3 px-3 font-semibold">Amount</th>
                <th className="text-left py-3 px-3 font-semibold">Payment Status</th>
                <th className="text-left py-3 px-3 font-semibold">Renewal Date</th>
                <th className="text-left py-3 px-3 font-semibold">Status</th>
                <th className="text-right py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((sub) => {
                const cust = db.customers.find((c) => c.id === sub.customerId);
                return (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono-num font-medium text-slate-900">{sub.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{cust?.companyName || sub.customerId}</div>
                      <div className="text-slate-500 font-mono-num">{sub.customerId}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {sub.planName} · {sub.billingFrequency}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-slate-900">
                      {formatINR(sub.amount)}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusText
                        label={sub.paymentStatus}
                        tone={
                          sub.paymentStatus === 'Paid'
                            ? 'positive'
                            : sub.paymentStatus === 'Overdue'
                              ? 'negative'
                              : 'warning'
                        }
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono-num text-slate-600">{sub.renewalDate}</td>
                    <td className="py-2.5 px-3">
                      {editable ? (
                        <select
                          value={sub.status}
                          onChange={(e) =>
                            updateSubscriptionStatus(sub.id, e.target.value as SubscriptionStatus)
                          }
                          className="border border-slate-200 rounded px-2 py-1 text-xs bg-white"
                        >
                          <option value="Active">Active</option>
                          <option value="Trial">Trial</option>
                          <option value="Paused">Paused</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <StatusText label={sub.status} tone={sub.status === 'Active' ? 'positive' : 'neutral'} />
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {editable && sub.paymentStatus !== 'Paid' ? (
                        <button
                          onClick={() => markSubscriptionPaid(sub.id)}
                          className="text-emerald-700 hover:underline font-medium inline-flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Record Payment
                        </button>
                      ) : (
                        <span className="text-slate-400">Settled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} title="Create Subscription" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 mb-1">Customer</label>
            <select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className="w-full border border-slate-200 rounded px-2.5 py-2 bg-white"
            >
              {db.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.id})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Plan Tier</label>
              <select
                value={form.planName}
                onChange={(e) => {
                  const plan = e.target.value as PlanName;
                  setForm({ ...form, planName: plan, amount: PLAN_PRICES[plan] });
                }}
                className="w-full border border-slate-200 rounded px-2.5 py-2 bg-white"
              >
                <option value="Conservative">Conservative (₹20,000)</option>
                <option value="Standard">Standard (₹25,000)</option>
                <option value="Premium">Premium (₹30,000)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Billing Frequency</label>
              <select
                value={form.billingFrequency}
                onChange={(e) => setForm({ ...form, billingFrequency: e.target.value as BillingFrequency })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 bg-white"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annual">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 font-mono-num"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Renewal Date</label>
              <input
                type="date"
                value={form.renewalDate}
                onChange={(e) => setForm({ ...form, renewalDate: e.target.value })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 font-mono-num"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-slate-600">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white bg-blue-700 hover:bg-blue-800 rounded-md">
              Create Subscription
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
