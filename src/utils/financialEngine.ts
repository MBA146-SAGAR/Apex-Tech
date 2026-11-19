import { ApexDatabase, WorkflowAlert } from '../types/apex';
import { daysUntil, formatINR } from './formatters';

export interface ComputedFinancials {
  totalRevenue: number;
  subscriptionRevenue: number;
  otherRevenue: number;
  mrr: number;
  arr: number;
  totalCustomers: number;
  paidCustomers: number;
  trialCustomers: number;
  activeSubscriptions: number;
  overdueSubscriptions: number;
  totalExpenses: number;
  fixedExpenses: number;
  variableExpenses: number;
  otherExpenses: number;
  currentMonthRevenue: number;
  currentMonthOperatingExpenses: number;
  monthlyProfitability: number;
  operatingSurplus: number;
  contributionPerCustomer: number;
  contributionMarginPct: number;
  breakEvenCustomers: number;
  cac: number;
  customerGrowthRate: number;
  demoConversionRate: number;
  leadConversionRate: number;
  expectedPipelineRevenue: number;
  retentionRate: number;
  // Venture baseline calculations from Admin assumptions
  baselineExpectedRevenue: number;
  baselineTotalVariableCost: number;
  baselineTotalOperatingCost: number;
  baselineOperatingSurplus: number;
  baselineContributionPerCustomer: number;
  baselineContributionMarginPct: number;
  baselineBreakEvenCustomers: number;
  // Monthly series for charts
  monthlySeries: {
    month: string;
    label: string;
    revenue: number;
    expenses: number;
    surplus: number;
    customers: number;
    mrr: number;
  }[];
  expenseByCategory: {
    category: string;
    amount: number;
    pct: number;
  }[];
}

export const PLAN_PRICES = {
  Conservative: 20000,
  Standard: 25000,
  Premium: 30000,
} as const;

const MONTH_LABELS: Record<string, string> = {
  '2026-06': 'Jun 2026',
  '2026-07': 'Jul 2026',
  '2026-08': 'Aug 2026',
  '2026-09': 'Sep 2026',
  '2026-10': 'Oct 2026',
  '2026-11': 'Nov 2026',
};

