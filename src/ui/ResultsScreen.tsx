import { useState } from 'react'
import { AssessmentResult, BorrowerInput } from '../types/borrower'
import { inrCompact, pct } from './format'
import { LOAN_TYPE_OPTIONS } from './options'
import NegotiationCard from './NegotiationCard'

const VERDICT_STYLE: Record<string, { bg: string; label: string }> = {
  borrow: { bg: 'bg-safelight text-safe border-safe', label: 'Borrow' },
  'borrow-less': { bg: 'bg-warnlight text-warn border-warn', label: 'Borrow less than you asked' },
  'dont-borrow': { bg: 'bg-oxide/10 text-oxide border-oxide', label: "Don't borrow — not now" },
}

export default function ResultsScreen({
  answers,
  result,
  onRestart,
  onAnswerMore,
}: {
  answers: BorrowerInput
  result: AssessmentResult
  onRestart: () => void
  onAnswerMore: () => void
}) {
  const [showCard, setShowCard] = useState(false)
  const v = VERDICT_STYLE[result.verdict.decision]
  const productLabel = LOAN_TYPE_OPTIONS.find((o) => o.value === result.rate.suggestedProduct)?.label

  return (
    <div className="space-y-10 pb-10">
      <div className="space-y-1">
        <p className="text-xs tracking-wide text-oxide font-semibold">Your assessment</p>
        <p className="text-sm text-inkmute">
          Confidence: <span className="font-medium text-ink capitalize">{result.confidence.level}</span> ·{' '}
          {result.confidence.answeredCount}/{result.confidence.applicableCount} additional questions answered
        </p>
        <p className="text-sm text-inkmute">{result.confidence.note}</p>
      </div>

      {/* O1 — Verdict */}
      <section className={`border-l-4 px-5 py-4 ${v.bg}`}>
        <p className="text-xs uppercase tracking-wide opacity-80">Verdict</p>
        <p className="font-serif text-2xl mt-1">{v.label}</p>
        <p className="text-sm mt-2 opacity-90 leading-relaxed">{result.verdict.reason}</p>
      </section>

      {/* O2 — Eligibility */}
      <section className="space-y-3">
        <h3 className="font-serif text-xl text-ink">How much</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-line p-4">
            <p className="text-xs text-inkmute uppercase tracking-wide">Safe to carry</p>
            <p className="font-serif text-3xl text-ink tabular">{inrCompact(result.eligibility.safeCarry)}</p>
            <p className="text-xs text-safe mt-1 font-medium">Use this number</p>
          </div>
          <div className="border border-line p-4">
            <p className="text-xs text-inkmute uppercase tracking-wide">Lender may sanction</p>
            <p className="font-serif text-3xl text-inkmute tabular">{inrCompact(result.eligibility.lenderLikely)}</p>
            <p className="text-xs text-inkmute mt-1">Not what to take</p>
          </div>
        </div>
        <p className="text-sm text-inkmute leading-relaxed">{result.eligibility.why}</p>
      </section>

      {/* O3 — Rate */}
      <section className="space-y-3">
        <h3 className="font-serif text-xl text-ink">Fair rate</h3>
        <div className="border border-line p-4">
          <p className="text-xs text-inkmute uppercase tracking-wide">
            {productLabel} {result.rate.suggestedProduct !== answers.loanType && <span className="text-oxide">(recommended instead of what you asked)</span>}
          </p>
          <p className="font-serif text-3xl text-ink tabular">
            {pct(result.rate.low)} – {pct(result.rate.high)}
          </p>
          <p className="text-sm text-inkmute mt-1">
            All-in APR incl. fees: <span className="tabular">{pct(result.rate.aprLow)} – {pct(result.rate.aprHigh)}</span>
          </p>
        </div>
        {result.rate.suggestedProduct !== answers.loanType && (
          <p className="text-sm text-oxide leading-relaxed">{result.rate.productWhy}</p>
        )}
        <p className="text-sm text-inkmute leading-relaxed">{result.rate.why}</p>
      </section>

      {/* O4 — EMI */}
      <section className="space-y-3">
        <h3 className="font-serif text-xl text-ink">EMI to agree to</h3>
        <div className="border border-line p-4">
          <p className="text-xs text-inkmute uppercase tracking-wide">Monthly ceiling</p>
          <p className="font-serif text-3xl text-ink tabular">{inrCompact(result.emi.ceiling)}<span className="text-base text-inkmute">/month</span></p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {result.emi.tenureOptions.map((t) => (
            <div key={t.months} className="border border-line p-3 text-center">
              <p className="text-xs text-inkmute">{Math.round(t.months / 12)}y {t.months % 12 ? `${t.months % 12}m` : ''}</p>
              <p className="font-mono text-sm text-ink tabular">{inrCompact(t.emi)}</p>
            </div>
          ))}
        </div>
        <div className={`border-l-4 px-4 py-3 text-sm leading-relaxed ${result.emi.stressCase.stillSafe ? 'border-safe bg-safelight text-safe' : 'border-warn bg-warnlight text-warn'}`}>
          Stress case — {result.emi.stressCase.scenario}: EMI could reach{' '}
          <span className="tabular font-medium">{inrCompact(result.emi.stressCase.newEmi)}</span>.{' '}
          {result.emi.stressCase.stillSafe ? 'Still within a safe range.' : 'This would likely stretch you — plan a buffer before agreeing.'}
        </div>
        <p className="text-sm text-inkmute leading-relaxed">{result.emi.why}</p>
      </section>

      {result.flags.length > 0 && (
        <section className="space-y-2 border-t border-line pt-5">
          <h3 className="font-serif text-lg text-ink">Worth knowing</h3>
          <ul className="text-sm text-ink space-y-1.5 list-disc pl-4">
            {result.flags.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-3 pt-4 border-t border-line">
        <button onClick={() => setShowCard((s) => !s)} className="bg-ink text-paper px-6 py-3 font-medium hover:bg-oxidedark transition-colors">
          {showCard ? 'Hide' : 'Show'} Negotiation Card
        </button>
        {result.confidence.level !== 'high' && (
          <button onClick={onAnswerMore} className="border border-ink px-6 py-3 font-medium hover:bg-paper2 transition-colors">
            Tighten these numbers
          </button>
        )}
        <button onClick={onRestart} className="text-sm text-inkmute underline underline-offset-2 hover:text-ink self-center">
          Start over
        </button>
      </div>

      {showCard && (
        <div className="pt-2">
          <NegotiationCard answers={answers} result={result} />
          <button onClick={() => window.print()} className="mt-3 text-sm text-indigo underline underline-offset-2 hover:text-ink">
            Print / save as PDF
          </button>
        </div>
      )}
    </div>
  )
}
