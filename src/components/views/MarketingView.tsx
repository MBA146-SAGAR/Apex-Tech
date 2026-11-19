import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApex } from '../../context/ApexContext';
import { MarketingChannel } from '../../types/apex';
import { formatINR, formatPct } from '../../utils/formatters';
import { KpiCard, Modal, SectionHeader, StatusText } from '../ui/DataPrimitives';

const CHANNELS: MarketingChannel[] = [
  'LinkedIn Sales Navigator',
  'Direct Email Campaigns',
  'CFO Networks',
  'Accounting Consultants',
  'B2B SaaS Communities',
];

export function MarketingView() {
  const { db, canEditSection, addCampaign, updateCampaign } = useApex();
  const editable = canEditSection('marketing');

  const [weekFilter, setWeekFilter] = useState<'All' | 'Week 1' | 'Week 2' | 'Week 3' | 'Week 4'>('All');
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    campaignName: '',
    channel: 'LinkedIn Sales Navigator' as MarketingChannel,
    budget: 20000,
    leadsGenerated: 15,
    demoBookings: 4,
    paidCustomers: 1,
    week: 'Week 4' as 'Week 1' | 'Week 2' | 'Week 3' | 'Week 4',
    status: 'Active' as 'Active' | 'Planned' | 'Completed' | 'Paused',
  });

  const totalBudget = db.marketingCampaigns.reduce((a, c) => a + c.budget, 0);
  const totalLeads = db.marketingCampaigns.reduce((a, c) => a + c.leadsGenerated, 0);
  const totalDemos = db.marketingCampaigns.reduce((a, c) => a + c.demoBookings, 0);
  const totalPaid = db.marketingCampaigns.reduce((a, c) => a + c.paidCustomers, 0);
  const avgConv = totalLeads > 0 ? (totalPaid / totalLeads) * 100 : 0;
  const totalAttrRevenue = totalPaid * db.assumptions.sellingPrice * 12; // Annualized contract value
  const overallRoi = totalBudget > 0 ? ((totalAttrRevenue - totalBudget) / totalBudget) * 100 : 0;

  const filtered =
    weekFilter === 'All'
      ? db.marketingCampaigns
      : db.marketingCampaigns.filter((c) => c.week === weekFilter);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Marketing & 30-Day Go-To-Market"
        subtitle="Multi-channel B2B SaaS campaign budget, demo bookings, conversion rates, and ROI · DEMO DATA"
        actions={
          editable && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Campaign
            </button>
          )
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Total GTM Budget" value={formatINR(totalBudget)} subtext={`${db.marketingCampaigns.length} active/completed campaigns`} />
        <KpiCard label="Leads Generated" value={String(totalLeads)} subtext={`${totalDemos} demos booked`} />
        <KpiCard label="Paid Conversions" value={String(totalPaid)} subtext={`Blended CAC: ${formatINR(totalPaid > 0 ? totalBudget / totalPaid : 0)}`} />
        <KpiCard
          label="Lead-to-Paid Conversion"
          value={formatPct(avgConv)}
          subtext="Across all 5 GTM channels"
          trend={{ text: 'Target ≥8%', positive: avgConv >= 8 }}
        />
        <KpiCard
          label="Annualized Campaign ROI"
          value={formatPct(overallRoi, 0)}
          subtext={`ACV generated: ${formatINR(totalAttrRevenue, true)}`}
          trend={{ text: 'High leverage', positive: overallRoi > 100 }}
        />
      </div>

      {/* Weekly Filter */}
      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-3">
        <span className="text-xs text-slate-500 mr-2">Weekly GTM Monitor:</span>
        {(['All', 'Week 1', 'Week 2', 'Week 3', 'Week 4'] as const).map((w) => (
          <button
            key={w}
            onClick={() => setWeekFilter(w)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              weekFilter === w ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="text-left py-3 px-4 font-semibold">Campaign Name</th>
                <th className="text-left py-3 px-3 font-semibold">Channel</th>
                <th className="text-left py-3 px-3 font-semibold">Week</th>
                <th className="text-right py-3 px-3 font-semibold">Budget</th>
                <th className="text-right py-3 px-3 font-semibold">Leads</th>
                <th className="text-right py-3 px-3 font-semibold">Demos</th>
                <th className="text-right py-3 px-3 font-semibold">Paid</th>
                <th className="text-right py-3 px-3 font-semibold">Conv. %</th>
                <th className="text-right py-3 px-3 font-semibold">ROI (ACV)</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => {
                const convRate = c.leadsGenerated > 0 ? (c.paidCustomers / c.leadsGenerated) * 100 : 0;
                const acv = c.paidCustomers * db.assumptions.sellingPrice * 12;
                const roi = c.budget > 0 ? ((acv - c.budget) / c.budget) * 100 : 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">{c.campaignName}</div>
                      <div className="text-slate-500 font-mono-num">{c.id}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{c.channel}</td>
                    <td className="py-2.5 px-3 text-slate-600">{c.week}</td>
                    <td className="py-2.5 px-3 text-right font-mono-num text-slate-900">{formatINR(c.budget)}</td>
                    <td className="py-2.5 px-3 text-right font-mono-num text-slate-700">{c.leadsGenerated}</td>
                    <td className="py-2.5 px-3 text-right font-mono-num text-slate-700">{c.demoBookings}</td>
                    <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-slate-900">{c.paidCustomers}</td>
                    <td className="py-2.5 px-3 text-right font-mono-num text-slate-700">{formatPct(convRate)}</td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono-num font-semibold ${
                        roi >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {formatPct(roi, 0)}
                    </td>
                    <td className="py-2.5 px-4">
                      {editable ? (
                        <select
                          value={c.status}
                          onChange={(e) =>
                            updateCampaign({
                              ...c,
                              status: e.target.value as typeof c.status,
                            })
                          }
                          className="border border-slate-200 rounded px-2 py-1 text-xs bg-white"
                        >
                          <option value="Active">Active</option>
                          <option value="Planned">Planned</option>
                          <option value="Completed">Completed</option>
                          <option value="Paused">Paused</option>
                        </select>
                      ) : (
                        <StatusText label={c.status} tone={c.status === 'Active' ? 'positive' : 'neutral'} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} title="Launch Marketing Campaign" onClose={() => setModalOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addCampaign(form);
            setModalOpen(false);
            setForm({ ...form, campaignName: '' });
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="block text-slate-600 mb-1">Campaign Name *</label>
            <input
              required
              value={form.campaignName}
              onChange={(e) => setForm({ ...form, campaignName: e.target.value })}
              className="w-full border border-slate-200 rounded px-2.5 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Channel</label>
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value as MarketingChannel })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 bg-white"
              >
                {CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Execution Week</label>
              <select
                value={form.week}
                onChange={(e) => setForm({ ...form, week: e.target.value as typeof form.week })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 bg-white"
              >
                <option value="Week 1">Week 1</option>
                <option value="Week 2">Week 2</option>
                <option value="Week 3">Week 3</option>
                <option value="Week 4">Week 4</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Budget (₹)</label>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 font-mono-num"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Leads Generated</label>
              <input
                type="number"
                value={form.leadsGenerated}
                onChange={(e) => setForm({ ...form, leadsGenerated: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 font-mono-num"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Demo Bookings</label>
              <input
                type="number"
                value={form.demoBookings}
                onChange={(e) => setForm({ ...form, demoBookings: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 font-mono-num"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Paid Customers</label>
              <input
                type="number"
                value={form.paidCustomers}
                onChange={(e) => setForm({ ...form, paidCustomers: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 font-mono-num"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-slate-600">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white bg-blue-700 hover:bg-blue-800 rounded-md">
              Launch Campaign
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
