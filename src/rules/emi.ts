import { BorrowerInput, EligibilityResult, EmiResult, LoanType, RateResult } from '../types/borrower'
import { emiFor } from './amortize'
import { DEFAULT_TENURE_MONTHS, MAX_TENURE_MONTHS, STRESS_RATE_RISE_PP } from './thresholds'

export function computeEmi(
  b: BorrowerInput,
  eligibility: EligibilityResult,
  rate: RateResult,
  loanType: LoanType
): EmiResult {
  const amount = Math.min(b.amountWanted, eligibility.safeCarry || b.amountWanted)
  const defaultTenure = DEFAULT_TENURE_MONTHS[loanType]
  const maxTenure = MAX_TENURE_MONTHS[loanType]
  const midRate = (rate.low + rate.high) / 2

  const ceilingEmi = emiFor(amount, midRate, defaultTenure)

  const tenureOptions = Array.from(new Set([
    Math.max(12, Math.round(defaultTenure * 0.5)),
    defaultTenure,
    maxTenure,
  ])).map((months) => ({ months, emi: Math.round(emiFor(amount, midRate, months)) }))

  const stressRate = midRate + STRESS_RATE_RISE_PP
  const stressEmi = Math.round(emiFor(amount, stressRate, defaultTenure))
  const incomeForStress = b.netMonthlyIncome * 0.9 // model a 10% income drop alongside the rate rise
  const stillSafe = stressEmi + b.existingEMIs <= incomeForStress * 0.5 // generic affordability sense-check at stress

  return {
    ceiling: Math.round(ceilingEmi),
    tenureOptions,
    stressCase: {
      scenario: `if your income drops 10% or the rate rises ${STRESS_RATE_RISE_PP} points, whichever you'd rather plan for`,
      newEmi: stressEmi,
      stillSafe,
    },
    why: `EMI shown for ₹${Math.round(amount).toLocaleString('en-IN')} over ${Math.round(defaultTenure / 12)} years at the mid-point of your rate band (${midRate.toFixed(1)}%) — this is the amount we think you can safely carry, not necessarily the full amount you asked for. Stretch the tenure and the EMI drops but total interest paid rises; shorten it and the reverse.`,
  }
}
