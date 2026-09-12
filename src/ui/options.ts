import { IncomeType, LoanPurpose, LoanType } from '../types/borrower'

export const PURPOSE_OPTIONS: { value: LoanPurpose; label: string }[] = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'medical', label: 'Medical expense' },
  { value: 'education', label: 'Education' },
  { value: 'home-purchase', label: 'Buying a home' },
  { value: 'home-improvement', label: 'Home improvement / renovation' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'business-working-capital', label: 'Business — working capital / stock' },
  { value: 'business-expansion', label: 'Business — expansion / equipment' },
  { value: 'debt-consolidation', label: 'Paying off other debt' },
  { value: 'other-consumption', label: 'Other personal expense' },
]

export const LOAN_TYPE_OPTIONS: { value: LoanType; label: string }[] = [
  { value: 'personal', label: 'Personal loan (unsecured)' },
  { value: 'home', label: 'Home loan' },
  { value: 'lap', label: 'Loan against property' },
  { value: 'gold', label: 'Gold loan' },
  { value: 'two-wheeler', label: 'Two-wheeler loan' },
  { value: 'business', label: 'Business loan (unsecured)' },
]

export const INCOME_TYPE_OPTIONS: { value: IncomeType; label: string; help: string }[] = [
  { value: 'salaried', label: 'Salaried', help: 'Fixed monthly salary from an employer' },
  { value: 'self-employed', label: 'Self-employed', help: 'Own business or shop, files ITR' },
  { value: 'informal', label: 'Informal / gig income', help: 'Daily wage, platform work, cash income, no formal ITR' },
]
