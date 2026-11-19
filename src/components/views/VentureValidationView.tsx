import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { useApex } from '../../context/ApexContext';
import { formatINR, formatPct } from '../../utils/formatters';
import { KpiCard, Modal, SectionHeader, StatusText } from '../ui/DataPrimitives';

export function VentureValidationView() {
  const { db, canEditSection, updateValidationTask, addFeedback } = useApex();
  const editable = canEditSection('validation');

  const [tab, setTab] = useState<'tracker' | 'feedback'>('tracker');
  const [feedbackModal, setFeedbackModal] = useState(false);

  const [feedbackForm, setFeedbackForm] = useState({
    customerName: '',
    company: '',
    designation: 'Chief Financial Officer',
    interviewDate: '2026-11-19',
    majorPainPoints: '',
    dataSecurityConcerns: '',
    productFeedback: '',
    willingnessToPay: 25000,
    pricingFeedback: '',
    improvementSuggestions: '',
    hoursSavedWeekly: 16,
    securityTrustConfirmed: true,
    willingnessConfirmed: true,
    timeReductionConfirmed: true,
    validationStatus: 'Validated' as 'Validated' | 'Pending Review' | 'Follow-up Required',
  });

  // 3 Core Venture Hypotheses Validation Metrics
  const totalInterviews = db.customerFeedback.length;
  const securityTrustCount = db.customerFeedback.filter((f) => f.securityTrustConfirmed).length;
  const wtpConfirmedCount = db.customerFeedback.filter(
    (f) => f.willingnessConfirmed && f.willingnessToPay >= 25000
  ).length;
  const timeSavedCount = db.customerFeedback.filter(
    (f) => f.timeReductionConfirmed && f.hoursSavedWeekly >= 15
  ).length;
  const avgHoursSaved =
    totalInterviews > 0
      ? db.customerFeedback.reduce((a, b) => a + b.hoursSavedWeekly, 0) / totalInterviews
      : 0;

  const completedTasks = db.validationTasks.filter((t) => t.status === 'Completed').length;
  const overdueTasks = db.validationTasks.filter((t) => t.status === 'Overdue').length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="30-Day Venture Validation & Customer Discovery"
        subtitle="4-week GTM execution milestones and structured CFO interview hypothesis validation · DEMO DATA"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-md">
              <button
                onClick={() => setTab('tracker')}
                className={`px-3 py-1.5 text-xs font-medium rounded ${
                  tab === 'tracker' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                30-Day Execution Tracker
              </button>
              <button
                onClick={() => setTab('feedback')}
                className={`px-3 py-1.5 text-xs font-medium rounded ${
                  tab === 'feedback' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Customer Feedback ({totalInterviews})
              </button>
            </div>
            {editable && tab === 'feedback' && (
              <button
                onClick={() => setFeedbackModal(true)}
                className="px-3 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Log Interview
              </button>
            )}
          </div>
        }
      />

      {/* Core Hypothesis Scorecard (3 Major Assumptions) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-semibold text-slate-900">Hypothesis 1: Data Security Trust</span>
            <span className="font-mono-num text-emerald-700 font-semibold">
              {totalInterviews > 0 ? formatPct((securityTrustCount / totalInterviews) * 100, 0) : '0%'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            CFOs & controllers trust automated CSV/ERP ingestion with SOC2 & encryption roadmap (Target ≥80%).
          </p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600"
              style={{ width: `${totalInterviews > 0 ? (securityTrustCount / totalInterviews) * 100 : 0}%` }}
            />
          </div>
          <div className="text-xs text-slate-600 font-mono-num">
            {securityTrustCount} of {totalInterviews} interviews confirmed
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-semibold text-slate-900">Hypothesis 2: ₹25,000/mo Willingness to Pay</span>
            <span className="font-mono-num text-blue-700 font-semibold">
              {totalInterviews > 0 ? formatPct((wtpConfirmedCount / totalInterviews) * 100, 0) : '0%'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Mid-market finance leaders approve ₹25,000 monthly subscription after 14-day pilot.
          </p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-700"
              style={{ width: `${totalInterviews > 0 ? (wtpConfirmedCount / totalInterviews) * 100 : 0}%` }}
            />
          </div>
          <div className="text-xs text-slate-600 font-mono-num">
            {wtpConfirmedCount} of {totalInterviews} confirmed ≥₹25,000/mo
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-semibold text-slate-900">Hypothesis 3: 15–20 Hrs/Week Saved</span>
            <span className="font-mono-num text-emerald-700 font-semibold">
              {avgHoursSaved.toFixed(1)} hrs/wk avg
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Automated reporting cuts manual spreadsheet aggregation from days to under 30 minutes.
          </p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600"
              style={{ width: `${totalInterviews > 0 ? (timeSavedCount / totalInterviews) * 100 : 0}%` }}
            />
          </div>
          <div className="text-xs text-slate-600 font-mono-num">
            {timeSavedCount} of {totalInterviews} saved ≥15 hrs/week
          </div>
        </div>
      </div>

      {tab === 'tracker' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total 30-Day Milestones" value={String(db.validationTasks.length)} subtext="Weeks 1 through 4" />
            <KpiCard
              label="Milestones Completed"
              value={String(completedTasks)}
              subtext={`${formatPct((completedTasks / Math.max(1, db.validationTasks.length)) * 100, 0)} completion`}
              trend={{ text: 'On track', positive: true }}
            />
            <KpiCard
              label="Overdue Alerts"
              value={String(overdueTasks)}
              subtext="Tasks past target due date"
              trend={{ text: overdueTasks > 0 ? 'Attention needed' : 'Clear', negative: overdueTasks > 0 }}
            />
            <KpiCard
              label="Week 4 Paid Pilot Conversions"
              value={`${db.validationTasks.find((t) => t.id === 'VAL-704')?.actualAchievement || 0} / 3`}
              subtext="Target: 2–3 paid pilots @ ₹25,000"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
            {db.validationTasks.map((task) => {
              const pct = task.targetValue > 0 ? Math.min(100, (task.actualAchievement / task.targetValue) * 100) : 0;
              return (
                <div key={task.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-900">{task.week}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono-num text-slate-500">{task.id}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600">Owner: {task.assignedPerson}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono-num text-slate-500">Due {task.dueDate}</span>
                      {task.status === 'Overdue' && (
                        <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                        </span>
                      )}
                      {task.status === 'Completed' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-900">{task.taskDescription}</div>
                    <div className="text-xs text-slate-500">{task.remarks}</div>
                  </div>

                  <div className="w-full lg:w-72 shrink-0 space-y-1.5">
                    <div className="flex justify-between text-xs font-mono-num">
                      <span className="text-slate-600">
                        {task.actualAchievement} / {task.targetValue} {task.unit}
                      </span>
                      <span className="font-semibold text-slate-900">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          task.status === 'Overdue'
                            ? 'bg-red-600'
                            : task.status === 'Completed'
                              ? 'bg-emerald-600'
                              : 'bg-blue-700'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {editable && (
                      <div className="flex items-center gap-2 pt-1">
                        <label className="text-[11px] text-slate-500">Actual:</label>
                        <input
                          type="number"
                          value={task.actualAchievement}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const nextStatus =
                              val >= task.targetValue
                                ? 'Completed'
                                : task.status === 'Completed'
                                  ? 'In Progress'
                                  : task.status;
                            updateValidationTask({
                              ...task,
                              actualAchievement: val,
                              status: nextStatus,
                            });
                          }}
                          className="w-20 border border-slate-200 rounded px-2 py-0.5 text-xs font-mono-num"
                        />
                        <select
                          value={task.status}
                          onChange={(e) =>
                            updateValidationTask({
                              ...task,
                              status: e.target.value as typeof task.status,
                            })
                          }
                          className="border border-slate-200 rounded px-2 py-0.5 text-xs bg-white"
                        >
                          <option value="Completed">Completed</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Pending">Pending</option>
                          <option value="Overdue">Overdue</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Interview & Leader</th>
                  <th className="text-left py-3 px-3 font-semibold">Pain Points & Security</th>
                  <th className="text-right py-3 px-3 font-semibold">Hrs Saved/Wk</th>
                  <th className="text-right py-3 px-3 font-semibold">WTP / Mo</th>
                  <th className="text-left py-3 px-3 font-semibold">Product Feedback</th>
                  <th className="text-left py-3 px-4 font-semibold">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.customerFeedback.map((fb) => (
                  <tr key={fb.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{fb.customerName}</div>
                      <div className="text-slate-600">{fb.company} · {fb.designation}</div>
                      <div className="text-slate-400 font-mono-num">{fb.id} · {fb.interviewDate}</div>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <div className="text-slate-800">{fb.majorPainPoints}</div>
                      <div className="text-slate-500 mt-0.5">Security: {fb.dataSecurityConcerns}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num font-semibold text-emerald-700">
                      {fb.hoursSavedWeekly} hrs
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num font-semibold text-slate-900">
                      {formatINR(fb.willingnessToPay)}
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <div className="text-slate-800">{fb.productFeedback}</div>
                      <div className="text-slate-500 mt-0.5">Ask: {fb.improvementSuggestions}</div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusText
                        label={fb.validationStatus}
                        tone={
                          fb.validationStatus === 'Validated'
                            ? 'positive'
                            : fb.validationStatus === 'Follow-up Required'
                              ? 'warning'
                              : 'neutral'
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Interview Modal */}
      <Modal open={feedbackModal} title="Log Customer Discovery Interview" onClose={() => setFeedbackModal(false)} maxWidth="max-w-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addFeedback(feedbackForm);
            setFeedbackModal(false);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Customer Name *</label>
              <input
                required
                value={feedbackForm.customerName}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, customerName: e.target.value })}
                className="w-full border border-slate-200 rounded px-2.5 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Company *</label>
              <input
                required
                value={feedbackForm.company}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, company: e.target.value })}
                className="w-full border border-slate-200 rounded px-2.5 py-2"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Hours Saved Weekly</label>
              <input
                type="number"
                value={feedbackForm.hoursSavedWeekly}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, hoursSavedWeekly: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 font-mono-num"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Willingness to Pay (₹/mo)</label>
              <input
                type="number"
                value={feedbackForm.willingnessToPay}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, willingnessToPay: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded px-2.5 py-2 font-mono-num"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Major Pain Points *</label>
            <input
              required
              value={feedbackForm.majorPainPoints}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, majorPainPoints: e.target.value })}
              className="w-full border border-slate-200 rounded px-2.5 py-2"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Data Security Concerns</label>
            <input
              value={feedbackForm.dataSecurityConcerns}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, dataSecurityConcerns: e.target.value })}
              className="w-full border border-slate-200 rounded px-2.5 py-2"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Product Feedback & Suggestions</label>
            <input
              value={feedbackForm.productFeedback}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, productFeedback: e.target.value })}
              className="w-full border border-slate-200 rounded px-2.5 py-2"
            />
          </div>
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={feedbackForm.securityTrustConfirmed}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, securityTrustConfirmed: e.target.checked })}
              />
              Security Trust Confirmed
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={feedbackForm.willingnessConfirmed}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, willingnessConfirmed: e.target.checked })}
              />
              ₹25k/mo Pricing Confirmed
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={feedbackForm.timeReductionConfirmed}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, timeReductionConfirmed: e.target.checked })}
              />
              15–20 Hrs Saved Confirmed
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setFeedbackModal(false)} className="px-4 py-2 text-slate-600">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-white bg-blue-700 hover:bg-blue-800 rounded-md">
              Save Interview
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
