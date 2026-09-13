import { BorrowerInput } from '../types/borrower'

export type FieldKind =
  | 'select-purpose'
  | 'number-amount'
  | 'select-loanType'
  | 'select-incomeType'
  | 'number-income'
  | 'number-emis'
  | 'number-expenses'
  | 'number-age'
  | 'credit-score'
  | 'number-dependents'
  | 'number-stability-years'
  | 'percent-variable-income'
  | 'existing-loan-detail'
  | 'percent-card-util'
  | 'number-bounces'
  | 'number-savings-months'
  | 'number-collateral'
  | 'number-coapplicant'
  | 'number-upcoming-expense'
  | 'boolean-productive'
  | 'number-expected-return'
  | 'offers-received'

export interface QuestionDef {
  id: string
  tier: 'must' | 'additional'
  field: FieldKind
  prompt: string
  help?: string
  // Which output(s) this question changes — shown in RULES.md and used to
  // justify the "every additional question must move a number" rule.
  movesOutput: string[]
  appliesIf: (b: Partial<BorrowerInput>) => boolean
  isAnswered: (b: Partial<BorrowerInput>) => boolean
}

const always = () => true

// ── Must-answer set (8–10) ──
// If a borrower stops here, the engine still runs — wide ranges, low
// confidence, clearly labelled as such.
export const MUST_QUESTIONS: QuestionDef[] = [
  {
    id: 'purpose',
    tier: 'must',
    field: 'select-purpose',
    prompt: 'What is this loan for?',
    movesOutput: ['O1 verdict', 'O3 product routing'],
    appliesIf: always,
    isAnswered: (b) => !!b.purpose,
  },
  {
    id: 'amountWanted',
    tier: 'must',
    field: 'number-amount',
    prompt: 'How much do you want to borrow?',
    movesOutput: ['O1', 'O2', 'O4'],
    appliesIf: always,
    isAnswered: (b) => !!b.amountWanted && b.amountWanted > 0,
  },
  {
    id: 'loanType',
    tier: 'must',
    field: 'select-loanType',
    prompt: 'What kind of loan are you considering?',
    help: 'Pick what you have in mind — we may suggest a cheaper alternative later based on what you own.',
    movesOutput: ['O2', 'O3', 'O4'],
    appliesIf: always,
    isAnswered: (b) => !!b.loanType,
  },
  {
    id: 'incomeType',
    tier: 'must',
    field: 'select-incomeType',
    prompt: 'How is your income earned?',
    movesOutput: ['O1', 'O2', 'O3'],
    appliesIf: always,
    isAnswered: (b) => !!b.incomeType,
  },
  {
    id: 'netMonthlyIncome',
    tier: 'must',
    field: 'number-income',
    prompt: 'What is your net monthly income (after tax, take-home)?',
    help: 'If it varies, give your typical month.',
    movesOutput: ['O1', 'O2', 'O4'],
    appliesIf: always,
    isAnswered: (b) => b.netMonthlyIncome !== undefined && b.netMonthlyIncome >= 0,
  },
  {
    id: 'existingEMIs',
    tier: 'must',
    field: 'number-emis',
    prompt: 'What do you currently pay each month across all existing EMIs and loans?',
    help: 'Enter 0 if you have none — this is different from not knowing.',
    movesOutput: ['O1', 'O2', 'O4'],
    appliesIf: always,
    isAnswered: (b) => b.existingEMIs !== undefined && b.existingEMIs >= 0,
  },
  {
    id: 'householdExpenses',
    tier: 'must',
    field: 'number-expenses',
    prompt: 'Roughly what does your household spend each month, outside of any EMIs?',
    movesOutput: ['O1', 'O4'],
    appliesIf: always,
    isAnswered: (b) => b.householdExpenses !== undefined && b.householdExpenses >= 0,
  },
  {
    id: 'age',
    tier: 'must',
    field: 'number-age',
    prompt: 'What is your age?',
    movesOutput: ['O2', 'O4'],
    appliesIf: always,
    isAnswered: (b) => !!b.age && b.age > 0,
  },
  {
    id: 'creditScore',
    tier: 'must',
    field: 'credit-score',
    prompt: 'Do you know your credit score (CIBIL or similar)?',
    help: "It's fine if you don't — that itself changes your pricing, so say so rather than guessing.",
    movesOutput: ['O3'],
    appliesIf: always,
    isAnswered: (b) => b.creditScore !== undefined,
  },
  {
    id: 'dependents',
    tier: 'must',
    field: 'number-dependents',
    prompt: 'How many people depend on your income?',
    movesOutput: ['O1', 'O4'],
    appliesIf: always,
    isAnswered: (b) => b.dependents !== undefined,
  },
]

