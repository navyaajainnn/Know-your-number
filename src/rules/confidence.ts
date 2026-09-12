import { ConfidenceLevel } from '../types/borrower'
import { CONFIDENCE_LOW_MAX, CONFIDENCE_MEDIUM_MAX, WIDEN_BY_CONFIDENCE } from './thresholds'

export function levelFromRatio(ratio: number): ConfidenceLevel {
  if (ratio <= CONFIDENCE_LOW_MAX) return 'low'
  if (ratio <= CONFIDENCE_MEDIUM_MAX) return 'medium'
  return 'high'
}

export function widenFactor(level: ConfidenceLevel): number {
  return WIDEN_BY_CONFIDENCE[level]
}

/** Widen a [low, high] band symmetrically around its midpoint by `factor`. Never narrows. */
export function widenBand(low: number, high: number, factor: number): { low: number; high: number } {
  const mid = (low + high) / 2
  const halfSpread = (high - low) / 2
  const widenedHalf = halfSpread * (1 + factor)
  return { low: Math.max(0, mid - widenedHalf), high: mid + widenedHalf }
}
