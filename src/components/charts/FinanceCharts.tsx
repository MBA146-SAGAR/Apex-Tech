import React, { useState } from 'react';
import { formatINR } from '../../utils/formatters';

interface MonthlySeriesPoint {
  month: string;
  label: string;
  revenue: number;
  expenses: number;
  surplus: number;
  customers: number;
  mrr: number;
}

export function RevenueExpenseBarChart({ data }: { data: MonthlySeriesPoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (data.length === 0) {
    return <div className="h-56 flex items-center justify-center text-sm text-slate-400">No transaction data</div>;
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.revenue, d.expenses)), 100000);
  const width = 620;
  const height = 220;
  const padLeft = 58;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 30;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const groupW = plotW / data.length;
  const barW = Math.min(20, groupW * 0.3);

  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 overflow-visible">
        {ticks.map((t) => {
          const y = padTop + plotH * (1 - t);
          return (
            <g key={t}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px] font-mono-num"
              >
                {formatINR(maxVal * t, true)}
              </text>
            </g>
          );
        })}

        {data.map((d, idx) => {
          const cx = padLeft + groupW * idx + groupW / 2;
          const revH = (d.revenue / maxVal) * plotH;
          const expH = (d.expenses / maxVal) * plotH;
          return (
            <g
              key={d.month}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              <rect
                x={cx - barW - 2}
                y={padTop + plotH - revH}
                width={barW}
                height={Math.max(revH, 2)}
                rx="2"
                fill="#1d4ed8"
                opacity={hoveredIdx === null || hoveredIdx === idx ? 1 : 0.45}
              />
              <rect
                x={cx + 2}
                y={padTop + plotH - expH}
                width={barW}
                height={Math.max(expH, 2)}
                rx="2"
                fill="#0f172a"
                opacity={hoveredIdx === null || hoveredIdx === idx ? 0.85 : 0.35}
              />
              <text
                x={cx}
                y={height - 8}
                textAnchor="middle"
                className="fill-slate-500 text-[10px]"
              >
                {d.label.split(' ')[0]}
              </text>
            </g>
          );
        })}
      </svg>

      {hoveredIdx !== null && data[hoveredIdx] && (
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded px-3 py-1.5 font-mono-num">
          <span className="font-semibold text-slate-900">{data[hoveredIdx].label}</span>
          <span>Revenue: {formatINR(data[hoveredIdx].revenue)}</span>
          <span>Expenses: {formatINR(data[hoveredIdx].expenses)}</span>
          <span className={data[hoveredIdx].surplus >= 0 ? 'text-emerald-700' : 'text-red-700'}>
            Surplus: {formatINR(data[hoveredIdx].surplus)}
          </span>
        </div>
      )}
    </div>
  );
}

export function LineTrendChart({
  data,
  valueKey,
  color = '#1d4ed8',
  isCurrency = true,
}: {
  data: MonthlySeriesPoint[];
  valueKey: 'mrr' | 'customers' | 'surplus';
  color?: string;
  isCurrency?: boolean;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (data.length === 0) return null;

  const vals = data.map((d) => d[valueKey]);
  const minV = Math.min(0, ...vals);
  const maxV = Math.max(...vals, 10);
  const range = maxV - minV || 1;

  const width = 520;
  const height = 190;
  const padLeft = 54;
  const padRight = 18;
  const padTop = 16;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? padLeft + plotW / 2 : padLeft + (i / (data.length - 1)) * plotW;
    const y = padTop + plotH - ((d[valueKey] - minV) / range) * plotH;
    return { x, y, d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
        {[0, 0.5, 1].map((t) => {
          const val = minV + range * t;
          const y = padTop + plotH * (1 - t);
          return (
            <g key={t}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={padLeft - 8} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-mono-num">
                {isCurrency ? formatINR(val, true) : Math.round(val)}
              </text>
            </g>
          );
        })}

        <path d={pathD} fill="none" stroke={color} strokeWidth="2.2" />

        {points.map((p, idx) => (
          <g
            key={p.d.month}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="cursor-pointer"
          >
            <circle cx={p.x} cy={p.y} r={hoveredIdx === idx ? 5 : 3.5} fill="#ffffff" stroke={color} strokeWidth="2" />
            <text x={p.x} y={height - 6} textAnchor="middle" className="fill-slate-500 text-[10px]">
              {p.d.label.split(' ')[0]}
            </text>
          </g>
        ))}
      </svg>
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div className="mt-1 text-xs text-slate-600 font-mono-num">
          {points[hoveredIdx].d.label}:{' '}
          <span className="font-semibold text-slate-900">
            {isCurrency
              ? formatINR(points[hoveredIdx].d[valueKey])
              : `${points[hoveredIdx].d[valueKey]} customers`}
          </span>
        </div>
      )}
    </div>
  );
}

