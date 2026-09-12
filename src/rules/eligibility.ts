import { BorrowerInput, EligibilityResult, LoanType } from '../types/borrower'
import { maxPrincipalFor } from './amortize'
import {
  BOUNCE_PENALTY_MAX,
  BOUNCE_PENALTY_PER_EVENT,
  DEFAULT_TENURE_MONTHS,
  HAIRCUT_INFORMAL_DEFAULT,
  HAIRCUT_SELF_EMPLOYED_DEFAULT,
  HAIRCUT_SHORT_TENURE_JOB,
  HIGH_CARD_UTIL_PENALTY,
  HIGH_CARD_UTIL_THRESHOLD,
  MIN_SAFE_FOIR_FLOOR,
  SHORT_TENURE_YEARS_THRESHOLD,
  foirCapLender,
  foirCapSafeBase,
} from './thresholds'
import { RATE_BANDS } from './thresholds'

/** Income used for the LENDER-LIKELY calc: stated income, no haircut — a
 * lender's automated engine mostly trusts what is declared / on the ITR. */
function lenderFacingIncome(b: BorrowerInput): number {
  return b.netMonthlyIncome + (b.coApplicantIncome ?? 0)
}

/** Income used for the SAFE-CARRY calc: haircut applied where income
 * quality is uncertain. This haircut is the app's core point of view and
 * is documented in RULES.md — it is the main reason the two numbers differ. */
function safeFacingIncome(b: BorrowerInput): { income: number; why: string[] } {
  const why: string[] = []
  let income = b.netMonthlyIncome

  if (b.incomeType === 'self-employed') {
    const haircut = b.variableIncomeShare !== undefined
      ? b.variableIncomeShare * HAIRCUT_SELF_EMPLOYED_DEFAULT * 1.4 // known variable share -> proportional haircut
      : HAIRCUT_SELF_EMPLOYED_DEFAULT
    income *= 1 - haircut
    why.push(
      b.variableIncomeShare !== undefined
        ? `income discounted ${Math.round(haircut * 100)}% for the share you told us is variable`
        : `income discounted ${Math.round(HAIRCUT_SELF_EMPLOYED_DEFAULT * 100)}% by default because self-employed income wasn't broken into fixed vs. variable`
    )
  } else if (b.incomeType === 'informal') {
    income *= 1 - HAIRCUT_INFORMAL_DEFAULT
    why.push(`income discounted ${Math.round(HAIRCUT_INFORMAL_DEFAULT * 100)}% because informal income is not verifiable by a lender or by us`)
  } else if (b.incomeType === 'salaried' && b.incomeStabilityYears !== undefined && b.incomeStabilityYears < SHORT_TENURE_YEARS_THRESHOLD) {
    income *= 1 - HAIRCUT_SHORT_TENURE_JOB
    why.push(`income discounted ${Math.round(HAIRCUT_SHORT_TENURE_JOB * 100)}% for less than ${SHORT_TENURE_YEARS_THRESHOLD} years in the current job`)
  }

  if (b.coApplicantIncome) {
    income += b.coApplicantIncome * 0.8 // co-applicant income counted at a discount too
    why.push(`co-applicant income counted at 80%`)
  }

  return { income, why }
}

/** The safe FOIR cap, tightened further by stress signals. Floors at MIN_SAFE_FOIR_FLOOR. */
function safeFoirCap(b: BorrowerInput): { cap: number; why: string[] } {
  let cap = foirCapSafeBase(b.incomeType, b.netMonthlyIncome)
  const why: string[] = []

  if (b.pastBounces && b.pastBounces > 0) {
    const penalty = Math.min(b.pastBounces * BOUNCE_PENALTY_PER_EVENT, BOUNCE_PENALTY_MAX)
    cap -= penalty
    why.push(`ceiling tightened for ${b.pastBounces} missed payment(s) in the last 12 months`)
  }
  if (b.cardUtilisation !== undefined && b.cardUtilisation >= HIGH_CARD_UTIL_THRESHOLD) {
    cap -= HIGH_CARD_UTIL_PENALTY
    why.push(`ceiling tightened for running credit cards near their limit`)
  }
  cap = Math.max(cap, MIN_SAFE_FOIR_FLOOR)
  return { cap, why }
}

export function computeEligibility(b: BorrowerInput, effectiveRate: { low: number; high: number }, loanType: LoanType): EligibilityResult {
  const tenure = DEFAULT_TENURE_MONTHS[loanType]

  // Lender-likely: generous FOIR cap, stated income, mid-band rate, default tenure.
  const lenderCap = foirCapLender(b.incomeType, b.netMonthlyIncome)
  const lenderIncome = lenderFacingIncome(b)
  const lenderAvailableEmi = Math.max(0, lenderIncome * lenderCap - b.existingEMIs)
  const lenderMidRate = (RATE_BANDS[loanType].low + RATE_BANDS[loanType].high) / 2
  const lenderLikely = maxPrincipalFor(lenderAvailableEmi, lenderMidRate, tenure)

  // Safe-carry: tightened FOIR cap, haircut income, high-end rate (conservative),
  // existing EMIs and any known upcoming large expense subtracted first.
  const { cap: safeCap, why: safeCapWhy } = safeFoirCap(b)
  const { income: safeIncome, why: incomeWhy } = safeFacingIncome(b)
  const upcomingMonthly = b.upcomingLargeExpense ? b.upcomingLargeExpense / 12 : 0
  const foirAvailableEmi = Math.max(0, safeIncome * safeCap - b.existingEMIs - upcomingMonthly)

  // Disposable-income floor: even where FOIR leaves room, a new EMI should
  // still leave at least 10% of net income unaccounted for after existing
  // EMIs, declared household expenses, and the new EMI itself. This is
  // what actually puts `householdExpenses` to work rather than collecting
  // it decoratively — a borrower with high FOIR headroom but very high
  // living costs shouldn't get a ceiling that ignores that.
  const disposableFloorFraction = 0.10
  const emiFromDisposableFloor = Math.max(
    0,
    b.netMonthlyIncome * (1 - disposableFloorFraction) - b.existingEMIs - b.householdExpenses
  )
  const safeAvailableEmi = Math.min(foirAvailableEmi, emiFromDisposableFloor)
  if (emiFromDisposableFloor < foirAvailableEmi) {
    safeCapWhy.push('ceiling additionally capped so at least 10% of income is left over after this EMI and your declared household expenses')
  }
  const safeCarry = maxPrincipalFor(safeAvailableEmi, effectiveRate.high, tenure)

  const useThis: 'lenderLikely' | 'safeCarry' = 'safeCarry'

  const whyParts = [
    `lender-likely uses ${Math.round(lenderCap * 100)}% of stated income (₹${Math.round(lenderIncome).toLocaleString('en-IN')}) as the max FOIR, a standard affordability check`,
    `safe-carry uses a tighter ${Math.round(safeCap * 100)}% ceiling on ${incomeWhy.length ? 'adjusted' : 'stated'} income (₹${Math.round(safeIncome).toLocaleString('en-IN')})${incomeWhy.length ? ': ' + incomeWhy.join('; ') : ''}`,
    ...safeCapWhy,
    'use the safe-carry number when deciding how much to actually take — the lender-likely number tells you what you could be offered, not what you should accept',
  ]

  return {
    lenderLikely: Math.max(0, lenderLikely),
    safeCarry: Math.max(0, safeCarry),
    useThis,
    why: whyParts.join('. '),
  }
}
