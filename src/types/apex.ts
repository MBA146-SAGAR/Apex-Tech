export type UserRole = 'ADMIN' | 'FINANCE MANAGER' | 'SALES MANAGER' | 'EXECUTIVE';

export type NavSection =
  | 'dashboard'
  | 'customers'
  | 'pipeline'
  | 'subscriptions'
  | 'financials'
  | 'analytics'
  | 'marketing'
  | 'validation'
  | 'market'
  | 'reports'
  | 'settings';

export type CustomerStatus =
  | 'Prospect'
  | 'Qualified Lead'
  | 'Demo Scheduled'
  | 'Trial Customer'
  | 'Paid Customer'
  | 'Inactive Customer';

export type PlanName = 'Conservative' | 'Standard' | 'Premium';

export type SalesStage =
  | 'New Lead'
  | 'Contacted'
  | 'Interested'
  | 'Demo Scheduled'
  | 'Demo Completed'
  | 'Trial Started'
  | 'Negotiation'
  | 'Converted'
  | 'Lost';

export type BillingFrequency = 'Monthly' | 'Quarterly' | 'Annual';
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue';
export type SubscriptionStatus = 'Active' | 'Trial' | 'Paused' | 'Cancelled';

export type ExpenseCategory =
  | 'Fixed Expenses'
  | 'Variable Expenses'
  | 'Employee Salaries'
  | 'Cloud Hosting'
  | 'API Integration Costs'
  | 'Marketing Expenses'
  | 'Administrative Expenses'
  | 'Other Operational Expenses';

export type ExpenseType = 'Fixed' | 'Variable' | 'Other';

export type MarketingChannel =
  | 'LinkedIn Sales Navigator'
  | 'Direct Email Campaigns'
  | 'CFO Networks'
  | 'Accounting Consultants'
  | 'B2B SaaS Communities';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  active: boolean;
}

export interface CustomerRecord {
  id: string;
  companyName: string;
  contactPerson: string;
  designation: string;
  email: string;
  phone: string;
  industry: string;
  revenueRange: string;
  employeeCount: number;
  city: string;
  leadSource: string;
  acquisitionDate: string;
  subscriptionPlan: PlanName;
  status: CustomerStatus;
  monthlyValue: number;
  assignedExecutive: string;
  nextFollowUp: string;
  remarks: string;
}

export interface LeadRecord {
  id: string;
  companyName: string;
  contactPerson: string;
  jobDesignation: string;
  email: string;
  leadSource: string;
  expectedDealValue: number;
  salesStage: SalesStage;
  followUpDate: string;
  demoStatus: 'Not Scheduled' | 'Scheduled' | 'Completed' | 'No Show';
  conversionProbability: number;
  assignedEmployee: string;
  notes: string;
}

export interface SubscriptionRecord {
  id: string;
  customerId: string;
  planName: PlanName;
  startDate: string;
  endDate: string;
  billingFrequency: BillingFrequency;
  amount: number;
  paymentStatus: PaymentStatus;
  renewalDate: string;
  status: SubscriptionStatus;
}

export interface RevenueTransaction {
  id: string;
  date: string;
  customerId: string;
  subscriptionId: string;
  category: 'Subscription Revenue' | 'Other Revenue';
  amount: number;
  month: string;
  quarter: string;
  notes: string;
}

export interface ExpenseTransaction {
  id: string;
  date: string;
  category: ExpenseCategory;
  expenseType: ExpenseType;
  amount: number;
  vendor: string;
  month: string;
  quarter: string;
  notes: string;
}

export interface MarketingCampaign {
  id: string;
  campaignName: string;
  channel: MarketingChannel;
  budget: number;
  leadsGenerated: number;
  demoBookings: number;
  paidCustomers: number;
  week: 'Week 1' | 'Week 2' | 'Week 3' | 'Week 4';
  status: 'Active' | 'Planned' | 'Completed' | 'Paused';
}

export interface ValidationTask {
  id: string;
  week: 'Week 1' | 'Week 2' | 'Week 3' | 'Week 4';
  taskDescription: string;
  assignedPerson: string;
  startDate: string;
  dueDate: string;
  targetValue: number;
  actualAchievement: number;
  unit: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Overdue';
  remarks: string;
}

export interface CustomerFeedback {
  id: string;
  customerName: string;
  company: string;
  designation: string;
  interviewDate: string;
  majorPainPoints: string;
  dataSecurityConcerns: string;
  productFeedback: string;
  willingnessToPay: number;
  pricingFeedback: string;
  improvementSuggestions: string;
  hoursSavedWeekly: number;
  securityTrustConfirmed: boolean;
  willingnessConfirmed: boolean;
  timeReductionConfirmed: boolean;
  validationStatus: 'Validated' | 'Pending Review' | 'Follow-up Required';
}

export interface FinancialReport {
  id: string;
  title: string;
  periodType: 'Monthly' | 'Quarterly' | 'Annual';
  periodLabel: string;
  totalRevenue: number;
  totalExpenses: number;
  operatingSurplus: number;
  contributionMarginPct: number;
  breakEvenCustomers: number;
  generatedDate: string;
  generatedBy: string;
}

export interface FinancialAssumptions {
  sellingPrice: number;
  variableCostPerCustomer: number;
  expectedCustomers: number;
  monthlyFixedCost: number;
  tamCustomers: number;
  samCustomers: number;
  somCustomers: number;
  annualSpendPerCustomer: number;
}

export interface ApexDatabase {
  users: UserRecord[];
  customers: CustomerRecord[];
  leads: LeadRecord[];
  subscriptions: SubscriptionRecord[];
  revenueTransactions: RevenueTransaction[];
  expenseTransactions: ExpenseTransaction[];
  marketingCampaigns: MarketingCampaign[];
  validationTasks: ValidationTask[];
  customerFeedback: CustomerFeedback[];
  financialReports: FinancialReport[];
  assumptions: FinancialAssumptions;
}

export interface WorkflowAlert {
  id: string;
  type: 'renewal' | 'overdue_payment' | 'follow_up' | 'validation_task' | 'campaign';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  targetSection: NavSection;
  date: string;
}
