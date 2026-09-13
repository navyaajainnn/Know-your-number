import { useMemo, useState } from 'react'
import { BorrowerInput } from './types/borrower'
import { nextQuestion, progress } from './questions/flow'
import { QuestionDef } from './questions/schema'
import QuestionInput from './ui/QuestionInput'
import ResultsScreen from './ui/ResultsScreen'
import { runAssessment } from './rules/engine'
import ThemeToggle from './ui/themeToggle'

type Answers = Partial<BorrowerInput>
type Stage = 'intro' | 'must' | 'interstitial' | 'additional' | 'results'

export default function App() {
  const [stage, setStage] = useState<Stage>('intro')
  const [question, setQuestion] = useState<QuestionDef | null>(null)
  const [answers, setAnswers] = useState<Answers>({})
  const [skipped, setSkipped] = useState<Set<string>>(new Set())

  const prog = useMemo(() => progress(answers), [answers])

  function patch(p: Answers) {
    // Typing/selecting only ever updates the answer — it never moves the
    // question pointer. Advancing is a separate, deliberate action (the
    // Continue button, or Enter). This is the fix for the bug where typing
    // a single digit into an amount field used to immediately satisfy
    // isAnswered() and yank the user into the next question mid-keystroke.
    setAnswers((a) => ({ ...a, ...p }))
  }

  // Given the answers as they stand right now, decide what happens next.
  // Called only from explicit user actions (Continue / Skip / See numbers
  // now) — never from a render-time effect — so it can never fire while
  // someone is still typing.
  function goToNext(latestAnswers: Answers, latestSkipped: Set<string>) {
    const res = nextQuestion(latestAnswers, 'must', latestSkipped)
    if (res.phase === 'must') {
      setQuestion(res.question)
      setStage('must')
    } else if (res.phase === 'additional') {
      if (stage === 'must') {
        // Essentials just finished — pause at the interstitial rather than
        // silently sliding into the additional set.
        setQuestion(null)
        setStage('interstitial')
      } else {
        setQuestion(res.question)
        setStage('additional')
      }
    } else {
      setQuestion(null)
      setStage('results')
    }
  }

  function handleStart() {
    goToNext({}, skipped)
  }

  function handleContinue() {
    goToNext(answers, skipped)
  }

  function handleSkip() {
    if (!question) return
    const nextSkipped = new Set(skipped).add(question.id)
    setSkipped(nextSkipped)
    goToNext(answers, nextSkipped)
  }

  function handleInterstitialContinue() {
    setStage('additional')
    goToNext(answers, skipped)
  }

  function handleSeeNumbersNow() {
    setQuestion(null)
    setStage('results')
  }

  function handleRestart() {
    setAnswers({})
    setSkipped(new Set())
    setQuestion(null)
    setStage('intro')
  }

  function handleAnswerMore() {
    goToNext(answers, skipped)
  }

  const result = useMemo(() => {
    if (stage !== 'results') return null
    return runAssessment(answers as BorrowerInput)
  }, [stage, answers])

  return (
    <div className="min-h-screen bg-paper">
      <ThemeToggle />   
      <div className="max-w-xl mx-auto px-5 py-10 md:py-16">
        {stage === 'intro' && <Intro onStart={handleStart} />}

        {(stage === 'must' || stage === 'additional') && question && (
          <QuestionScreen
            question={question}
            answers={answers}
            progressDone={prog.done}
            progressTotal={prog.total}
            phase={stage}
            onChange={patch}
            onSkip={handleSkip}
            onContinue={handleContinue}
            onSeeNumbersNow={handleSeeNumbersNow}
          />
        )}

        {stage === 'interstitial' && (
          <Interstitial onContinue={handleInterstitialContinue} onSeeNumbers={handleSeeNumbersNow} />
        )}

        {stage === 'results' && result && (
          <ResultsScreen
            answers={answers as BorrowerInput}
            result={result}
            onRestart={handleRestart}
            onAnswerMore={handleAnswerMore}
          />
        )}
      </div>
    </div>
  )
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs tracking-wide text-oxide font-semibold">Borrower Copilot</p>
        <h1 className="font-serif text-4xl leading-tight text-ink">Know your number before you walk in.</h1>
        <p className="text-inkmute text-lg leading-relaxed max-w-md">
          Answer a few questions about your income and your ask. You'll get a straight verdict, a
          safe borrowing ceiling, a fair rate band, and an EMI you shouldn't cross — plus a card
          you can hand a lender.
        </p>
      </div>
      <ul className="space-y-2 text-sm text-inkmute border-t border-line pt-5">
        <li>No login. No credit bureau pull. Nothing you type is stored anywhere.</li>
        <li>Answer only the essentials, or go further to tighten your numbers.</li>
        <li>Every number comes with the one sentence that explains it.</li>
      </ul>
      <button onClick={onStart} className="bg-ink text-paper px-7 py-3.5 font-medium hover:bg-oxidedark transition-colors">
        Start — takes about 3 minutes
      </button>
    </div>
  )
}

function QuestionScreen({
  question,
  answers,
  progressDone,
  progressTotal,
  phase,
  onChange,
  onSkip,
  onContinue,
  onSeeNumbersNow,
}: {
  question: QuestionDef
  answers: Answers
  progressDone: number
  progressTotal: number
  phase: 'must' | 'additional'
  onChange: (p: Answers) => void
  onSkip: () => void
  onContinue: () => void
  onSeeNumbersNow: () => void
}) {
  const answered = question.isAnswered(answers)

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-1 bg-line w-full">
          <div
            className="h-1 bg-oxide transition-all duration-300"
            style={{ width: `${Math.min(100, (progressDone / Math.max(1, progressTotal)) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-inkmute font-mono">
          {phase === 'must' ? 'The essentials' : 'Tightening your numbers'} · {progressDone}/{progressTotal}
        </p>
      </div>

      <div className="space-y-1">
        <h2 className="font-serif text-2xl md:text-3xl leading-snug text-ink">{question.prompt}</h2>
        {question.help && <p className="text-sm text-inkmute">{question.help}</p>}
      </div>

      <QuestionInput question={question} answers={answers} onChange={onChange} onSkip={onSkip} onEnter={onContinue} />

      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-line">
        <button
          onClick={onContinue}
          disabled={!answered}
          className="bg-ink text-paper px-6 py-3 font-medium hover:bg-oxidedark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Continue
        </button>
        {phase === 'additional' && (
          <button onClick={onSeeNumbersNow} className="text-sm text-indigo underline underline-offset-2 hover:text-ink">
            See my numbers now, as they stand →
          </button>
        )}
      </div>
    </div>
  )
}

function Interstitial({ onContinue, onSeeNumbers }: { onContinue: () => void; onSeeNumbers: () => void }) {
  return (
    <div className="space-y-6">
      <p className="text-xs tracking-wide text-oxide font-semibold">Essentials done</p>
      <h2 className="font-serif text-3xl leading-snug text-ink">That's enough to give you a first answer.</h2>
      <p className="text-inkmute leading-relaxed max-w-md">
        Right now your ranges will be wide, and we'll say so. A few more questions — tailored to
        what you've told us — will narrow the eligible amount, the rate, and the EMI ceiling.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button onClick={onContinue} className="bg-ink text-paper px-6 py-3 font-medium hover:bg-oxidedark transition-colors">
          Answer a few more questions
        </button>
        <button onClick={onSeeNumbers} className="border border-ink px-6 py-3 font-medium hover:bg-paper2 transition-colors">
          See my numbers now
        </button>
      </div>
    </div>
  )
}