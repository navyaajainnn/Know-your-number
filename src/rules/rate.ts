import { BorrowerInput, LoanType, RateResult } from '../types/borrower'
import { approximateAPR } from './amortize'
import {
  COLLATERAL_ROUTE_MULTIPLE,
  CREDIT_SCORE_BANDS,
  CREDIT_TIER_POSITION,
  DEFAULT_PROCESSING_FEE_PCT,
  DEFAULT_TENURE_MONTHS,
  RATE_BANDS,
} from './thresholds'

type CreditTier = keyof typeof CREDIT_TIER_POSITION

function creditTier(score: BorrowerInput['creditScore']): CreditTier {
  if (score === 'unknown') return 'unknown'
  if (score >= CREDIT_SCORE_BANDS.excellent) return 'excellent'
  if (score >= CREDIT_SCORE_BANDS.good) return 'good'
  if (score >= CREDIT_SCORE_BANDS.fair) return 'fair'
  return 'weak'
}

/**
 * Decides which product to actually price. If the borrower holds
 * unencumbered collateral worth enough relative to the amount wanted, and
 * the requested product is unsecured, we route to a secured product
 * instead — this is what a well-informed borrower would do, even if they
 * asked for a personal/business loan by name.
 */
export function routeProduct(b: BorrowerInput): { product: LoanType; why: string } {
  const requestedIsUnsecured = b.loanType === 'personal' || b.loanType === 'business'
  if (requestedIsUnsecured && b.collateralValue && b.collateralValue >= b.amountWanted * COLLATERAL_ROUTE_MULTIPLE) {
    return {
      product: 'lap',
      why: `you hold unencumbered property worth more than ${COLLATERAL_ROUTE_MULTIPLE}× what you're asking for — a loan against property will price far cheaper than an unsecured ${b.loanType} loan for the same amount`,
    }
  }
  return { product: b.loanType, why: `priced as a standard ${b.loanType} loan based on what you asked for` }
}

export function computeRate(b: BorrowerInput): RateResult {
  const { product, why: productWhy } = routeProduct(b)
  const band = RATE_BANDS[product]
  const tier = creditTier(b.creditScore)
  const position = CREDIT_TIER_POSITION[tier]

  // Place a point estimate within the band by credit tier, then keep a
  // band around it — narrower for a known strong/weak score, wider when
  // the score is unknown (never narrow a range you have no basis for).
  const centre = band.low + (band.high - band.low) * position
  const spread = tier === 'unknown' ? (band.high - band.low) * 0.3 : (band.high - band.low) * 0.18
  const low = Math.max(band.low, Math.round((centre - spread) * 10) / 10)
  const high = Math.min(band.high, Math.round((centre + spread) * 10) / 10)

  const processingFeePct = b.offersReceived?.[0]?.processingFeePct ?? DEFAULT_PROCESSING_FEE_PCT
  const tenure = DEFAULT_TENURE_MONTHS[product]
  const aprLow = Math.round(approximateAPR(low, processingFeePct, tenure) * 10) / 10
  const aprHigh = Math.round(approximateAPR(high, processingFeePct, tenure) * 10) / 10

  const creditWhy =
    tier === 'unknown'
      ? "your credit score is unknown, so we priced near the top of the band rather than the middle — an unscored borrower is not a median borrower to a lender"
      : `priced for a ${tier} credit profile (score ${b.creditScore})`

  return {
    low,
    high,
    aprLow,
    aprHigh,
    suggestedProduct: product,
    productWhy,
    why: `${creditWhy}. All-in APR adds an assumed ${Math.round(processingFeePct * 100 * 10) / 10}% one-time processing fee spread over a ${Math.round(tenure / 12)}-year tenure — always ask the lender for their actual fee and compare against this APR range, not the headline rate.`,
  }
}