export function BreakEvenChart({
  sellingPrice,
  variableCost,
  fixedCost,
  currentCustomers,
}: {
  sellingPrice: number;
  variableCost: number;
  fixedCost: number;
  currentCustomers: number;
}) {
  const maxCust = Math.max(25, currentCustomers + 5);
  const steps = Array.from({ length: maxCust + 1 }, (_, n) => ({
    n,
    revenue: n * sellingPrice,
    totalCost: fixedCost + n * variableCost,
  }));

  const maxVal = Math.max(...steps.map((s) => Math.max(s.revenue, s.totalCost)), 100000);
  const width = 580;
  const height = 220;
  const padLeft = 58;
  const padRight = 20;
  const padTop = 18;
  const padBottom = 30;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const toX = (n: number) => padLeft + (n / maxCust) * plotW;
  const toY = (val: number) => padTop + plotH - (val / maxVal) * plotH;

  const revPath = steps.map((s, i) => `${i === 0 ? 'M' : 'L'} ${toX(s.n)} ${toY(s.revenue)}`).join(' ');
  const costPath = steps.map((s, i) => `${i === 0 ? 'M' : 'L'} ${toX(s.n)} ${toY(s.totalCost)}`).join(' ');
  const contrib = sellingPrice - variableCost;
  const breakEvenN = contrib > 0 ? fixedCost / contrib : 0;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 overflow-visible">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = padTop + plotH * (1 - t);
        return (
          <g key={t}>
            <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={padLeft - 8} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-mono-num">
              {formatINR(maxVal * t, true)}
            </text>
          </g>
        );
      })}

      {/* Fixed cost line */}
      <line
        x1={padLeft}
        y1={toY(fixedCost)}
        x2={width - padRight}
        y2={toY(fixedCost)}
        stroke="#94a3b8"
        strokeDasharray="4 4"
        strokeWidth="1.2"
      />

      <path d={costPath} fill="none" stroke="#dc2626" strokeWidth="2" />
      <path d={revPath} fill="none" stroke="#16a34a" strokeWidth="2.2" />

      {breakEvenN > 0 && breakEvenN <= maxCust && (
        <g>
          <line
            x1={toX(breakEvenN)}
            y1={padTop}
            x2={toX(breakEvenN)}
            y2={padTop + plotH}
            stroke="#1d4ed8"
            strokeDasharray="3 3"
            strokeWidth="1.2"
          />
          <circle
            cx={toX(breakEvenN)}
            cy={toY(breakEvenN * sellingPrice)}
            r="4.5"
            fill="#1d4ed8"
          />
          <text
            x={toX(breakEvenN) + 6}
            y={padTop + 12}
            className="fill-blue-700 text-[10px] font-medium font-mono-num"
          >
            Break-even: {Math.ceil(breakEvenN)} customers
          </text>
        </g>
      )}

      {[0, 5, 10, 15, 20, maxCust].map((n) => (
        <text key={n} x={toX(n)} y={height - 8} textAnchor="middle" className="fill-slate-500 text-[10px] font-mono-num">
          {n}
        </text>
      ))}
    </svg>
  );
}
