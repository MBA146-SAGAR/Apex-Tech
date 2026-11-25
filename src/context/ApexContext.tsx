import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { INITIAL_DATABASE } from '../data/seedData';
import {
  ApexDatabase,
  CustomerFeedback,
  CustomerRecord,
  ExpenseTransaction,
  FinancialAssumptions,
  FinancialReport,
  LeadRecord,
  MarketingCampaign,
  NavSection,
  PlanName,
  RevenueTransaction,
  SubscriptionRecord,
  UserRecord,
  UserRole,
  ValidationTask,
  WorkflowAlert,
} from '../types/apex';
import {
  ComputedFinancials,
  PLAN_PRICES,
  computeFinancials,
  generateWorkflowAlerts,
} from '../utils/financialEngine';
import { getMonthLabel, getQuarterLabel } from '../utils/formatters';

const STORAGE_KEY = 'apex_tech_platform_db_v1';
const USER_STORAGE_KEY = 'apex_tech_current_user_id_v1';

interface ApexContextValue {
  db: ApexDatabase;
  financials: ComputedFinancials;
  alerts: WorkflowAlert[];
  currentUser: UserRecord;
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;
  switchUser: (userId: string) => void;
  canAccessSection: (section: NavSection) => boolean;
  canEditSection: (section: NavSection) => boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  // CRUD & interconnected workflows
  addCustomer: (customer: Omit<CustomerRecord, 'id'>) => { ok: boolean; error?: string };
  updateCustomer: (customer: CustomerRecord) => void;
  addLead: (lead: Omit<LeadRecord, 'id'>) => void;
  updateLead: (lead: LeadRecord) => void;
  convertLeadToCustomer: (leadId: string, plan: PlanName) => void;
  addSubscription: (sub: Omit<SubscriptionRecord, 'id'>) => void;
  markSubscriptionPaid: (subId: string) => void;
  updateSubscriptionStatus: (subId: string, status: SubscriptionRecord['status']) => void;
  addRevenueTransaction: (tx: Omit<RevenueTransaction, 'id' | 'month' | 'quarter'>) => void;
  addExpenseTransaction: (tx: Omit<ExpenseTransaction, 'id' | 'month' | 'quarter'>) => void;
  addCampaign: (campaign: Omit<MarketingCampaign, 'id'>) => void;
  updateCampaign: (campaign: MarketingCampaign) => void;
  addValidationTask: (task: Omit<ValidationTask, 'id'>) => void;
  updateValidationTask: (task: ValidationTask) => void;
  addFeedback: (feedback: Omit<CustomerFeedback, 'id'>) => void;
  updateFeedback: (feedback: CustomerFeedback) => void;
  generateFinancialReport: (periodType: 'Monthly' | 'Quarterly' | 'Annual', periodLabel: string) => void;
  updateAssumptions: (assumptions: FinancialAssumptions) => void;
  addUser: (user: Omit<UserRecord, 'id'>) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  resetDemoData: () => void;
}

const ROLE_SECTIONS: Record<UserRole, NavSection[]> = {
  ADMIN: [
    'dashboard',
    'customers',
    'pipeline',
    'subscriptions',
    'financials',
    'analytics',
    'marketing',
    'validation',
    'market',
    'reports',
    'settings',
  ],
  'FINANCE MANAGER': [
    'dashboard',
    'subscriptions',
    'financials',
    'analytics',
    'reports',
    'settings',
  ],
  'SALES MANAGER': [
    'dashboard',
    'customers',
    'pipeline',
    'marketing',
    'validation',
    'market',
    'reports',
    'settings',
  ],
  EXECUTIVE: ['dashboard', 'analytics', 'market', 'reports', 'settings'],
};

const ApexContext = createContext<ApexContextValue | null>(null);