// ── Additional set — every one must move a number ──
export const ADDITIONAL_QUESTIONS: QuestionDef[] = [
  {
    id: 'incomeStabilityYears',
    tier: 'additional',
    field: 'number-stability-years',
    prompt: 'How many years have you been in this job or running this business?',
    movesOutput: ['O2 safe-carry (stability haircut)'],
    appliesIf: (b) => b.incomeType === 'salaried',
    isAnswered: (b) => b.incomeStabilityYears !== undefined,
  },
  {
    id: 'variableIncomeShare',
    tier: 'additional',
    field: 'percent-variable-income',
    prompt: 'Roughly what share of your income varies month to month rather than being fixed?',
    help: 'For a shop, this is usually most of it. For salary plus commission, just the commission part.',
    movesOutput: ['O2 safe-carry (income haircut)'],
    appliesIf: (b) => b.incomeType === 'self-employed',
    isAnswered: (b) => b.variableIncomeShare !== undefined,
  },
  {
    id: 'existingLoanDetail',
    tier: 'additional',
    field: 'existing-loan-detail',
    prompt: 'Tell us a bit more about your existing loans.',
    movesOutput: ['O1 verdict', 'O4 stress case'],
    appliesIf: (b) => (b.existingEMIs ?? 0) > 0 || b.incomeType === 'informal',
    isAnswered: (b) => !!b.existingLoanDetail,
  },
  {
    id: 'cardUtilisation',
    tier: 'additional',
    field: 'percent-card-util',
    prompt: 'On average, how much of your credit card limit(s) do you use?',
    movesOutput: ['O2 safe-carry (stress penalty)', 'Negotiation Card flags'],
    appliesIf: (b) => b.incomeType === 'salaried' || b.incomeType === 'self-employed',
    isAnswered: (b) => b.cardUtilisation !== undefined,
  },
  {
    id: 'pastBounces',
    tier: 'additional',
    field: 'number-bounces',
    prompt: 'Any missed or bounced EMI/cheque payments in the last 12 months?',
    movesOutput: ['O1 verdict', 'O2 safe-carry', 'Negotiation Card flags'],
    appliesIf: always,
    isAnswered: (b) => b.pastBounces !== undefined,
  },
  {
    id: 'emergencySavingsMonths',
    tier: 'additional',
    field: 'number-savings-months',
    prompt: 'If your income stopped tomorrow, how many months of expenses could you cover from savings?',
    movesOutput: ['Negotiation Card flags', 'O4 stress framing'],
    appliesIf: always,
    isAnswered: (b) => b.emergencySavingsMonths !== undefined,
  },
  {
    id: 'collateralValue',
    tier: 'additional',
    field: 'number-collateral',
    prompt: 'Do you own any property or asset, free of any existing loan, you could offer as security?',
    help: "If yes, tell us its rough value — it can unlock a much cheaper loan type.",
    movesOutput: ['O3 product routing and rate'],
    appliesIf: (b) => b.loanType === 'personal' || b.loanType === 'business',
    isAnswered: (b) => b.collateralValue !== undefined,
  },
  {
    id: 'coApplicantIncome',
    tier: 'additional',
    field: 'number-coapplicant',
    prompt: 'Is anyone co-applying with you? If so, what is their net monthly income?',
    movesOutput: ['O2 both numbers'],
    appliesIf: always,
    isAnswered: (b) => b.coApplicantIncome !== undefined,
  },
  {
    id: 'upcomingLargeExpense',
    tier: 'additional',
    field: 'number-upcoming-expense',
    prompt: 'Any large expense you know is coming in the next year (school fees, medical, festival, etc.)?',
    movesOutput: ['O2 safe-carry'],
    appliesIf: always,
    isAnswered: (b) => b.upcomingLargeExpense !== undefined,
  },
  {
    id: 'loanIsProductive',
    tier: 'additional',
    field: 'boolean-productive',
    prompt: 'Will this loan be used to earn more income (stock, equipment, a vehicle for work)?',
    movesOutput: ['O1 verdict framing', 'O4 stress framing'],
    appliesIf: (b) => b.purpose === 'business-working-capital' || b.purpose === 'business-expansion' || b.purpose === 'vehicle',
    isAnswered: (b) => b.loanIsProductive !== undefined,
  },
  {
    id: 'expectedMonthlyReturn',
    tier: 'additional',
    field: 'number-expected-return',
    prompt: 'Roughly how much extra income a month do you expect this to bring in?',
    movesOutput: ['O1 verdict', 'O4 ceiling framing'],
    appliesIf: (b) => b.loanIsProductive === true,
    isAnswered: (b) => b.expectedMonthlyReturn !== undefined,
  },
  {
    id: 'offersReceived',
    tier: 'additional',
    field: 'offers-received',
    prompt: 'Has a lender already quoted you a rate? Add it so we can compare directly.',
    movesOutput: ['O3 comparison on the Negotiation Card'],
    appliesIf: always,
    isAnswered: (b) => !!b.offersReceived && b.offersReceived.length > 0,
  },
]

export function applicableAdditionalQuestions(b: Partial<BorrowerInput>): QuestionDef[] {
  return ADDITIONAL_QUESTIONS.filter((q) => q.appliesIf(b))
}

export function applicableMustQuestions(b: Partial<BorrowerInput>): QuestionDef[] {
  return MUST_QUESTIONS.filter((q) => q.appliesIf(b))
}
