import React from 'react';
import { useApex } from '../../context/ApexContext';
import { formatINR, formatNumber, formatPct } from '../../utils/formatters';
import { KpiCard, SectionHeader } from '../ui/DataPrimitives';

export function MarketAnalysisView() {
  const { db, financials } = useApex();
  const { assumptions } = db;

  const tamValue = assumptions.tamCustomers * assumptions.annualSpendPerCustomer; // ₹15,00,00,00,000
  const samValue = assumptions.samCustomers * assumptions.annualSpendPerCustomer; // ₹1,50,00,00,000
  const somValue = assumptions.somCustomers * assumptions.annualSpendPerCustomer; // ₹7,50,00,000
  const somCapturePct = assumptions.somCustomers > 0 ? (financials.paidCustomers / assumptions.somCustomers) * 100 : 0;

  const competitors = [
    {
      name: 'Apex Tech (Target Position)',
      x: 9,
      y: 9,
      type: 'Our Platform',
      price: '₹20,000 – ₹30,000 / mo',
      strength: 'AI connectors + automated board decks in seconds without data engineers',
      weakness: 'Focused on CSV/accounting ingestion for mid-market MVP',
      highlight: true,
    },
    {
      name: 'Microsoft Power BI / Tableau',
      x: 3,
      y: 9,
      type: 'Direct Competitor',
      price: '$10 – $70 / user / mo + setup',
      strength: 'Extensive enterprise customizability and broad adoption',
      weakness: 'Requires data engineering teams and weeks of implementation',
      highlight: false,
    },
    {
      name: 'Mosaic / Cube Software',
      x: 6,
      y: 7,
      type: 'Indirect Competitor',
      price: '$15,000 – $40,000+ / yr',
      strength: 'FP&A workflows with CRM/ERP integrations',
      weakness: 'Prohibitively expensive for mid-market Indian SaaS SMBs',
      highlight: false,
    },
    {
      name: 'Manual Excel / Google Sheets',
      x: 2,
      y: 4,
      type: 'Substitute',
      price: 'Free – $12 / user / mo',
      strength: 'Universal availability and zero learning curve',
      weakness: '15–20 hrs/wk manual work, broken formulas, static decks',
      highlight: false,
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Market Size & Competitive Opportunity"
        subtitle="TAM / SAM / SOM financial sizing and competitive positioning matrix · DEMO DATA"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Addressable Market (TAM)"
          value={formatINR(tamValue)}
          subtext={`${formatNumber(assumptions.tamCustomers)} potential companies × ${formatINR(assumptions.annualSpendPerCustomer)}/yr`}
        />
        <KpiCard
          label="Serviceable Available Market (SAM)"
          value={formatINR(samValue)}
          subtext={`${formatNumber(assumptions.samCustomers)} Indian Tier-1 mid-market SaaS`}
        />
        <KpiCard
          label="Serviceable Obtainable Market (SOM)"
          value={formatINR(somValue)}
          subtext={`${formatNumber(assumptions.somCustomers)} target logos (5% SAM in 24 mo)`}
        />
        <KpiCard
          label="Current SOM Penetration"
          value={formatPct(somCapturePct)}
          subtext={`${financials.paidCustomers} of ${assumptions.somCustomers} obtainable logos`}
          trend={{ text: `ARR: ${formatINR(financials.arr, true)}`, positive: true }}
        />
      </div>

      {/* TAM / SAM / SOM Concentric Funnel & Competitive Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Market Opportunity Funnel (INR)</h2>
            <p className="text-xs text-slate-500">
              Beachhead: B2B SaaS startups ($10M–$30M ARR) in Bengaluru & Mumbai · Secondary: US mid-market hubs
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-900 text-white rounded-lg">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-medium text-slate-300">TAM · Global Mid-Market B2B Software</span>
                <span className="text-base font-semibold font-mono-num">{formatINR(tamValue)}</span>
              </div>
              <div className="text-xs text-slate-300 mt-1 font-mono-num">
                {formatNumber(assumptions.tamCustomers)} companies · {formatINR(assumptions.annualSpendPerCustomer)} annual spend
              </div>
            </div>

            <div className="p-4 bg-blue-800 text-white rounded-lg sm:mx-4">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-medium text-blue-100">SAM · India Tier-1 Hubs (BLR, BOM, DEL-NCR)</span>
                <span className="text-base font-semibold font-mono-num">{formatINR(samValue)}</span>
              </div>
              <div className="text-xs text-blue-100 mt-1 font-mono-num">
                {formatNumber(assumptions.samCustomers)} serviceable businesses (10% of TAM)
              </div>
            </div>

            <div className="p-4 bg-emerald-700 text-white rounded-lg sm:mx-8">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-medium text-emerald-100">SOM · 24-Month Target Capture (5% SAM)</span>
                <span className="text-base font-semibold font-mono-num">{formatINR(somValue)}</span>
              </div>
              <div className="text-xs text-emerald-100 mt-1 font-mono-num">
                {formatNumber(assumptions.somCustomers)} obtainable accounts · Current: {financials.paidCustomers} active
              </div>
            </div>
          </div>
        </div>

        {/* Competitor Battlefield 2x2 SVG Chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Competitor Battlefield Positioning</h2>
            <p className="text-xs text-slate-500">
              X: Speed to Insight & Ease of Setup (1–10) · Y: Financial Analytics & Automation Depth (1–10)
            </p>
          </div>
          <svg viewBox="0 0 420 260" className="w-full h-60">
            {/* Grid */}
            <rect x="44" y="16" width="356" height="204" fill="#f8fafc" stroke="#cbd5e1" />
            <line x1="222" y1="16" x2="222" y2="220" stroke="#cbd5e1" strokeDasharray="4 4" />
            <line x1="44" y1="118" x2="400" y2="118" stroke="#cbd5e1" strokeDasharray="4 4" />

            <text x="222" y="246" textAnchor="middle" className="fill-slate-600 text-[10px] font-medium">
              Speed to Insight & Ease of Setup →
            </text>
            <text
              x="14"
              y="118"
              textAnchor="middle"
              transform="rotate(-90 14 118)"
              className="fill-slate-600 text-[10px] font-medium"
            >
              Automation & Financial Depth →
            </text>

            {competitors.map((c) => {
              const cx = 44 + (c.x / 10) * 356;
              const cy = 220 - (c.y / 10) * 204;
              return (
                <g key={c.name}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={c.highlight ? 8 : 6}
                    fill={c.highlight ? '#1d4ed8' : '#0f172a'}
                    opacity={c.highlight ? 1 : 0.75}
                  />
                  <text
                    x={cx + (c.x >= 8 ? -10 : 10)}
                    y={cy + (c.y >= 8.5 ? 16 : 4)}
                    textAnchor={c.x >= 8 ? 'end' : 'start'}
                    className={`text-[10px] ${c.highlight ? 'fill-blue-800 font-semibold' : 'fill-slate-700'}`}
                  >
                    {c.name.split(' (')[0]} ({c.x},{c.y})
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Competitor Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="text-left py-3 px-4 font-semibold">Platform / Alternative</th>
                <th className="text-left py-3 px-3 font-semibold">Category</th>
                <th className="text-left py-3 px-3 font-semibold">Pricing</th>
                <th className="text-left py-3 px-3 font-semibold">Primary Strength</th>
                <th className="text-left py-3 px-4 font-semibold">Key Limitation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {competitors.map((c) => (
                <tr key={c.name} className={c.highlight ? 'bg-blue-50/40' : 'hover:bg-slate-50'}>
                  <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                  <td className="py-3 px-3 text-slate-600">{c.type}</td>
                  <td className="py-3 px-3 font-mono-num text-slate-800">{c.price}</td>
                  <td className="py-3 px-3 text-slate-700">{c.strength}</td>
                  <td className="py-3 px-4 text-slate-600">{c.weakness}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
