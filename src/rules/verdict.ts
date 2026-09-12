import { BorrowerInput, EligibilityResult, Verdict } from '../types/borrower'
import { DONT_BORROW_USABILITY_FLOOR, OVEREXTENDED_EXISTING_FOIR, foirCapSafeBase } from './thresholds'

export function computeVerdict(
  b: BorrowerInput,
  eligibility: EligibilityResult
): { decision: Verdict; reason: string } {
  const safeCap = foirCapSafeBase(b.incomeType, b.netMonthlyIncome)
  const existingFoirShare = b.existingEMIs / Math.max(1, b.netMonthlyIncome * safeCap)
  const alreadyOverextended = existingFoirShare >= OVEREXTENDED_EXISTING_FOIR
  const hasDistressSignal = (b.pastBounces ?? 0) > 0

  // Already overextended + a recent bounce: the honest answer is often
  // "don't take new debt," even if the app could technically show a
  // (tiny) safe-carry number.
  if (alreadyOverextended && hasDistressSignal) {
    return {
      decision: 'dont-borrow',
      reason: `your existing EMIs already use up most of what you can safely commit, and you've had a missed payment in the last year — new debt on top of this is likely to make things worse, not better. Look at consolidating or renegotiating what you already owe first.`,
    }
  }

  // High-cost existing debt (informal lenders, app loans) plus a recent
  // bounce is a debt-spiral signal on its own, independent of whether the
  // FOIR math technically leaves room — a well-informed borrower fixes the
  // expensive debt before adding more, even affordable-looking new debt.
  const carryingExpensiveDebt = (b.existingLoanDetail?.worstRateKnown ?? 0) > 30
  if (carryingExpensiveDebt && hasDistressSignal) {
    return {
      decision: 'dont-borrow',
      reason: `you're already carrying debt priced above 30% and have missed a payment in the last year — the right next step is paying down that expensive debt, not taking on a new loan, even one that looks technically affordable.`,
    }
  }

  const usability = eligibility.safeCarry / Math.max(1, b.amountWanted)

  if (usability < DONT_BORROW_USABILITY_FLOOR) {
    return {
      decision: 'dont-borrow',
      reason: `what you can safely carry (₹${Math.round(eligibility.safeCarry).toLocaleString('en-IN')}) is far below what you're asking for (₹${Math.round(b.amountWanted).toLocaleString('en-IN')}) — taking this loan at the size you want would very likely stretch you past what your income can absorb.`,
    }
  }

  if (b.amountWanted > eligibility.safeCarry) {
    return {
      decision: 'borrow-less',
      reason: `a lender may sanction close to what you asked for, but the amount you can safely carry is lower — borrowing at ₹${Math.round(eligibility.safeCarry).toLocaleString('en-IN')} instead keeps your monthly outflow at a level your income can actually absorb.`,
    }
  }

  return {
    decision: 'borrow',
    reason: `what you're asking for is within what your income can safely carry, at the rate and tenure shown below.`,
  }
}

export function computeFlags(b: BorrowerInput): string[] {
  const flags: string[] = []
  if (b.creditScore === 'unknown') flags.push('Credit score unknown — priced as higher risk until you check it (free, via CIBIL/Experian).')
  if ((b.pastBounces ?? 0) > 0) flags.push(`${b.pastBounces} missed payment(s) in the last year — expect lenders to price this in or decline.`)
  if (b.incomeType === 'informal') flags.push('Informal income is hard to prove to a mainstream lender — expect to be pushed toward high-cost app loans unless you can show some paper trail (bank statements, UPI history).')
  if (b.cardUtilisation !== undefined && b.cardUtilisation >= 0.7) flags.push('Credit cards running near their limit — pay these down before applying; it materially affects both approval and rate.')
  if (b.emergencySavingsMonths !== undefined && b.emergencySavingsMonths < 1) flags.push('Little to no emergency buffer — a single missed income month could trigger a bounce on this new EMI.')
  if (b.existingLoanDetail && b.existingLoanDetail.worstRateKnown && b.existingLoanDetail.worstRateKnown > 30) flags.push('You are already carrying debt priced above 30% — prioritise paying that down before taking on anything new.')
  return flags
}
