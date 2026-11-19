import React, { useMemo, useState } from 'react';
import { Download, Plus, Search } from 'lucide-react';
import { useApex } from '../../context/ApexContext';
import { CustomerRecord, CustomerStatus, PlanName } from '../../types/apex';
import { PLAN_PRICES } from '../../utils/financialEngine';
import { downloadCSV, formatINR } from '../../utils/formatters';
import { KpiCard, Modal, SectionHeader, StatusText } from '../ui/DataPrimitives';

const STATUS_OPTIONS: ('All' | CustomerStatus)[] = [
  'All',
  'Paid Customer',
  'Trial Customer',
  'Demo Scheduled',
  'Qualified Lead',
  'Prospect',
  'Inactive Customer',
];

const STATUS_TONE: Record<CustomerStatus, 'positive' | 'info' | 'warning' | 'neutral' | 'negative'> = {
  'Paid Customer': 'positive',
  'Trial Customer': 'info',
  'Demo Scheduled': 'info',
  'Qualified Lead': 'warning',
  Prospect: 'neutral',
  'Inactive Customer': 'negative',
};

export function CustomersView() {
  const { db, canEditSection, addCustomer, updateCustomer } = useApex();
  const editable = canEditSection('customers');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | CustomerStatus>('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<CustomerRecord, 'id'>>({
    companyName: '',
    contactPerson: '',
    designation: 'Chief Financial Officer',
    email: '',
    phone: '+91 ',
    industry: 'B2B SaaS',
    revenueRange: '₹80 Cr – ₹150 Cr',
    employeeCount: 120,
    city: 'Bengaluru',
    leadSource: 'LinkedIn Sales Navigator',
    acquisitionDate: '2026-11-19',
    subscriptionPlan: 'Standard',
    status: 'Prospect',
    monthlyValue: 25000,
    assignedExecutive: 'Ananya Deshmukh',
    nextFollowUp: '2026-11-26',
    remarks: '',
  });

  const cities = useMemo(
    () => ['All', ...Array.from(new Set(db.customers.map((c) => c.city)))],
    [db.customers]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return db.customers.filter((c) => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (cityFilter !== 'All' && c.city !== cityFilter) return false;
      if (!q) return true;
      return (
        c.companyName.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    });
  }, [db.customers, search, statusFilter, cityFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.companyName.trim() || !form.email.trim()) {
      setFormError('Company name and email address are required.');
      return;
    }
    const res = addCustomer(form);
    if (!res.ok) {
      setFormError(res.error || 'Duplicate record detected.');
      return;
    }
    setModalOpen(false);
    setForm({
      ...form,
      companyName: '',
      contactPerson: '',
      email: '',
      remarks: '',
    });
  };

  const customerSubs = selectedCustomer
    ? db.subscriptions.filter((s) => s.customerId === selectedCustomer.id)
    : [];
  const customerRev = selectedCustomer
    ? db.revenueTransactions.filter((r) => r.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Customer Management (CRM)"
        subtitle="Centralized B2B SaaS account directory across Bengaluru, Mumbai, Delhi-NCR, and US hubs · DEMO DATA"
        actions={
          <>
            <button
              onClick={() => downloadCSV('apex-customers.csv', filtered as unknown as Record<string, unknown>[])}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            {editable && (
              <button
                onClick={() => {
                  setFormError(null);
                  setModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Customer
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Accounts" value={String(db.customers.length)} subtext="Unique companies in CRM" />
        <KpiCard
          label="Paid Customers"
          value={String(db.customers.filter((c) => c.status === 'Paid Customer').length)}
          subtext="Active revenue-generating logos"
          trend={{ text: 'Verified', positive: true }}
        />
        <KpiCard
          label="Trials & Scheduled Demos"
          value={String(
            db.customers.filter((c) => c.status === 'Trial Customer' || c.status === 'Demo Scheduled').length
          )}
          subtext="Mid-funnel active evaluations"
        />
        <KpiCard
          label="Total Contracted MRR"
          value={formatINR(
            db.customers
              .filter((c) => c.status === 'Paid Customer')
              .reduce((a, b) => a + b.monthlyValue, 0)
          )}
          subtext="Across active paid accounts"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, CFO/controller, ID, or email..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">City:</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-2 bg-white text-slate-700"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="text-left py-3 px-4 font-semibold">Company & ID</th>
                <th className="text-left py-3 px-3 font-semibold">Primary Contact</th>
                <th className="text-left py-3 px-3 font-semibold">City & Industry</th>
                <th className="text-left py-3 px-3 font-semibold">Plan</th>
                <th className="text-right py-3 px-3 font-semibold">Monthly Value</th>
                <th className="text-left py-3 px-3 font-semibold">Status</th>
                <th className="text-left py-3 px-3 font-semibold">Follow-Up</th>
                <th className="text-right py-3 px-4 font-semibold">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No customer records match your current search or filter.
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">{cust.companyName}</div>
                      <div className="text-slate-500 font-mono-num">{cust.id} · {cust.employeeCount} emp.</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-slate-800 font-medium">{cust.contactPerson}</div>
                      <div className="text-slate-500">{cust.designation}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-slate-800">{cust.city}</div>
                      <div className="text-slate-500">{cust.industry}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{cust.subscriptionPlan}</td>
                    <td className="py-2.5 px-3 text-right font-mono-num font-medium text-slate-900">
                      {formatINR(cust.monthlyValue)}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusText label={cust.status} tone={STATUS_TONE[cust.status]} />
                    </td>
                    <td className="py-2.5 px-3 font-mono-num text-slate-600">{cust.nextFollowUp}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="text-blue-700 hover:underline font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      <Modal
        open={Boolean(selectedCustomer)}
        title={selectedCustomer ? `${selectedCustomer.companyName} (${selectedCustomer.id})` : ''}
        onClose={() => setSelectedCustomer(null)}
        maxWidth="max-w-2xl"
      >
        {selectedCustomer && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="text-slate-500">Contact Person</div>
                <div className="font-semibold text-slate-900 mt-0.5">{selectedCustomer.contactPerson}</div>
                <div className="text-slate-600">{selectedCustomer.designation}</div>
              </div>
              <div>
                <div className="text-slate-500">Email & Phone</div>
                <div className="font-medium text-slate-900 mt-0.5">{selectedCustomer.email}</div>
                <div className="text-slate-600 font-mono-num">{selectedCustomer.phone}</div>
              </div>
              <div>
                <div className="text-slate-500">Company Profile</div>
                <div className="font-medium text-slate-900 mt-0.5">{selectedCustomer.city} · {selectedCustomer.industry}</div>
                <div className="text-slate-600">{selectedCustomer.revenueRange}</div>
              </div>
              <div>
                <div className="text-slate-500">Lead Source</div>
                <div className="font-medium text-slate-900 mt-0.5">{selectedCustomer.leadSource}</div>
              </div>
              <div>
                <div className="text-slate-500">Assigned Executive</div>
                <div className="font-medium text-slate-900 mt-0.5">{selectedCustomer.assignedExecutive}</div>
              </div>
              <div>
                <div className="text-slate-500">Next Follow-Up</div>
                <div className="font-mono-num font-medium text-slate-900 mt-0.5">{selectedCustomer.nextFollowUp}</div>
              </div>
            </div>

            {editable && (
              <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-slate-200">
                <label className="text-slate-600 font-medium">Update Status:</label>
                <select
                  value={selectedCustomer.status}
                  onChange={(e) => {
                    const updated = { ...selectedCustomer, status: e.target.value as CustomerStatus };
                    updateCustomer(updated);
                    setSelectedCustomer(updated);
                  }}
                  className="border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white"
                >
                  {STATUS_OPTIONS.filter((s) => s !== 'All').map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <label className="text-slate-600 font-medium ml-2">Follow-Up Date:</label>
                <input
                  type="date"
                  value={selectedCustomer.nextFollowUp}
                  onChange={(e) => {
                    const updated = { ...selectedCustomer, nextFollowUp: e.target.value };
                    updateCustomer(updated);
                    setSelectedCustomer(updated);
                  }}
                  className="border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono-num"
                />
              </div>
            )}

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Linked Subscriptions ({customerSubs.length})</h4>
              {customerSubs.length === 0 ? (
                <p className="text-slate-500">No active subscription records yet.</p>
              ) : (
                <div className="border border-slate-200 rounded divide-y divide-slate-100">
                  {customerSubs.map((s) => (
                    <div key={s.id} className="p-2.5 flex justify-between items-center font-mono-num">
                      <span>{s.id} · {s.planName} ({s.billingFrequency})</span>
                      <span>{formatINR(s.amount)} · {s.paymentStatus} · Renews {s.renewalDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Revenue History ({customerRev.length} txns)</h4>
              {customerRev.length === 0 ? (
                <p className="text-slate-500">No revenue transactions recorded yet.</p>
              ) : (
                <div className="border border-slate-200 rounded divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {customerRev.map((r) => (
                    <div key={r.id} className="p-2 flex justify-between font-mono-num">
                      <span>{r.date} · {r.id} · {r.category}</span>
                      <span className="font-semibold text-emerald-700">{formatINR(r.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="text-slate-500">Remarks</div>
              <div className="text-slate-800 mt-0.5">{selectedCustomer.remarks || '—'}</div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Customer Modal */}
      <Modal open={modalOpen} title="Add New Customer Record" onClose={() => setModalOpen(false)} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {formError && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded">{formError}</div>
          )}
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
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full border border-slate-200 rounded px-2.5 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Email Address *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-200 rounded px-2.5 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">City</label>
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 bg-white"
              >
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi-NCR">Delhi-NCR</option>
                <option value="US Hub (Remote)">US Hub (Remote)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Subscription Plan</label>
              <select
                value={form.subscriptionPlan}
                onChange={(e) => {
                  const plan = e.target.value as PlanName;
                  setForm({ ...form, subscriptionPlan: plan, monthlyValue: PLAN_PRICES[plan] });
                }}
                className="w-full border border-slate-200 rounded px-2.5 py-2 bg-white"
              >
                <option value="Conservative">Conservative (₹20,000/mo)</option>
                <option value="Standard">Standard (₹25,000/mo)</option>
                <option value="Premium">Premium (₹30,000/mo)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Customer Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as CustomerStatus })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 bg-white"
              >
                {STATUS_OPTIONS.filter((s) => s !== 'All').map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Lead Source</label>
              <select
                value={form.leadSource}
                onChange={(e) => setForm({ ...form, leadSource: e.target.value })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 bg-white"
              >
                <option value="LinkedIn Sales Navigator">LinkedIn Sales Navigator</option>
                <option value="Direct Email Campaigns">Direct Email Campaigns</option>
                <option value="CFO Networks">CFO Networks</option>
                <option value="Accounting Consultants">Accounting Consultants</option>
                <option value="B2B SaaS Communities">B2B SaaS Communities</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Remarks</label>
            <textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full border border-slate-200 rounded px-2.5 py-2"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
