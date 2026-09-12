import { AssessmentResult, BorrowerInput } from '../types/borrower'
import { computeEligibility } from './eligibility'
import { computeRate } from './rate'
import { computeEmi } from './emi'
import { computeVerdict, computeFlags } from './verdict'
import { levelFromRatio, widenFactor, widenBand } from './confidence'
import { applicableAdditionalQuestions } from '../questions/schema'

export function runAssessment(b: BorrowerInput): AssessmentResult {
  // 1. Confidence — how much of the applicable additional question set did
  // this borrower actually answer? Drives band widening below.
  const applicable = applicableAdditionalQuestions(b)
  const answered = applicable.filter((q) => q.isAnswered(b))
  const ratio = applicable.length === 0 ? 1 : answered.length / applicable.length
  const level = levelFromRatio(ratio)
  const factor = widenFactor(level)

  // 2. Rate band + product routing (O3) — computed first because
  // eligibility and EMI both depend on the priced rate.
  const rateRaw = computeRate(b)
  const widenedRate = widenBand(rateRaw.low, rateRaw.high, factor)
  const rate = {
    ...rateRaw,
    low: Math.round(widenedRate.low * 10) / 10,
    high: Math.round(widenedRate.high * 10) / 10,
  }

  // 3. Eligibility (O2) — lender-likely vs safe-carry.
  const eligibilityRaw = computeEligibility(b, { low: rate.low, high: rate.high }, rate.suggestedProduct)
  const widenedEligibility = widenBand(eligibilityRaw.safeCarry * (1 - factor), eligibilityRaw.safeCarry * (1 + factor), 0)
  const eligibility = {
    ...eligibilityRaw,
    // widen safe-carry downward more than upward is unsafe — instead we
    // keep the point estimate but note the uncertainty explicitly in copy.
    safeCarry: Math.round(eligibilityRaw.safeCarry),
    lenderLikely: Math.round(eligibilityRaw.lenderLikely),
  }
  void widenedEligibility

  // 4. Verdict (O1) — depends on eligibility.
  const verdict = computeVerdict(b, eligibility)

  // 5. EMI ceiling + stress case (O4) — depends on eligibility + rate.
  const emi = computeEmi(b, eligibility, rate, rate.suggestedProduct)

  // 6. Flags for the Negotiation Card.
  const flags = computeFlags(b)

  const confidenceNote =
    level === 'low'
      ? `Based on the essentials only — answer more of the additional questions to narrow these ranges.`
      : level === 'medium'
      ? `Based on a reasonable amount of detail — a few more answers would tighten this further.`
      : `Based on a thorough answer set — these ranges are as tight as this app gets.`

  return {
    verdict,
    eligibility,
    rate,
    emi,
    confidence: {
      level,
      answeredCount: answered.length,
      applicableCount: applicable.length,
      note: confidenceNote,
    },
    flags,
  }
}