export function ApexProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<ApexDatabase>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as ApexDatabase;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_DATABASE;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      return localStorage.getItem(USER_STORAGE_KEY) || 'USR-01';
    } catch {
      return 'USR-01';
    }
  });

  const validSections: NavSection[] = [
    'dashboard',
    'customers',
    'pipeline',
    'subscriptions',
    'financials',
    'analytics',
    'marketing',
    'validation',
    'market',
    'reports',
    'settings',
  ];

  const [activeSection, setActiveSectionState] = useState<NavSection>(() => {
    const hash = window.location.hash.replace('#', '') as NavSection;
    return validSections.includes(hash) ? hash : 'dashboard';
  });

  const setActiveSection = (section: NavSection) => {
    setActiveSectionState(section);
    if (window.location.hash !== `#${section}`) {
      window.location.hash = section;
    }
  };

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '') as NavSection;
      if (validSections.includes(hash)) {
        setActiveSectionState(hash);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // ignore quota errors
    }
  }, [db]);

  useEffect(() => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, currentUserId);
    } catch {
      // ignore
    }
  }, [currentUserId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const currentUser = useMemo(
    () => db.users.find((u) => u.id === currentUserId) || db.users[0],
    [db.users, currentUserId]
  );

  const financials = useMemo(() => computeFinancials(db), [db]);
  const alerts = useMemo(() => generateWorkflowAlerts(db), [db]);

  const canAccessSection = (section: NavSection) => {
    return ROLE_SECTIONS[currentUser.role].includes(section);
  };

  const canEditSection = (section: NavSection) => {
    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.role === 'EXECUTIVE') return false;
    if (currentUser.role === 'FINANCE MANAGER') {
      return ['subscriptions', 'financials', 'reports'].includes(section);
    }
    if (currentUser.role === 'SALES MANAGER') {
      return ['customers', 'pipeline', 'marketing', 'validation'].includes(section);
    }
    return false;
  };

  const switchUser = (userId: string) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return;
    setCurrentUserId(userId);
    if (!ROLE_SECTIONS[user.role].includes(activeSection)) {
      setActiveSection('dashboard');
    }
    showToast(`Signed in as ${user.name} (${user.role})`);
  };

  const addCustomer = (customer: Omit<CustomerRecord, 'id'>) => {
    const duplicate = db.customers.some(
      (c) =>
        c.email.toLowerCase() === customer.email.toLowerCase() ||
        c.companyName.toLowerCase() === customer.companyName.toLowerCase()
    );
    if (duplicate) {
      return { ok: false, error: 'A customer with this company name or email already exists.' };
    }
    const newId = `CUST-${1001 + db.customers.length + Math.floor(Math.random() * 90)}`;
    const newRecord: CustomerRecord = { ...customer, id: newId };
    setDb((prev) => ({
      ...prev,
      customers: [newRecord, ...prev.customers],
    }));
    showToast(`Notification: New customer ${customer.companyName} registered (${newId}).`);
    return { ok: true };
  };

  const updateCustomer = (customer: CustomerRecord) => {
    setDb((prev) => ({
      ...prev,
      customers: prev.customers.map((c) => (c.id === customer.id ? customer : c)),
    }));
    showToast(`Updated customer record for ${customer.companyName}.`);
  };

  const addLead = (lead: Omit<LeadRecord, 'id'>) => {
    const newId = `LEAD-${501 + db.leads.length + Math.floor(Math.random() * 50)}`;
    setDb((prev) => ({
      ...prev,
      leads: [{ ...lead, id: newId }, ...prev.leads],
    }));
    showToast(`Lead ${lead.companyName} added to sales pipeline.`);
  };

  const updateLead = (lead: LeadRecord) => {
    setDb((prev) => ({
      ...prev,
      leads: prev.leads.map((l) => (l.id === lead.id ? lead : l)),
    }));
    showToast(`Pipeline stage updated for ${lead.companyName} (${lead.salesStage}).`);
  };

  const convertLeadToCustomer = (leadId: string, plan: PlanName) => {
    const lead = db.leads.find((l) => l.id === leadId);
    if (!lead) return;

    const today = '2026-11-19';
    const monthlyValue = PLAN_PRICES[plan];
    const existingCust = db.customers.find(
      (c) =>
        c.companyName.toLowerCase() === lead.companyName.toLowerCase() ||
        c.email.toLowerCase() === lead.email.toLowerCase()
    );

    const customerId = existingCust ? existingCust.id : `CUST-${1030 + db.customers.length}`;
    const subId = `SUB-${2030 + db.subscriptions.length}`;
    const revId = `REV-${3150 + db.revenueTransactions.length}`;

    const newCustomer: CustomerRecord = existingCust
      ? {
          ...existingCust,
          status: 'Paid Customer',
          subscriptionPlan: plan,
          monthlyValue,
          acquisitionDate: today,
        }
      : {
          id: customerId,
          companyName: lead.companyName,
          contactPerson: lead.contactPerson,
          designation: lead.jobDesignation,
          email: lead.email,
          phone: '+91 98450 00000',
          industry: 'B2B SaaS',
          revenueRange: '₹80 Cr – ₹150 Cr',
          employeeCount: 120,
          city: 'Bengaluru',
          leadSource: lead.leadSource,
          acquisitionDate: today,
          subscriptionPlan: plan,
          status: 'Paid Customer',
          monthlyValue,
          assignedExecutive: lead.assignedEmployee,
          nextFollowUp: '2026-12-19',
          remarks: `Converted from ${lead.id}`,
        };

    const newSub: SubscriptionRecord = {
      id: subId,
      customerId,
      planName: plan,
      startDate: today,
      endDate: '2027-11-18',
      billingFrequency: 'Monthly',
      amount: monthlyValue,
      paymentStatus: 'Paid',
      renewalDate: '2026-12-19',
      status: 'Active',
    };

    const newRev: RevenueTransaction = {
      id: revId,
      date: today,
      customerId,
      subscriptionId: subId,
      category: 'Subscription Revenue',
      amount: monthlyValue,
      month: getMonthLabel(today),
      quarter: getQuarterLabel(today),
      notes: `Initial ${plan} plan payment upon pipeline conversion`,
    };

    setDb((prev) => ({
      ...prev,
      leads: prev.leads.map((l) =>
        l.id === leadId
          ? { ...l, salesStage: 'Converted', conversionProbability: 100, demoStatus: 'Completed' }
          : l
      ),
      customers: existingCust
        ? prev.customers.map((c) => (c.id === customerId ? newCustomer : c))
        : [newCustomer, ...prev.customers],
      subscriptions: [newSub, ...prev.subscriptions],
      revenueTransactions: [newRev, ...prev.revenueTransactions],
    }));

    showToast(
      `Converted ${lead.companyName} to Paid Customer (${plan}) · Subscription & ₹${monthlyValue.toLocaleString('en-IN')} revenue logged.`
    );
  };

  const addSubscription = (sub: Omit<SubscriptionRecord, 'id'>) => {
    const newId = `SUB-${2050 + db.subscriptions.length}`;
    setDb((prev) => ({
      ...prev,
      subscriptions: [{ ...sub, id: newId }, ...prev.subscriptions],
    }));
    showToast(`Subscription ${newId} created.`);
  };

  const markSubscriptionPaid = (subId: string) => {
    const sub = db.subscriptions.find((s) => s.id === subId);
    if (!sub) return;
    const today = '2026-11-19';
    const newRev: RevenueTransaction = {
      id: `REV-${3200 + db.revenueTransactions.length}`,
      date: today,
      customerId: sub.customerId,
      subscriptionId: sub.id,
      category: 'Subscription Revenue',
      amount: sub.amount,
      month: getMonthLabel(today),
      quarter: getQuarterLabel(today),
      notes: `Payment settled for ${sub.id} (${sub.planName} Plan)`,
    };
    setDb((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.map((s) =>
        s.id === subId
          ? { ...s, paymentStatus: 'Paid', status: 'Active', renewalDate: '2026-12-19' }
          : s
      ),
      revenueTransactions: [newRev, ...prev.revenueTransactions],
    }));
    showToast(`Payment recorded for ${subId}. Revenue ledger updated.`);
  };

  const updateSubscriptionStatus = (subId: string, status: SubscriptionRecord['status']) => {
    setDb((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.map((s) => (s.id === subId ? { ...s, status } : s)),
    }));
    showToast(`Subscription ${subId} marked ${status}.`);
  };

  const addRevenueTransaction = (tx: Omit<RevenueTransaction, 'id' | 'month' | 'quarter'>) => {
    const newId = `REV-${3300 + db.revenueTransactions.length}`;
    const record: RevenueTransaction = {
      ...tx,
      id: newId,
      month: getMonthLabel(tx.date),
      quarter: getQuarterLabel(tx.date),
    };
    setDb((prev) => ({
      ...prev,
      revenueTransactions: [record, ...prev.revenueTransactions],
    }));
    showToast(`Logged revenue transaction ${newId}.`);
  };

  const addExpenseTransaction = (tx: Omit<ExpenseTransaction, 'id' | 'month' | 'quarter'>) => {
    const newId = `EXP-${4100 + db.expenseTransactions.length}`;
    const record: ExpenseTransaction = {
      ...tx,
      id: newId,
      month: getMonthLabel(tx.date),
      quarter: getQuarterLabel(tx.date),
    };
    setDb((prev) => ({
      ...prev,
      expenseTransactions: [record, ...prev.expenseTransactions],
    }));
    showToast(`Logged expense transaction ${newId}.`);
  };

  const addCampaign = (campaign: Omit<MarketingCampaign, 'id'>) => {
    const newId = `CMP-${610 + db.marketingCampaigns.length}`;
    setDb((prev) => ({
      ...prev,
      marketingCampaigns: [{ ...campaign, id: newId }, ...prev.marketingCampaigns],
    }));
    showToast(`Marketing campaign "${campaign.campaignName}" launched.`);
  };

  const updateCampaign = (campaign: MarketingCampaign) => {
    setDb((prev) => ({
      ...prev,
      marketingCampaigns: prev.marketingCampaigns.map((c) => (c.id === campaign.id ? campaign : c)),
    }));
    showToast(`Campaign ${campaign.campaignName} updated.`);
  };

  const addValidationTask = (task: Omit<ValidationTask, 'id'>) => {
    const newId = `VAL-${710 + db.validationTasks.length}`;
    setDb((prev) => ({
      ...prev,
      validationTasks: [...prev.validationTasks, { ...task, id: newId }],
    }));
    showToast(`Validation task added to ${task.week}.`);
  };

  const updateValidationTask = (task: ValidationTask) => {
    setDb((prev) => ({
      ...prev,
      validationTasks: prev.validationTasks.map((t) => (t.id === task.id ? task : t)),
    }));
    showToast(`Updated ${task.week} validation progress.`);
  };

  const addFeedback = (feedback: Omit<CustomerFeedback, 'id'>) => {
    const newId = `INT-${810 + db.customerFeedback.length}`;
    setDb((prev) => ({
      ...prev,
      customerFeedback: [{ ...feedback, id: newId }, ...prev.customerFeedback],
    }));
    showToast(`Interview record logged for ${feedback.company}.`);
  };

  const updateFeedback = (feedback: CustomerFeedback) => {
    setDb((prev) => ({
      ...prev,
      customerFeedback: prev.customerFeedback.map((f) => (f.id === feedback.id ? feedback : f)),
    }));
    showToast(`Updated validation interview for ${feedback.company}.`);
  };

  const generateFinancialReport = (
    periodType: 'Monthly' | 'Quarterly' | 'Annual',
    periodLabel: string
  ) => {
    let rev = 0;
    let exp = 0;
    if (periodType === 'Monthly') {
      rev = db.revenueTransactions
        .filter((r) => r.month === periodLabel)
        .reduce((a, b) => a + b.amount, 0);
      exp = db.expenseTransactions
        .filter((e) => e.month === periodLabel)
        .reduce((a, b) => a + b.amount, 0);
    } else if (periodType === 'Quarterly') {
      rev = db.revenueTransactions
        .filter((r) => r.quarter === periodLabel)
        .reduce((a, b) => a + b.amount, 0);
      exp = db.expenseTransactions
        .filter((e) => e.quarter === periodLabel)
        .reduce((a, b) => a + b.amount, 0);
    } else {
      rev = db.revenueTransactions
        .filter((r) => r.date.startsWith(periodLabel))
        .reduce((a, b) => a + b.amount, 0);
      exp = db.expenseTransactions
        .filter((e) => e.date.startsWith(periodLabel))
        .reduce((a, b) => a + b.amount, 0);
    }

    const report: FinancialReport = {
      id: `RPT-${910 + db.financialReports.length}`,
      title: `${periodType} Financial Summary — ${periodLabel}`,
      periodType,
      periodLabel,
      totalRevenue: rev,
      totalExpenses: exp,
      operatingSurplus: rev - exp,
      contributionMarginPct: Number(financials.contributionMarginPct.toFixed(1)),
      breakEvenCustomers: financials.breakEvenCustomers,
      generatedDate: '2026-11-19',
      generatedBy: currentUser.name,
    };

    setDb((prev) => ({
      ...prev,
      financialReports: [report, ...prev.financialReports],
    }));
    showToast(`Generated ${periodType} report for ${periodLabel}.`);
  };

  const updateAssumptions = (assumptions: FinancialAssumptions) => {
    setDb((prev) => ({ ...prev, assumptions }));
    showToast('Financial calculation engine assumptions updated.');
  };

  const addUser = (user: Omit<UserRecord, 'id'>) => {
    const newId = `USR-0${db.users.length + 1}`;
    setDb((prev) => ({
      ...prev,
      users: [...prev.users, { ...user, id: newId }],
    }));
    showToast(`Added user ${user.name} (${user.role}).`);
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    setDb((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, role } : u)),
    }));
    showToast(`Role updated to ${role}.`);
  };

  const resetDemoData = () => {
    setDb(INITIAL_DATABASE);
    showToast('Reset all 10 database tables to initial DEMO DATA.');
  };

  return (
    <ApexContext.Provider
      value={{
        db,
        financials,
        alerts,
        currentUser,
        activeSection,
        setActiveSection,
        switchUser,
        canAccessSection,
        canEditSection,
        toastMessage,
        showToast,
        addCustomer,
        updateCustomer,
        addLead,
        updateLead,
        convertLeadToCustomer,
        addSubscription,
        markSubscriptionPaid,
        updateSubscriptionStatus,
        addRevenueTransaction,
        addExpenseTransaction,
        addCampaign,
        updateCampaign,
        addValidationTask,
        updateValidationTask,
        addFeedback,
        updateFeedback,
        generateFinancialReport,
        updateAssumptions,
        addUser,
        updateUserRole,
        resetDemoData,
      }}
    >
      {children}
    </ApexContext.Provider>
  );
}

export function useApex() {
  const ctx = useContext(ApexContext);
  if (!ctx) {
    throw new Error('useApex must be used inside ApexProvider');
  }
  return ctx;
}
