import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Printer, Upload } from 'lucide-react';
import { useApex } from '../../context/ApexContext';
import { downloadCSV, formatINR, formatPct } from '../../utils/formatters';
import { KpiCard, SectionHeader } from '../ui/DataPrimitives';

const SAMPLE_CSV = `Date,Department,Category,Revenue,Expense
2026-11-01,Enterprise SaaS,Subscription,325000,48000
2026-11-05,Mid-Market India,Subscription,175000,32000
2026-11-10,Infrastructure,Cloud Hosting,0,32000
2026-11-12,Engineering,Payroll,0,90000
2026-11-15,Advisory,Implementation,35000,8000`;

export function ReportsView() {
  const { db, financials, canEditSection, generateFinancialReport } = useApex();
  const editable = canEditSection('reports');

  const [periodType, setPeriodType] = useState<'Monthly' | 'Quarterly' | 'Annual'>('Monthly');
  const [periodLabel, setPeriodLabel] = useState('2026-11');
  const [csvText, setCsvText] = useState(SAMPLE_CSV);

  const periodOptions = useMemo(() => {
    if (periodType === 'Monthly') {
      return ['2026-11', '2026-10', '2026-09', '2026-08', '2026-07', '2026-06'];
    }
    if (periodType === 'Quarterly') {
      return ['2026 Q4', '2026 Q3', '2026 Q2'];
    }
    return ['2026'];
  }, [periodType]);

  // Live CSV Ingestion Engine (MVP Feature)
  const parsedCsv = useMemo(() => {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return { rows: [], totalRev: 0, totalExp: 0, net: 0, margin: 0 };

    const headers = lines[0].split(',').map((h) => h.trim());
    const revIdx = headers.findIndex((h) => h.toLowerCase().includes('rev'));
    const expIdx = headers.findIndex((h) => h.toLowerCase().includes('exp'));

    const rows = lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim());
      const rev = revIdx >= 0 ? Number(cols[revIdx]?.replace(/[^0-9.-]/g, '')) || 0 : 0;
      const exp = expIdx >= 0 ? Number(cols[expIdx]?.replace(/[^0-9.-]/g, '')) || 0 : 0;
      return { cols, rev, exp };
    });

    const totalRev = rows.reduce((a, r) => a + r.rev, 0);
    const totalExp = rows.reduce((a, r) => a + r.exp, 0);
    const net = totalRev - totalExp;
    const margin = totalRev > 0 ? (net / totalRev) * 100 : 0;

    return { headers, rows, totalRev, totalExp, net, margin };
  }, [csvText]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCsvText(reader.result);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Executive Financial Reports & CSV Ingestion"
        subtitle="Generate board-ready monthly, quarterly, and annual statements or ingest raw accounting CSV exports · DEMO DATA"
        actions={
          <div className="flex items-center gap-2 no-print">
            <button
              onClick={() => window.print()}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print Board View
            </button>
            <button
              onClick={() =>
                downloadCSV('apex-financial-reports.csv', db.financialReports as unknown as Record<string, unknown>[])
              }
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export Reports CSV
            </button>
          </div>
        }
      />

      {/* Generate New Report Bar */}
      {editable && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-end gap-4 no-print">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Report Granularity</label>
            <select
              value={periodType}
              onChange={(e) => {
                const pt = e.target.value as typeof periodType;
                setPeriodType(pt);
                setPeriodLabel(pt === 'Monthly' ? '2026-11' : pt === 'Quarterly' ? '2026 Q4' : '2026');
              }}
              className="border border-slate-200 rounded px-3 py-2 text-xs bg-white"
            >
              <option value="Monthly">Monthly Summary</option>
              <option value="Quarterly">Quarterly Summary</option>
              <option value="Annual">Annual Summary</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Period</label>
            <select
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              className="border border-slate-200 rounded px-3 py-2 text-xs bg-white font-mono-num"
            >
              {periodOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => generateFinancialReport(periodType, periodLabel)}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md"
          >
            Generate Report from Live Ledger
          </button>
        </div>
      )}

      {/* Saved Reports Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-slate-900">Generated Executive Reports</h2>
          <span className="text-xs font-mono-num text-slate-500">{db.financialReports.length} archived</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="text-left py-3 px-4 font-semibold">Report Title</th>
                <th className="text-left py-3 px-3 font-semibold">Period</th>
                <th className="text-right py-3 px-3 font-semibold">Total Revenue</th>
                <th className="text-right py-3 px-3 font-semibold">Total Expenses</th>
                <th className="text-right py-3 px-3 font-semibold">Operating Surplus</th>
                <th className="text-right py-3 px-3 font-semibold">Contrib. Margin</th>
                <th className="text-right py-3 px-3 font-semibold">Break-Even</th>
                <th className="text-left py-3 px-4 font-semibold">Generated By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.financialReports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{r.title}</div>
                    <div className="text-slate-400 font-mono-num">{r.id} · {r.generatedDate}</div>
                  </td>
                  <td className="py-3 px-3 font-mono-num text-slate-700">{r.periodLabel}</td>
                  <td className="py-3 px-3 text-right font-mono-num text-slate-900">{formatINR(r.totalRevenue)}</td>
                  <td className="py-3 px-3 text-right font-mono-num text-slate-700">{formatINR(r.totalExpenses)}</td>
                  <td
                    className={`py-3 px-3 text-right font-mono-num font-semibold ${
                      r.operatingSurplus >= 0 ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {formatINR(r.operatingSurplus)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono-num text-slate-800">
                    {formatPct(r.contributionMarginPct)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono-num text-blue-700">
                    {r.breakEvenCustomers} cust.
                  </td>
                  <td className="py-3 px-4 text-slate-600">{r.generatedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MVP Automated Financial CSV Ingestion Sandbox */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-700" />
              Automated CSV Financial Dataset Ingestion Preview
            </h2>
            <p className="text-xs text-slate-500">
              Upload or paste raw CSV exports (QuickBooks, Zoho Books, Tally) to generate instant normalized executive metrics.
            </p>
          </div>
          <label className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer inline-flex items-center gap-1.5 shrink-0 no-print">
            <Upload className="w-3.5 h-3.5" /> Upload CSV File
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Ingested Revenue" value={formatINR(parsedCsv.totalRev)} subtext={`${parsedCsv.rows.length} parsed rows`} />
          <KpiCard label="Ingested Expenses" value={formatINR(parsedCsv.totalExp)} subtext="Normalized cost lines" />
          <KpiCard
            label="Net Surplus"
            value={formatINR(parsedCsv.net)}
            trend={{ text: parsedCsv.net >= 0 ? 'Positive' : 'Deficit', positive: parsedCsv.net >= 0 }}
          />
          <KpiCard
            label="Operating Margin"
            value={formatPct(parsedCsv.margin)}
            subtext={`Live platform MRR: ${formatINR(financials.mrr, true)}`}
          />
        </div>

        <textarea
          rows={5}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="w-full border border-slate-200 rounded-md p-3 text-xs font-mono-num text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 no-print"
        />
      </div>
    </div>
  );
}
