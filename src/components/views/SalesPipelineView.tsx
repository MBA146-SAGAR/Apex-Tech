import React, { useMemo, useState } from 'react';
import { CheckCircle2, Plus } from 'lucide-react';
import { useApex } from '../../context/ApexContext';
import { LeadRecord, PlanName, SalesStage } from '../../types/apex';
import { daysUntil, formatINR, formatPct } from '../../utils/formatters';
import { KpiCard, Modal, SectionHeader, StatusText } from '../ui/DataPrimitives';

const SALES_STAGES: SalesStage[] = [
  'New Lead',
  'Contacted',
  'Interested',
  'Demo Scheduled',
  'Demo Completed',
  'Trial Started',
  'Negotiation',
  'Converted',
  'Lost',
];

export function SalesPipelineView() {
  const { db, financials, canEditSection, addLead, updateLead, convertLeadToCustomer } = useApex();
  const editable = canEditSection('pipeline');

  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [stageFilter, setStageFilter] = useState<'All' | SalesStage>('All');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [convertLead, setConvertLead] = useState<LeadRecord | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanName>('Standard');

  const [form, setForm] = useState<Omit<LeadRecord, 'id'>>({
    companyName: '',
    contactPerson: '',
    jobDesignation: 'Chief Financial Officer',
    email: '',
    leadSource: 'LinkedIn Sales Navigator',
    expectedDealValue: 25000,
    salesStage: 'New Lead',
    followUpDate: '2026-11-23',
    demoStatus: 'Not Scheduled',
    conversionProbability: 20,
    assignedEmployee: 'Ananya Deshmukh',
    notes: '',
  });

  const qualifiedLeadsCount = db.leads.filter((l) =>
    ['Interested', 'Demo Scheduled', 'Demo Completed', 'Trial Started', 'Negotiation'].includes(
      l.salesStage
    )
  ).length;

  const upcomingFollowUps = db.leads.filter(
    (l) => l.salesStage !== 'Converted' && l.salesStage !== 'Lost' && daysUntil(l.followUpDate) <= 5
  ).length;

  const filtered = useMemo(() => {
    if (stageFilter === 'All') return db.leads;
    return db.leads.filter((l) => l.salesStage === stageFilter);
  }, [db.leads, stageFilter]);

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    addLead(form);
    setAddModalOpen(false);
    setForm({ ...form, companyName: '', contactPerson: '', email: '', notes: '' });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Sales & Lead Pipeline"
        subtitle="9-stage B2B SaaS outbound pipeline tracking CFO demos, 14-day pilots, and conversions · DEMO DATA"
        actions={
          <>
            <div className="flex bg-slate-100 p-1 rounded-md">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  viewMode === 'board' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Stage Board
              </button>
            </div>
            {editable && (
              <button
                onClick={() => setAddModalOpen(true)}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> New Lead
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <KpiCard label="Total Leads" value={String(db.leads.length)} subtext="Active + closed pipeline" />
        <KpiCard label="Qualified Leads" value={String(qualifiedLeadsCount)} subtext="Interested through Negotiation" />
        <KpiCard label="Upcoming Follow-Ups" value={String(upcomingFollowUps)} subtext="Due within 5 days" />
        <KpiCard
          label="Demo Conversion Rate"
          value={formatPct(financials.demoConversionRate)}
          subtext="Demos converted to paid"
          trend={{ text: 'Target ≥20%', positive: financials.demoConversionRate >= 20 }}
        />
        <KpiCard
          label="Lead-to-Customer Rate"
          value={formatPct(financials.leadConversionRate)}
          subtext="Overall funnel efficiency"
        />
        <KpiCard
          label="Weighted Pipeline MRR"
          value={formatINR(financials.expectedPipelineRevenue)}
          subtext="Probability-weighted monthly"
        />
      </div>

      {viewMode === 'table' ? (
        <>
          <div className="flex items-center gap-1.5 flex-wrap bg-white border border-slate-200 rounded-lg p-3">
            {(['All', ...SALES_STAGES] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStageFilter(st)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  stageFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Lead & Company</th>
                    <th className="text-left py-3 px-3 font-semibold">Contact & Role</th>
                    <th className="text-left py-3 px-3 font-semibold">Sales Stage</th>
                    <th className="text-left py-3 px-3 font-semibold">Demo Status</th>
                    <th className="text-right py-3 px-3 font-semibold">Deal Value</th>
                    <th className="text-right py-3 px-3 font-semibold">Prob.</th>
                    <th className="text-left py-3 px-3 font-semibold">Follow-Up</th>
                    <th className="text-right py-3 px-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{lead.companyName}</div>
                        <div className="text-slate-500 font-mono-num">{lead.id} · {lead.leadSource}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{lead.contactPerson}</div>
                        <div className="text-slate-500">{lead.jobDesignation}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        {editable && lead.salesStage !== 'Converted' ? (
                          <select
                            value={lead.salesStage}
                            onChange={(e) =>
                              updateLead({ ...lead, salesStage: e.target.value as SalesStage })
                            }
                            className="border border-slate-200 rounded px-2 py-1 text-xs bg-white"
                          >
                            {SALES_STAGES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <StatusText
                            label={lead.salesStage}
                            tone={
                              lead.salesStage === 'Converted'
                                ? 'positive'
                                : lead.salesStage === 'Lost'
                                  ? 'negative'
                                  : 'info'
                            }
                          />
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{lead.demoStatus}</td>
                      <td className="py-2.5 px-3 text-right font-mono-num font-medium text-slate-900">
                        {formatINR(lead.expectedDealValue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num text-slate-700">
                        {lead.conversionProbability}%
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-slate-600">{lead.followUpDate}</td>
                      <td className="py-2.5 px-4 text-right">
                        {editable && lead.salesStage !== 'Converted' && lead.salesStage !== 'Lost' ? (
                          <button
                            onClick={() => {
                              setConvertLead(lead);
                              setSelectedPlan(
                                lead.expectedDealValue >= 30000
                                  ? 'Premium'
                                  : lead.expectedDealValue <= 20000
                                    ? 'Conservative'
                                    : 'Standard'
                              );
                            }}
                            className="text-emerald-700 hover:underline font-medium inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Convert
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {SALES_STAGES.filter((s) => s !== 'Lost').map((stage) => {
            const items = db.leads.filter((l) => l.salesStage === stage);
            return (
              <div key={stage} className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-800">{stage}</span>
                  <span className="text-xs font-mono-num text-slate-500">{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No leads</p>
                ) : (
                  items.map((l) => (
                    <div key={l.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                      <div className="font-semibold text-slate-900">{l.companyName}</div>
                      <div className="text-slate-600">{l.contactPerson}</div>
                      <div className="flex justify-between font-mono-num text-slate-700 pt-1">
                        <span>{formatINR(l.expectedDealValue)}</span>
                        <span>{l.conversionProbability}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Convert Lead Modal */}
      <Modal
        open={Boolean(convertLead)}
        title={`Convert Lead to Paid Customer`}
        onClose={() => setConvertLead(null)}
      >
        {convertLead && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Converting <strong>{convertLead.companyName}</strong> will automatically create an active Customer
              record, activate their Subscription, and log initial Subscription Revenue in the ledger.
            </p>
            <div>
              <label className="block text-slate-600 mb-1">Select Subscription Tier</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value as PlanName)}
                className="w-full border border-slate-200 rounded px-3 py-2 bg-white"
              >
                <option value="Conservative">Conservative Plan — ₹20,000 / month</option>
                <option value="Standard">Standard Plan — ₹25,000 / month</option>
                <option value="Premium">Premium Plan — ₹30,000 / month</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConvertLead(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  convertLeadToCustomer(convertLead.id, selectedPlan);
                  setConvertLead(null);
                }}
                className="px-4 py-2 text-white bg-emerald-700 hover:bg-emerald-800 rounded-md font-medium"
              >
                Confirm Conversion
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Lead Modal */}
      <Modal open={addModalOpen} title="Add Sales Lead" onClose={() => setAddModalOpen(false)}>
        <form onSubmit={handleAddLead} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Company Name *</label>
              <input
                required
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full border border-slate-200 rounded px-2.5 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Contact Person *</label>
              <input
                required
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                className="w-full border border-slate-200 rounded px-2.5 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Designation</label>
              <input
                value={form.jobDesignation}
                onChange={(e) => setForm({ ...form, jobDesignation: e.target.value })}
                className="w-full border border-slate-200 rounded px-2.5 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-200 rounded px-2.5 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Expected Monthly Deal (₹)</label>
              <input
                type="number"
                value={form.expectedDealValue}
                onChange={(e) => setForm({ ...form, expectedDealValue: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 font-mono-num"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Sales Stage</label>
              <select
                value={form.salesStage}
                onChange={(e) => setForm({ ...form, salesStage: e.target.value as SalesStage })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 bg-white"
              >
                {SALES_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Follow-Up Date</label>
              <input
                type="date"
                value={form.followUpDate}
                onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 font-mono-num"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Conversion Probability (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.conversionProbability}
                onChange={(e) => setForm({ ...form, conversionProbability: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 font-mono-num"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border border-slate-200 rounded px-2.5 py-2"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setAddModalOpen(false)} className="px-4 py-2 text-slate-600">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white bg-blue-700 hover:bg-blue-800 rounded-md">
              Add Lead
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
