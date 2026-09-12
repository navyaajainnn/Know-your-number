import { BorrowerInput } from '../types/borrower'
import { ADDITIONAL_QUESTIONS, MUST_QUESTIONS, QuestionDef, applicableAdditionalQuestions, applicableMustQuestions } from './schema'

export type Phase = 'must' | 'additional' | 'done'

/**
 * Returns the ordered, currently-applicable queue for a phase. Recomputed
 * on every answer, because applicability of later questions (e.g.
 * "variable income share") depends on earlier answers (e.g. income type).
 * This is what makes the flow adaptive rather than a static 20-question form.
 */
export function queueFor(phase: 'must' | 'additional', b: Partial<BorrowerInput>): QuestionDef[] {
  return phase === 'must' ? applicableMustQuestions(b) : applicableAdditionalQuestions(b)
}

/**
 * `skipIds` lets the UI mark a question as "seen and dismissed" (the
 * borrower tapped "I don't know / not applicable") without inventing a
 * fake answer for it — the field stays genuinely unanswered for the
 * rules engine, it's just not asked again this session.
 */
export function nextQuestion(
  b: Partial<BorrowerInput>,
  phase: Phase,
  skipIds: Set<string> = new Set()
): { phase: Phase; question: QuestionDef | null } {
  const isSettled = (q: QuestionDef) => q.isAnswered(b) || skipIds.has(q.id)

  if (phase === 'must' || phase === 'done') {
    const mustQueue = queueFor('must', b)
    const nextMust = mustQueue.find((q) => !isSettled(q))
    if (nextMust) return { phase: 'must', question: nextMust }
  }
  const addQueue = queueFor('additional', b)
  const nextAdd = addQueue.find((q) => !isSettled(q))
  if (nextAdd) return { phase: 'additional', question: nextAdd }
  return { phase: 'done', question: null }
}

export function progress(b: Partial<BorrowerInput>): { done: number; total: number } {
  const must = MUST_QUESTIONS.filter((q) => q.appliesIf(b))
  const add = ADDITIONAL_QUESTIONS.filter((q) => q.appliesIf(b))
  const all = [...must, ...add]
  return { done: all.filter((q) => q.isAnswered(b)).length, total: all.length }
}
