export function formatINR(amount: number, compact = false): string {
  if (!Number.isFinite(amount)) return '₹0';
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);

  if (compact) {
    if (abs >= 1e7) {
      return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`;
    }
    if (abs >= 1e5) {
      return `${sign}₹${(abs / 1e5).toFixed(2)} L`;
    }
    if (abs >= 1e3) {
      return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
    }
  }

  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
}

export function formatPct(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '0.0%';
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return Math.round(value).toLocaleString('en-IN');
}

export function getMonthLabel(dateStr: string): string {
  if (!dateStr) return '2026-11';
  return dateStr.slice(0, 7);
}

export function getQuarterLabel(dateStr: string): string {
  if (!dateStr || dateStr.length < 7) return '2026 Q4';
  const year = dateStr.slice(0, 4);
  const month = parseInt(dateStr.slice(5, 7), 10);
  const q = Math.ceil((month || 1) / 3);
  return `${year} Q${q}`;
}

export function daysUntil(dateStr: string, referenceDate = '2026-11-19'): number {
  const target = new Date(dateStr).getTime();
  const ref = new Date(referenceDate).getTime();
  if (Number.isNaN(target) || Number.isNaN(ref)) return 999;
  return Math.round((target - ref) / (1000 * 60 * 60 * 24));
}

export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? '').replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
