// ── Pure amortisation math. No thresholds, no domain judgement — just the
// standard reducing-balance annuity formulas. ──

/** Monthly EMI for a given principal, nominal annual rate (%), and tenure in months. */
export function emiFor(principal: number, annualRatePct: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0
  const r = annualRatePct / 12 / 100
  if (r === 0) return principal / tenureMonths
  const factor = Math.pow(1 + r, tenureMonths)
  return (principal * r * factor) / (factor - 1)
}

/** Maximum principal serviceable by a given monthly EMI budget (reverse of emiFor). */
export function maxPrincipalFor(emiBudget: number, annualRatePct: number, tenureMonths: number): number {
  if (emiBudget <= 0 || tenureMonths <= 0) return 0
  const r = annualRatePct / 12 / 100
  if (r === 0) return emiBudget * tenureMonths
  const factor = Math.pow(1 + r, tenureMonths)
  return (emiBudget * (factor - 1)) / (r * factor)
}

/**
 * Approximate all-in APR given a nominal annual rate, a one-time processing
 * fee (% of principal), and tenure. Method: treat the fee as reducing the
 * amount actually disbursed while the borrower still repays EMIs computed
 * on the full principal, then solve for the flat annualised cost of that
 * gap and add it to the nominal rate. This is a standard approximation
 * (not a full IRR solve) — documented as a simplification in RULES.md.
 */
export function approximateAPR(annualRatePct: number, processingFeePct: number, tenureMonths: number): number {
  const tenureYears = tenureMonths / 12
  if (tenureYears <= 0) return annualRatePct
  const feeSpread = (processingFeePct * 100) / tenureYears
  return annualRatePct + feeSpread
}

export function round100(n: number): number {
  return Math.round(n / 100) * 100
}

export function round1000(n: number): number {
  return Math.round(n / 1000) * 1000
}
