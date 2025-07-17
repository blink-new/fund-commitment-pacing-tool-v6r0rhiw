// General Fund Database - No commitment amounts, just fund characteristics and net cashflows
export interface GeneralFund {
  id: string
  name: string
  vintage: number
  fundType: string
  strategy: string
  geography: string
  managementFeeRate?: number // Annual management fee as percentage
  carriedInterestRate?: number // Carried interest as percentage
  expectedLifespan: number // Expected fund life in years
  description?: string
  createdAt: string
  updatedAt: string
  userId: string
}

// Net cashflow data for general funds (as percentages of commitment)
export interface GeneralFundNetCashflow {
  id: string
  fundId: string
  year: number
  netCashflowPercentage: number // Net cashflow as percentage of commitment (negative = calls, positive = distributions)
  contributionsPercentage: number // Contributions/calls as percentage of commitment (always negative or zero)
  distributionsPercentage: number // Distributions as percentage of commitment (always positive or zero)
  navPercentage: number // NAV as percentage of commitment
  createdAt: string
  updatedAt: string
  userId: string
}

// Portfolio positions - where commitment amounts are set
export interface PortfolioPosition {
  id: string
  portfolioId: string
  fundId: string // References GeneralFund
  commitmentAmount: number
  allocationPercentage: number
  createdAt: string
  updatedAt: string
  userId: string
}

// Portfolio definition
export interface Portfolio {
  id: string
  name: string
  description?: string
  totalSize: number
  clientId?: string
  createdAt: string
  updatedAt: string
  userId: string
}

// Client information
export interface Client {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  userId: string
}

// Legacy types for backward compatibility
export interface Fund {
  id: string
  name: string
  vintage: number
  commitmentAmount: number
  fundType: string
  managementFeeRate?: number
  carriedInterestRate?: number
  taxRate?: number
  createdAt: string
  updatedAt: string
  userId: string
}

export interface Cashflow {
  id: string
  fundId: string
  year: number
  quarter: number
  calls: number
  distributions: number
  nav: number
  managementFees?: number
  carriedInterest?: number
  taxes?: number
  createdAt: string
  updatedAt: string
  userId: string
}

export interface ClientFundPosition {
  id: string
  clientId: string
  fundId: string
  positionType: 'current' | 'target'
  commitmentAmount: number
  currentNav: number
  createdAt: string
  updatedAt: string
  userId: string
}

// Analysis types
export interface CashflowAnalysis {
  totalCalls: number
  totalDistributions: number
  netCashflow: number
  currentNav: number
  multiple: number
  irr?: number
}

export interface FundTypeExpectation {
  fundType: string
  avgLifespan: number
  callPattern: number[]
  distributionPattern: number[]
  navPattern: number[]
  avgMultiple: number
  avgIRR: number
  managementFeePattern?: number[]
  carriedInterestPattern?: number[]
}

export interface CashflowExpectation {
  year: number
  quarter: number
  calls: number
  distributions: number
  nav: number
  managementFees?: number
  carriedInterest?: number
  taxes?: number
  isProjected: boolean
}

export interface PortfolioScenario {
  id: string
  name: string
  type: 'conservative' | 'neutral' | 'positive'
  multiplier: number
  description: string
}

// Waterfall chart data structure
export interface WaterfallChartData {
  year: number
  contributions: number // Always negative or zero
  distributions: number // Always positive or zero
  netCashflow: number // contributions + distributions
  cumulativeNet: number // Running total
}

// Portfolio analysis result
export interface PortfolioAnalysis {
  portfolio: Portfolio
  positions: PortfolioPosition[]
  waterfallData: WaterfallChartData[]
  totalCommitment: number
  peakOutflow: { year: number; amount: number }
  peakInflow: { year: number; amount: number }
  breakEvenYear?: number
  finalCumulative: number
}

// Excel upload types
export interface ExcelTemplate {
  fundName: string
  vintage: number
  commitmentAmount: number
  fundType: string
  managementFeeRate?: number
  carriedInterestRate?: number
  taxRate?: number
  cashflows: {
    year: number
    quarter: number
    calls: number
    distributions: number
    nav: number
    managementFees?: number
    carriedInterest?: number
    taxes?: number
  }[]
}

export interface FundCashflowTemplate {
  id: string
  fundId: string
  year: number
  netCashflowPercentage: number
  createdAt: string
  updatedAt: string
  userId: string
}

export interface FundRule {
  id: string
  fundId: string
  ruleType: 'management_fee' | 'carried_interest' | 'tax' | 'other'
  ruleName: string
  ruleValue: number
  ruleDescription?: string
  createdAt: string
  updatedAt: string
  userId: string
}

export interface ExcelCashflowUpload {
  fundName: string
  vintage: number
  commitmentAmount: number
  fundType: string
  yearlyNetCashflows: number[]
}

// General fund upload for database
export interface GeneralFundUpload {
  fundName: string
  vintage: number
  fundType: string
  strategy: string
  geography: string
  expectedLifespan: number
  managementFeeRate?: number
  carriedInterestRate?: number
  yearlyNetCashflows: {
    year: number
    netCashflowPercentage: number
    contributionsPercentage: number
    distributionsPercentage: number
    navPercentage: number
  }[]
}