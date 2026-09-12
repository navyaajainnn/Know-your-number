// ── Every threshold, band, and assumption used by the engine lives here. ──
// Each constant is mirrored in RULES.md with: what · value · why · source.
// If you are asked in a follow-up to "change a rule live," it is almost
// certainly a number in this file.

import { IncomeType, LoanType } from '../types/borrower'

// FOIR (Fixed Obligation to Income Ratio) caps used for the LENDER-LIKELY
// number — this mirrors how a mainstream lender's automated affordability
// check behaves: generous, tiered by stated income, largely blind to
// income *quality*. Source: representative of public affordability
// guidance used by Indian NBFCs/banks for unsecured retail credit; treat
// as "my judgement, informed by publicly documented industry norms," not
// a cited regulation.
export const FOIR_LENDER_SALARIED = [
  { minIncome: 0, cap: 0.40 },
  { minIncome: 25_000, cap: 0.50 },
  { minIncome: 50_000, cap: 0.55 },
  { minIncome: 100_000, cap: 0.60 },
]
export const FOIR_LENDER_SELF_EMPLOYED = 0.45
export const FOIR_LENDER_INFORMAL = 0.35

// FOIR caps used for the SAFE-CARRY number — tighter than lender caps by
// design. This is the app's actual point of view: a lender will sanction
// more than a borrower should actually carry, especially where income is
// irregular. My judgement, not an industry figure.
export const FOIR_SAFE_SALARIED = [
  { minIncome: 0, cap: 0.32 },
  { minIncome: 25_000, cap: 0.38 },
  { minIncome: 50_000, cap: 0.42 },
  { minIncome: 100_000, cap: 0.45 },
]
export const FOIR_SAFE_SELF_EMPLOYED = 0.32
export const FOIR_SAFE_INFORMAL = 0.22

// Income haircuts applied ONLY to the safe-carry calculation, not the
// lender-likely one — a lender's engine mostly trusts stated/ITR income;
// the safe-carry number should not.
export const HAIRCUT_SELF_EMPLOYED_DEFAULT = 0.25 // used when variableIncomeShare is unknown
export const HAIRCUT_INFORMAL_DEFAULT = 0.30
export const HAIRCUT_SHORT_TENURE_JOB = 0.10 // incomeStabilityYears < 2, salaried
export const SHORT_TENURE_YEARS_THRESHOLD = 2

// Stress adjustments to the SAFE FOIR cap (percentage points subtracted,
// expressed as decimals of FOIR, e.g. 0.05 = 5 percentage points).
export const BOUNCE_PENALTY_PER_EVENT = 0.05
export const BOUNCE_PENALTY_MAX = 0.15 // never push the cap down by more than this
export const HIGH_CARD_UTIL_THRESHOLD = 0.70
export const HIGH_CARD_UTIL_PENALTY = 0.05
export const MIN_SAFE_FOIR_FLOOR = 0.10 // cap never driven below this — floor, not zero

// Amortisation assumptions: default tenure (months) per loan type, used to
// convert an affordable EMI into a maximum loan amount. Representative of
// commonly offered tenures in the Indian market; document as judgement.
export const DEFAULT_TENURE_MONTHS: Record<LoanType, number> = {
  personal: 48,
  home: 240,
  lap: 180,
  gold: 12,
  'two-wheeler': 36,
  business: 60,
}

export const MAX_TENURE_MONTHS: Record<LoanType, number> = {
  personal: 60,
  home: 300,
  lap: 180,
  gold: 12,
  'two-wheeler': 48,
  business: 84,
}

// Rate bands per loan type: [low, high] nominal annual %. Representative
// of publicly advertised Indian lender ranges as of the brief's issue date
// (Sep 2026) — treat as "my judgement, directionally sourced from public
// rate cards," not a live rate feed.
export const RATE_BANDS: Record<LoanType, { low: number; high: number }> = {
  personal: { low: 11, high: 24 },
  home: { low: 8.3, high: 11.5 },
  lap: { low: 9.5, high: 14 },
  gold: { low: 9, high: 15 },
  'two-wheeler': { low: 10, high: 18 },
  business: { low: 11, high: 20 },
}

// Where in the band a borrower lands, by credit tier. Expressed as a
// position 0 (low end) to 1 (high end) of the band above.
export const CREDIT_TIER_POSITION = {
  excellent: 0.10, // score >= 780
  good: 0.35, // 700–779
  fair: 0.65, // 650–699
  weak: 0.90, // < 650
  unknown: 0.85, // unscored — priced almost as if weak, never as if median
}

export const CREDIT_SCORE_BANDS = {
  excellent: 780,
  good: 700,
  fair: 650,
}

// Processing fee assumption used to compute all-in APR when the borrower
// has not supplied a lender quote. My judgement, mid-market.
export const DEFAULT_PROCESSING_FEE_PCT = 0.02 // 2% of principal, one-time

// Confidence banding: answeredCount / applicableCount of the ADDITIONAL
// question set. Thresholds are my judgement.
export const CONFIDENCE_LOW_MAX = 0.34
export const CONFIDENCE_MEDIUM_MAX = 0.67

// Range-widening multiplier applied to eligibility and rate bands based on
// confidence. E.g. 'low' widens the band by ±25%.
export const WIDEN_BY_CONFIDENCE: Record<'low' | 'medium' | 'high', number> = {
  low: 0.25,
  medium: 0.12,
  high: 0.05,
}

// Verdict thresholds.
export const BORROW_LESS_THRESHOLD = 0 // amountWanted > safeCarry by any margin -> borrow-less
export const DONT_BORROW_USABILITY_FLOOR = 0.20 // safeCarry < 20% of amountWanted -> usually don't-borrow territory
export const OVEREXTENDED_EXISTING_FOIR = 0.9 // existing EMIs alone already consume >=90% of the *safe* cap

// Secured-alternative routing: collateral value must be at least this
// multiple of the amount wanted before we suggest switching product.
export const COLLATERAL_ROUTE_MULTIPLE = 1.2

// Stress test applied to output O4 (EMI ceiling): a rate rise, expressed
// in percentage points, used to recompute the EMI on the *existing*
// sanctioned amount to show the borrower what happens if pricing moves.
export const STRESS_RATE_RISE_PP = 2

export function foirCapLender(incomeType: IncomeType, netMonthlyIncome: number): number {
  if (incomeType === 'self-employed') return FOIR_LENDER_SELF_EMPLOYED
  if (incomeType === 'informal') return FOIR_LENDER_INFORMAL
  const tier = [...FOIR_LENDER_SALARIED].reverse().find((t) => netMonthlyIncome >= t.minIncome)
  return tier ? tier.cap : FOIR_LENDER_SALARIED[0].cap
}

export function foirCapSafeBase(incomeType: IncomeType, netMonthlyIncome: number): number {
  if (incomeType === 'self-employed') return FOIR_SAFE_SELF_EMPLOYED
  if (incomeType === 'informal') return FOIR_SAFE_INFORMAL
  const tier = [...FOIR_SAFE_SALARIED].reverse().find((t) => netMonthlyIncome >= t.minIncome)
  return tier ? tier.cap : FOIR_SAFE_SALARIED[0].cap
}
