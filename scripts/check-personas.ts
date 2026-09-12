import { runAssessment } from '../src/rules/engine'
import { BorrowerInput } from '../src/types/borrower'

const priya: BorrowerInput = {
  purpose: 'wedding',
  amountWanted: 800000,
  loanType: 'personal',
  incomeType: 'salaried',
  netMonthlyIncome: 110000,
  existingEMIs: 14000,
  householdExpenses: 45000,
  age: 29,
  creditScore: 780,
  dependents: 0,
  incomeStabilityYears: 5,
  cardUtilisation: 0.2,
  pastBounces: 0,
  emergencySavingsMonths: 4,
  coApplicantIncome: undefined,
  upcomingLargeExpense: 0,
}

const ravi: BorrowerInput = {
  purpose: 'business-expansion',
  amountWanted: 1500000,
  loanType: 'business',
  incomeType: 'self-employed',
  netMonthlyIncome: 55000, // self-reported "typical month" cash income (persona range ₹40-80k); ITR shows lower (₹35k/mo equiv) — see RULES.md §7 on this gap
  existingEMIs: 0,
  householdExpenses: 22000,
  age: 42,
  creditScore: 'unknown',
  dependents: 2,
  variableIncomeShare: 0.5,
  cardUtilisation: undefined,
  pastBounces: 0,
  emergencySavingsMonths: 3,
  collateralValue: 4500000,
  coApplicantIncome: 18000,
  upcomingLargeExpense: 0,
  loanIsProductive: true,
  expectedMonthlyReturn: 15000,
}

const anita: BorrowerInput = {
  purpose: 'vehicle',
  amountWanted: 150000,
  loanType: 'two-wheeler',
  incomeType: 'informal',
  netMonthlyIncome: 28000,
  existingEMIs: 0, // app loans aren't formal EMIs but let's model via existingLoanDetail
  householdExpenses: 22000,
  age: 35,
  creditScore: 'unknown',
  dependents: 2,
  pastBounces: 1,
  emergencySavingsMonths: 0,
  existingLoanDetail: { count: 3, totalOutstanding: 35000, worstRateKnown: 32 },
  cardUtilisation: undefined,
  loanIsProductive: true,
  expectedMonthlyReturn: 4000,
}

for (const [name, b] of [
  ['Priya', priya],
  ['Ravi', ravi],
  ['Anita', anita],
] as const) {
  console.log('\n=====', name, '=====')
  const r = runAssessment(b)
  console.log('Verdict:', r.verdict.decision, '-', r.verdict.reason)
  console.log('Eligibility: safeCarry=', r.eligibility.safeCarry, 'lenderLikely=', r.eligibility.lenderLikely)
  console.log('Rate:', r.rate.low, '-', r.rate.high, '| APR', r.rate.aprLow, '-', r.rate.aprHigh, '| product', r.rate.suggestedProduct)
  console.log('EMI ceiling:', r.emi.ceiling, 'stress:', r.emi.stressCase)
  console.log('Confidence:', r.confidence)
  console.log('Flags:', r.flags)
}
