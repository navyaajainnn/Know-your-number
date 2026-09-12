import { BorrowerInput } from '../types/borrower'
import { QuestionDef } from '../questions/schema'
import { INCOME_TYPE_OPTIONS, LOAN_TYPE_OPTIONS, PURPOSE_OPTIONS } from './options'

type Answers = Partial<BorrowerInput>

interface Props {
  question: QuestionDef
  answers: Answers
  onChange: (patch: Answers) => void
  onSkip: () => void
  onEnter?: () => void
}

const inputBase =
  'w-full bg-transparent border-b-2 border-line focus:border-oxide outline-none py-3 text-xl font-serif text-ink placeholder:text-inkmute/60 transition-colors'
const chipBase =
  'px-4 py-2.5 border border-line text-sm font-medium rounded-none hover:border-ink transition-colors text-left'
const chipActive = 'bg-ink text-paper border-ink'
const chipInactive = 'bg-transparent text-ink'

export default function QuestionInput({ question, answers, onChange, onSkip, onEnter }: Props) {
  const canSkip = question.tier === 'additional'

  return (
    <div className="space-y-5">
      {renderField()}
      {canSkip && (
        <button onClick={onSkip} className="text-sm text-inkmute underline underline-offset-2 hover:text-ink">
          Skip — I don't know / not applicable
        </button>
      )}
    </div>
  )

  function renderField() {
    switch (question.field) {
      case 'select-purpose':
        return (
          <div className="grid grid-cols-2 gap-2">
            {PURPOSE_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={`${chipBase} ${answers.purpose === o.value ? chipActive : chipInactive}`}
                onClick={() => onChange({ purpose: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
        )

      case 'select-loanType':
        return (
          <div className="grid grid-cols-2 gap-2">
            {LOAN_TYPE_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={`${chipBase} ${answers.loanType === o.value ? chipActive : chipInactive}`}
                onClick={() => onChange({ loanType: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
        )

      case 'select-incomeType':
        return (
          <div className="flex flex-col gap-2">
            {INCOME_TYPE_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={`${chipBase} flex flex-col gap-0.5 ${answers.incomeType === o.value ? chipActive : chipInactive}`}
                onClick={() => onChange({ incomeType: o.value })}
              >
                <span>{o.label}</span>
                <span className={`text-xs ${answers.incomeType === o.value ? 'text-paper2' : 'text-inkmute'}`}>{o.help}</span>
              </button>
            ))}
          </div>
        )

      case 'number-amount':
      case 'number-income':
      case 'number-emis':
      case 'number-expenses':
      case 'number-collateral':
      case 'number-coapplicant':
      case 'number-upcoming-expense':
      case 'number-expected-return': {
        const key = fieldKeyFor(question.field)
        return (
          <RupeeInput
            value={(answers as any)[key]}
            onChange={(v) => onChange({ [key]: v } as Answers)}
            placeholder="₹ amount"
            onEnter={onEnter}
          />
        )
      }

      case 'number-age':
        return (
          <PlainNumber
            value={answers.age}
            onChange={(v) => onChange({ age: v })}
            placeholder="Age in years"
            suffix="years"
            onEnter={onEnter}
          />
        )

      case 'number-dependents':
        return (
          <PlainNumber
            value={answers.dependents}
            onChange={(v) => onChange({ dependents: v })}
            placeholder="0"
            suffix="people"
            onEnter={onEnter}
          />
        )

      case 'number-stability-years':
        return (
          <PlainNumber
            value={answers.incomeStabilityYears}
            onChange={(v) => onChange({ incomeStabilityYears: v })}
            placeholder="e.g. 5"
            suffix="years"
            onEnter={onEnter}
          />
        )

      case 'number-bounces':
        return (
          <PlainNumber
            value={answers.pastBounces}
            onChange={(v) => onChange({ pastBounces: v })}
            placeholder="0"
            suffix="in 12 months"
            onEnter={onEnter}
          />
        )

      case 'number-savings-months':
        return (
          <PlainNumber
            value={answers.emergencySavingsMonths}
            onChange={(v) => onChange({ emergencySavingsMonths: v })}
            placeholder="e.g. 2"
            suffix="months"
            onEnter={onEnter}
          />
        )

      case 'percent-variable-income':
      case 'percent-card-util': {
        const key = question.field === 'percent-variable-income' ? 'variableIncomeShare' : 'cardUtilisation'
        const val = (answers as any)[key] as number | undefined
        return (
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={val !== undefined ? Math.round(val * 100) : 0}
              onChange={(e) => onChange({ [key]: Number(e.target.value) / 100 } as Answers)}
              className="w-full accent-oxide"
            />
            <div className="font-mono text-sm text-inkmute">{val !== undefined ? `${Math.round(val * 100)}%` : 'move the slider'}</div>
          </div>
        )
      }

      case 'credit-score':
        return (
          <div className="space-y-3">
            <button
              className={`${chipBase} ${answers.creditScore === 'unknown' ? chipActive : chipInactive}`}
              onClick={() => onChange({ creditScore: 'unknown' })}
            >
              I don't know my score
            </button>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={300}
                max={900}
                placeholder="e.g. 750"
                value={typeof answers.creditScore === 'number' ? answers.creditScore : ''}
                onChange={(e) => onChange({ creditScore: e.target.value ? Number(e.target.value) : undefined })}
                onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
                className={inputBase + ' max-w-[160px]'}
              />
              <span className="text-sm text-inkmute">out of 900</span>
            </div>
          </div>
        )

      case 'boolean-productive':
        return (
          <div className="flex gap-3">
            <button
              className={`${chipBase} ${answers.loanIsProductive === true ? chipActive : chipInactive}`}
              onClick={() => onChange({ loanIsProductive: true })}
            >
              Yes, it earns
            </button>
            <button
              className={`${chipBase} ${answers.loanIsProductive === false ? chipActive : chipInactive}`}
              onClick={() => onChange({ loanIsProductive: false })}
            >
              No, personal use
            </button>
          </div>
        )

      case 'existing-loan-detail':
        return (
          <div className="space-y-4 max-w-sm">
            <PlainNumber
              label="Number of loans"
              value={answers.existingLoanDetail?.count}
              onChange={(v) =>
                onChange({
                  existingLoanDetail: {
                    count: v ?? 0,
                    totalOutstanding: answers.existingLoanDetail?.totalOutstanding ?? 0,
                    worstRateKnown: answers.existingLoanDetail?.worstRateKnown,
                  },
                })
              }
              placeholder="e.g. 3"
              suffix="loans"
              onEnter={onEnter}
            />
            <RupeeInput
              label="Total outstanding"
              value={answers.existingLoanDetail?.totalOutstanding}
              onChange={(v) =>
                onChange({
                  existingLoanDetail: {
                    count: answers.existingLoanDetail?.count ?? 0,
                    totalOutstanding: v ?? 0,
                    worstRateKnown: answers.existingLoanDetail?.worstRateKnown,
                  },
                })
              }
              placeholder="₹ amount"
              onEnter={onEnter}
            />
            <PlainNumber
              label="Highest rate you're paying, if known (%)"
              value={answers.existingLoanDetail?.worstRateKnown}
              onChange={(v) =>
                onChange({
                  existingLoanDetail: {
                    count: answers.existingLoanDetail?.count ?? 0,
                    totalOutstanding: answers.existingLoanDetail?.totalOutstanding ?? 0,
                    worstRateKnown: v,
                  },
                })
              }
              placeholder="e.g. 30"
              suffix="% p.a."
              onEnter={onEnter}
            />
          </div>
        )

      case 'offers-received': {
        const offer = answers.offersReceived?.[0]
        return (
          <div className="space-y-4 max-w-sm">
            <input
              type="text"
              placeholder="Lender name"
              value={offer?.lender ?? ''}
              onChange={(e) =>
                onChange({
                  offersReceived: [{ lender: e.target.value, rate: offer?.rate ?? 0, processingFeePct: offer?.processingFeePct ?? 0.02 }],
                })
              }
              onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
              className={inputBase}
            />
            <PlainNumber
              label="Rate quoted (%)"
              value={offer?.rate}
              onChange={(v) =>
                onChange({
                  offersReceived: [{ lender: offer?.lender ?? '', rate: v ?? 0, processingFeePct: offer?.processingFeePct ?? 0.02 }],
                })
              }
              placeholder="e.g. 14"
              suffix="% p.a."
              onEnter={onEnter}
            />
            <PlainNumber
              label="Processing fee (%)"
              value={offer ? offer.processingFeePct * 100 : undefined}
              onChange={(v) =>
                onChange({
                  offersReceived: [{ lender: offer?.lender ?? '', rate: offer?.rate ?? 0, processingFeePct: (v ?? 2) / 100 }],
                })
              }
              placeholder="e.g. 2"
              suffix="%"
              onEnter={onEnter}
            />
          </div>
        )
      }

      default:
        return null
    }
  }
}

function fieldKeyFor(field: string): keyof BorrowerInput {
  const map: Record<string, keyof BorrowerInput> = {
    'number-amount': 'amountWanted',
    'number-income': 'netMonthlyIncome',
    'number-emis': 'existingEMIs',
    'number-expenses': 'householdExpenses',
    'number-collateral': 'collateralValue',
    'number-coapplicant': 'coApplicantIncome',
    'number-upcoming-expense': 'upcomingLargeExpense',
    'number-expected-return': 'expectedMonthlyReturn',
  }
  return map[field]
}

function RupeeInput({
  value,
  onChange,
  placeholder,
  label,
  onEnter,
}: {
  value?: number
  onChange: (v?: number) => void
  placeholder?: string
  label?: string
  onEnter?: () => void
}) {
  return (
    <div>
      {label && <div className="text-sm text-inkmute mb-1">{label}</div>}
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-xl text-inkmute">₹</span>
        <input
          type="number"
          min={0}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
          className={inputBase}
        />
      </div>
    </div>
  )
}

function PlainNumber({
  value,
  onChange,
  placeholder,
  suffix,
  label,
  onEnter,
}: {
  value?: number
  onChange: (v?: number) => void
  placeholder?: string
  suffix?: string
  label?: string
  onEnter?: () => void
}) {
  return (
    <div>
      {label && <div className="text-sm text-inkmute mb-1">{label}</div>}
      <div className="flex items-baseline gap-2">
        <input
          type="number"
          min={0}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
          className={inputBase + ' max-w-[220px]'}
        />
        {suffix && <span className="text-sm text-inkmute">{suffix}</span>}
      </div>
    </div>
  )
}