export function computeFinancials(db: ApexDatabase): ComputedFinancials {
  const { assumptions } = db;

  const totalRevenue = db.revenueTransactions.reduce((acc, t) => acc + t.amount, 0);
  const subscriptionRevenue = db.revenueTransactions
    .filter((t) => t.category === 'Subscription Revenue')
    .reduce((acc, t) => acc + t.amount, 0);
  const otherRevenue = totalRevenue - subscriptionRevenue;

  const activeSubs = db.subscriptions.filter((s) => s.status === 'Active');
  const mrr = activeSubs.reduce((acc, s) => {
    if (s.billingFrequency === 'Annual') return acc + s.amount / 12;
    if (s.billingFrequency === 'Quarterly') return acc + s.amount / 3;
    return acc + s.amount;
  }, 0);
  const arr = mrr * 12;

  const paidCustomers = db.customers.filter((c) => c.status === 'Paid Customer').length;
  const trialCustomers = db.customers.filter((c) => c.status === 'Trial Customer').length;
  const inactiveCustomers = db.customers.filter((c) => c.status === 'Inactive Customer').length;
  const totalCustomers = db.customers.length;
  const overdueSubscriptions = db.subscriptions.filter((s) => s.paymentStatus === 'Overdue').length;

  const totalExpenses = db.expenseTransactions.reduce((acc, e) => acc + e.amount, 0);
  const fixedExpenses = db.expenseTransactions
    .filter((e) => e.expenseType === 'Fixed')
    .reduce((acc, e) => acc + e.amount, 0);
  const variableExpenses = db.expenseTransactions
    .filter((e) => e.expenseType === 'Variable')
    .reduce((acc, e) => acc + e.amount, 0);
  const otherExpenses = totalExpenses - fixedExpenses - variableExpenses;

  const currentMonth = '2026-11';
  const currentMonthRevenue = db.revenueTransactions
    .filter((t) => t.month === currentMonth)
    .reduce((acc, t) => acc + t.amount, 0);
  const currentMonthOperatingExpenses = db.expenseTransactions
    .filter((e) => e.month === currentMonth)
    .reduce((acc, e) => acc + e.amount, 0);

  const monthlyProfitability = currentMonthRevenue - currentMonthOperatingExpenses;
  const operatingSurplus = totalRevenue - totalExpenses;

  const avgSellingPrice =
    activeSubs.length > 0 ? mrr / activeSubs.length : assumptions.sellingPrice;
  const contributionPerCustomer = avgSellingPrice - assumptions.variableCostPerCustomer;
  const contributionMarginPct =
    avgSellingPrice > 0 ? (contributionPerCustomer / avgSellingPrice) * 100 : 0;
  const breakEvenCustomers =
    contributionPerCustomer > 0
      ? Math.ceil(assumptions.monthlyFixedCost / contributionPerCustomer)
      : 0;

  const totalMarketingSpend = db.marketingCampaigns.reduce((acc, c) => acc + c.budget, 0);
  const totalMarketingCustomers = db.marketingCampaigns.reduce(
    (acc, c) => acc + c.paidCustomers,
    0
  );
  const cac =
    totalMarketingCustomers > 0
      ? totalMarketingSpend / totalMarketingCustomers
      : paidCustomers > 0
        ? totalMarketingSpend / paidCustomers
        : 0;

  // Leads analytics
  const totalLeads = db.leads.length;
  const demosCompleted = db.leads.filter(
    (l) =>
      l.demoStatus === 'Completed' ||
      ['Demo Completed', 'Trial Started', 'Negotiation', 'Converted'].includes(l.salesStage)
  ).length;
  const convertedLeads = db.leads.filter((l) => l.salesStage === 'Converted').length;
  const demoConversionRate = demosCompleted > 0 ? (convertedLeads / demosCompleted) * 100 : 0;
  const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  const expectedPipelineRevenue = db.leads
    .filter((l) => l.salesStage !== 'Lost' && l.salesStage !== 'Converted')
    .reduce((acc, l) => acc + l.expectedDealValue * (l.conversionProbability / 100), 0);

  const activePlusInactive = paidCustomers + inactiveCustomers;
  const retentionRate =
    activePlusInactive > 0 ? (paidCustomers / activePlusInactive) * 100 : 100;

  // Monthly trends
  const allMonths = Array.from(
    new Set([
      ...db.revenueTransactions.map((r) => r.month),
      ...db.expenseTransactions.map((e) => e.month),
    ])
  ).sort();

  const monthlySeries = allMonths.map((m) => {
    const rev = db.revenueTransactions
      .filter((r) => r.month === m)
      .reduce((acc, r) => acc + r.amount, 0);
    const exp = db.expenseTransactions
      .filter((e) => e.month === m)
      .reduce((acc, e) => acc + e.amount, 0);
    const custCount = db.customers.filter(
      (c) => c.status === 'Paid Customer' && c.acquisitionDate.slice(0, 7) <= m
    ).length;
    const monthMrr = db.revenueTransactions
      .filter((r) => r.month === m && r.category === 'Subscription Revenue')
      .reduce((acc, r) => acc + r.amount, 0);
    return {
      month: m,
      label: MONTH_LABELS[m] || m,
      revenue: rev,
      expenses: exp,
      surplus: rev - exp,
      customers: custCount,
      mrr: monthMrr,
    };
  });

  const lastCust = monthlySeries[monthlySeries.length - 1]?.customers || paidCustomers;
  const prevCust = monthlySeries[monthlySeries.length - 2]?.customers || lastCust;
  const customerGrowthRate = prevCust > 0 ? ((lastCust - prevCust) / prevCust) * 100 : 0;

  // Expense category aggregation
  const catMap = new Map<string, number>();
  for (const exp of db.expenseTransactions) {
    catMap.set(exp.category, (catMap.get(exp.category) || 0) + exp.amount);
  }
  const expenseByCategory = Array.from(catMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      pct: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Baseline assumptions validation (from Venture Plan)
  const baselineExpectedRevenue = assumptions.sellingPrice * assumptions.expectedCustomers;
  const baselineTotalVariableCost =
    assumptions.variableCostPerCustomer * assumptions.expectedCustomers;
  const baselineTotalOperatingCost =
    assumptions.monthlyFixedCost + baselineTotalVariableCost;
  const baselineOperatingSurplus = baselineExpectedRevenue - baselineTotalOperatingCost;
  const baselineContributionPerCustomer =
    assumptions.sellingPrice - assumptions.variableCostPerCustomer;
  const baselineContributionMarginPct =
    assumptions.sellingPrice > 0
      ? (baselineContributionPerCustomer / assumptions.sellingPrice) * 100
      : 0;
  const baselineBreakEvenCustomers =
    baselineContributionPerCustomer > 0
      ? Math.ceil(assumptions.monthlyFixedCost / baselineContributionPerCustomer)
      : 0;

  return {
    totalRevenue,
    subscriptionRevenue,
    otherRevenue,
    mrr,
    arr,
    totalCustomers,
    paidCustomers,
    trialCustomers,
    activeSubscriptions: activeSubs.length,
    overdueSubscriptions,
    totalExpenses,
    fixedExpenses,
    variableExpenses,
    otherExpenses,
    currentMonthRevenue,
    currentMonthOperatingExpenses,
    monthlyProfitability,
    operatingSurplus,
    contributionPerCustomer,
    contributionMarginPct,
    breakEvenCustomers,
    cac,
    customerGrowthRate,
    demoConversionRate,
    leadConversionRate,
    expectedPipelineRevenue,
    retentionRate,
    baselineExpectedRevenue,
    baselineTotalVariableCost,
    baselineTotalOperatingCost,
    baselineOperatingSurplus,
    baselineContributionPerCustomer,
    baselineContributionMarginPct,
    baselineBreakEvenCustomers,
    monthlySeries,
    expenseByCategory,
  };
}

export function generateWorkflowAlerts(db: ApexDatabase): WorkflowAlert[] {
  const alerts: WorkflowAlert[] = [];
  const today = '2026-11-19';

  for (const sub of db.subscriptions) {
    const cust = db.customers.find((c) => c.id === sub.customerId);
    const company = cust?.companyName || sub.customerId;
    if (sub.paymentStatus === 'Overdue') {
      alerts.push({
        id: `alert-overdue-${sub.id}`,
        type: 'overdue_payment',
        severity: 'critical',
        title: `Overdue payment: ${company}`,
        description: `${sub.planName} plan (${formatINR(sub.amount)}) payment overdue since ${sub.renewalDate}.`,
        targetSection: 'subscriptions',
        date: sub.renewalDate,
      });
    } else if (sub.status === 'Active' && daysUntil(sub.renewalDate, today) <= 14 && daysUntil(sub.renewalDate, today) >= 0) {
      alerts.push({
        id: `alert-renewal-${sub.id}`,
        type: 'renewal',
        severity: 'warning',
        title: `Upcoming renewal: ${company}`,
        description: `Renews on ${sub.renewalDate} (${daysUntil(sub.renewalDate, today)} days) for ${formatINR(sub.amount)}.`,
        targetSection: 'subscriptions',
        date: sub.renewalDate,
      });
    }
  }

  for (const lead of db.leads) {
    if (lead.salesStage !== 'Converted' && lead.salesStage !== 'Lost') {
      const diff = daysUntil(lead.followUpDate, today);
      if (diff <= 2) {
        alerts.push({
          id: `alert-lead-${lead.id}`,
          type: 'follow_up',
          severity: diff < 0 ? 'critical' : 'warning',
          title: `Sales follow-up due: ${lead.companyName}`,
          description: `${lead.contactPerson} (${lead.salesStage}) scheduled for ${lead.followUpDate}.`,
          targetSection: 'pipeline',
          date: lead.followUpDate,
        });
      }
    }
  }

  for (const task of db.validationTasks) {
    if (task.status === 'Overdue' || (task.status !== 'Completed' && daysUntil(task.dueDate, today) < 0)) {
      alerts.push({
        id: `alert-task-${task.id}`,
        type: 'validation_task',
        severity: 'critical',
        title: `Validation task behind schedule (${task.week})`,
        description: `${task.taskDescription} — ${task.actualAchievement}/${task.targetValue} ${task.unit}.`,
        targetSection: 'validation',
        date: task.dueDate,
      });
    }
  }

  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}
