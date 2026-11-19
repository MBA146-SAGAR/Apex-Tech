import React from 'react';
import { X } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: {
    text: string;
    positive?: boolean;
    negative?: boolean;
  };
}

export function KpiCard({ label, value, subtext, trend }: KpiCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {trend && (
          <span
            className={`text-xs font-medium font-mono-num ${
              trend.positive
                ? 'text-emerald-700'
                : trend.negative
                  ? 'text-red-700'
                  : 'text-slate-600'
            }`}
          >
            {trend.text}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold text-slate-900 font-mono-num tracking-tight">
        {value}
      </div>
      {subtext && <div className="text-xs text-slate-500 truncate">{subtext}</div>}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, actions }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
}

interface StatusTextProps {
  label: string;
  tone?: 'positive' | 'warning' | 'negative' | 'neutral' | 'info';
}

export function StatusText({ label, tone = 'neutral' }: StatusTextProps) {
  const colors = {
    positive: 'text-emerald-700',
    warning: 'text-amber-700',
    negative: 'text-red-700',
    info: 'text-blue-700',
    neutral: 'text-slate-600',
  };
  return <span className={`text-xs font-medium whitespace-nowrap ${colors[tone]}`}>{label}</span>;
}

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ open, title, onClose, children, maxWidth = 'max-w-lg' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        className={`bg-white border border-slate-200 rounded-lg w-full ${maxWidth} max-h-[90vh] flex flex-col`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
