// ── Core domain types ────────────────────────────────────────────────────
// This file is the contract between the question flow, the rules engine,
// and the UI. Nothing in /rules or /questions should need to know about
// React; nothing in /ui should contain lending logic. If you find yourself
// writing a threshold number inside a .tsx file, it belongs in /rules instead.

export type LoanPurpose =
  | 'wedding'
  | 'medical'
  | 'education'
  | 'home-purchase'
  | 'home-improvement'
  | 'vehicle'
  | 'business-working-capital'
  | 'business-expansion'
  | 'debt-consolidation'
  | 'other-consumption'

export type LoanType =
  | 'personal'
  | 'home'
  | 'lap' // loan against property
  | 'gold'
  | 'two-wheeler'
  | 'business'

export type IncomeType = 'salaried' | 'self-employed' | 'informal'

export type CreditScore = number | 'unknown'

// Every optional field left `undefined` means "not asked / not answered".
// Never coerce an unanswered field to a pessimistic or optimistic default
// silently — the engine must be able to tell "unknown" from "zero".
export interface BorrowerInput {
  // ── Must-answer set ──
  purpose: LoanPurpose
  amountWanted: number
  loanType: LoanType
  incomeType: IncomeType
  netMonthlyIncome: number
  existingEMIs: number
  householdExpenses: number
  age: number
  creditScore: CreditScore
  dependents?: number

  // ── Additional set — each one must tighten a range somewhere ──
  incomeStabilityYears?: number // how long at current job / business
  variableIncomeShare?: number // 0–1, share of income that is not fixed/salaried
  existingLoanDetail?: {
    count: number
    totalOutstanding: number
    worstRateKnown?: number
  }
  cardUtilisation?: number // 0–1, average % of credit limit used
  pastBounces?: number // EMI/cheque bounces in last 12 months
  emergencySavingsMonths?: number // months of expenses held as liquid savings
  collateralValue?: number // value of unencumbered asset offerable as security
  coApplicantIncome?: number
  upcomingLargeExpense?: number // known near-term expense (school fee, medical, etc.)
  loanIsProductive?: boolean // will this loan generate income (business use)?
  expectedMonthlyReturn?: number // if productive, expected monthly income it creates
  offersReceived?: { lender: string; rate: number; processingFeePct: number }[]
}

export type Verdict = 'borrow' | 'dont-borrow' | 'borrow-less'

export interface EligibilityResult {
  lenderLikely: number
  safeCarry: number
  useThis: 'lenderLikely' | 'safeCarry'
  why: string
}

export interface RateResult {
  low: number
  high: number
  aprLow: number
  aprHigh: number
  suggestedProduct: LoanType
  productWhy: string
  why: string
}

export interface EmiResult {
  ceiling: number
  tenureOptions: { months: number; emi: number }[]
  stressCase: {
    scenario: string
    newEmi: number
    stillSafe: boolean
  }
  why: string
}

export type ConfidenceLevel = 'low' | 'medium' | 'high'

export interface AssessmentResult {
  verdict: { decision: Verdict; reason: string }
  eligibility: EligibilityResult
  rate: RateResult
  emi: EmiResult
  confidence: {
    level: ConfidenceLevel
    answeredCount: number
    applicableCount: number
    note: string
  }
  flags: string[] // short, plain-language risk flags shown on the Negotiation Card
}
