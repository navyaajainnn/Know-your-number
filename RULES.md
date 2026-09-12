# RULES.md

Every threshold, band, and assumption the engine uses, and why. Code location for each rule
is given so you can find and change it — most of this lives in `src/rules/thresholds.ts`,
with the logic that uses it in the neighbouring files.

This document is written to be defended without AI assistance, per the brief. If you change a
number here, change it in `thresholds.ts` too (or vice versa) — they must stay in sync.

---

## 1. Affordability (FOIR) — drives Output O2 and O4

FOIR = Fixed Obligation to Income Ratio = (existing EMIs + proposed EMI) / net monthly income.
We compute **two** FOIR caps per borrower: a generous one that estimates what a lender's
automated engine would likely sanction, and a tighter one that estimates what the borrower can
actually safely carry. This split — not a single number — is the app's central point of view.

### 1a. Lender-likely FOIR cap (generous, stated income, no haircuts)

| Income type | Monthly income | Cap | Why | Source |
|---|---|---|---|---|
| Salaried | < ₹25,000 | 40% | Lower-income borrowers get tighter affordability treatment across the industry | My judgement, representative of publicly documented NBFC/bank affordability norms |
| Salaried | ₹25,000–50,000 | 50% | Standard mid-tier affordability band | Same |
| Salaried | ₹50,000–1,00,000 | 55% | Standard upper-tier affordability band | Same |
| Salaried | > ₹1,00,000 | 60% | Higher income absorbs a higher fixed-obligation share | Same |
| Self-employed | any | 45% | Flat, slightly tighter than salaried — a lender's engine still discounts self-employed income somewhat even before real quality checks | My judgement |
| Informal | any | 35% | Flat, tightest — most lenders will not extend much unsecured credit against undocumented income at all; this is closer to what a gold/secured lender might allow | My judgement |

Code: `thresholds.ts → FOIR_LENDER_SALARIED / FOIR_LENDER_SELF_EMPLOYED / FOIR_LENDER_INFORMAL`,
applied in `eligibility.ts → foirCapLender()`.

### 1b. Safe-carry FOIR cap (tighter, haircut income, stress-adjusted)

| Income type | Monthly income | Cap | Why |
|---|---|---|---|
| Salaried | < ₹25,000 | 32% | We deliberately price 8pp under the lender cap at every tier — a lender's "can sanction" is not "should take" | My judgement — the core thesis of this app |
| Salaried | ₹25,000–50,000 | 38% | " |
| Salaried | ₹50,000–1,00,000 | 42% | " |
| Salaried | > ₹1,00,000 | 45% | " |
| Self-employed | any | 32% | 13pp under the lender cap — income volatility deserves a bigger safety margin than a lender's engine gives it | My judgement |
| Informal | any | 22% | 13pp under the lender cap, and off an already-haircut income (see §1c) | My judgement |

Code: `FOIR_SAFE_SALARIED / FOIR_SAFE_SELF_EMPLOYED / FOIR_SAFE_INFORMAL`, applied in
`eligibility.ts → foirCapSafeBase()`.

### 1c. Income haircuts (safe-carry calculation only — never applied to lender-likely)

| Trigger | Haircut | Why |
|---|---|---|
| Self-employed, variable income share known | `share × 35%` | Proportional to how much of income is genuinely unpredictable |
| Self-employed, variable income share unknown | 25% flat | "Unknown is never zero" — we don't assume the best case just because we weren't told |
| Informal income | 30% flat | Cash/gig income is unverifiable and typically the most volatile |
| Salaried, < 2 years in current job | 10% flat | Newer employment carries more income-continuity risk |
| Co-applicant income | counted at 80% | A second income reduces risk but a lender (and we) still discount it somewhat |

Code: `eligibility.ts → safeFacingIncome()`.

### 1d. Stress penalties to the safe FOIR cap

| Trigger | Penalty | Cap |
|---|---|---|
| Each missed payment (last 12 months) | −5 percentage points | Capped at −15pp total |
| Credit card utilisation ≥ 70% | −5 percentage points | One-time |
| Floor | Cap never falls below **10%** | A floor, not zero — "don't borrow" is expressed through the verdict logic (§4), not by silently zeroing the affordability math |

Code: `BOUNCE_PENALTY_PER_EVENT`, `BOUNCE_PENALTY_MAX`, `HIGH_CARD_UTIL_THRESHOLD`,
`HIGH_CARD_UTIL_PENALTY`, `MIN_SAFE_FOIR_FLOOR`; applied in `eligibility.ts → safeFoirCap()`.

### 1e. Disposable-income floor (this is where `householdExpenses` is used)

Even where the FOIR math leaves room, the safe-carry EMI is additionally capped so that at
least **10%** of net monthly income remains after existing EMIs, declared household expenses,
and the new EMI itself. A borrower with high FOIR headroom but very high living costs
(reported via the must-question on household expenses) should not get a ceiling that ignores
that. Whichever of the FOIR-based figure or this disposable-income figure is lower wins. My
judgement on the 10% floor. Code: `eligibility.ts → computeEligibility()`, the
`emiFromDisposableFloor` calculation.

---

## 2. Tenure and amortisation

| Loan type | Default tenure | Max tenure | Why |
|---|---|---|---|
| Personal | 48 months | 60 months | Typical Indian personal-loan market range |
| Home | 240 months | 300 months | Typical home-loan tenure range |
| LAP | 180 months | 180 months | Shorter than home loans; typical secured-business-purpose tenure |
| Gold | 12 months | 12 months | Gold loans are short-tenure by design |
| Two-wheeler | 36 months | 48 months | Typical vehicle-loan range |
| Business | 60 months | 84 months | Typical term-loan range for working capital / expansion |

My judgement, representative of common Indian lender product structures — not sourced from a
specific lender's rate card. Code: `DEFAULT_TENURE_MONTHS`, `MAX_TENURE_MONTHS`.

The engine converts an affordable monthly EMI budget into a maximum loan amount using the
standard reducing-balance annuity formula (`amortize.ts → maxPrincipalFor()`), and the reverse
for Output O4 (`emiFor()`). This is textbook amortisation math, not a judgement call.

---

## 3. Rate bands — drives Output O3

| Loan type | Low | High | Why / source |
|---|---|---|---|
| Personal | 11% | 24% | Representative of publicly advertised Indian personal-loan rate cards as of the brief's issue date (Sep 2026) |
| Home | 8.3% | 11.5% | Representative of public home-loan rate cards |
| LAP | 9.5% | 14% | Representative of public LAP rate cards — meaningfully cheaper than unsecured personal/business at the same amount |
| Gold | 9% | 15% | Representative of public gold-loan rate cards |
| Two-wheeler | 10% | 18% | Representative of public two-wheeler-loan rate cards |
| Business | 11% | 20% | Representative of public unsecured-business-loan rate cards |

**These are my judgement, directionally sourced from publicly known Indian lending-market
ranges — not a live rate feed and not specific to any one lender.** This is the single
biggest thing I do not know precisely and would want real market data to firm up.

Code: `RATE_BANDS`.

### 3a. Where in the band a borrower lands (credit tier)

| Credit score | Tier | Position in band (0=low end, 1=high end) |
|---|---|---|
| ≥ 780 | Excellent | 0.10 |
| 700–779 | Good | 0.35 |
| 650–699 | Fair | 0.65 |
| < 650 | Weak | 0.90 |
| Unknown | — | **0.85** |

**Rule: an unknown score is priced almost as badly as a weak one, never as a median score.**
This directly implements the brief's "unknown is never zero" principle for pricing. The band
shown around this point is also wider when the score is unknown (±30% of the band width vs
±18% when known) — we have less basis to narrow the estimate, so we don't.

Code: `CREDIT_TIER_POSITION`, `CREDIT_SCORE_BANDS`; applied in `rate.ts → computeRate()`.

### 3b. All-in APR

APR = nominal rate + (processing fee % × 100 / tenure in years), i.e. the one-time fee is
spread evenly across the loan's life and added to the nominal rate. **This is a simplification**
(a true IRR/XIRR solve on the actual disbursed-vs-repaid cash flow would be more precise) —
documented explicitly as an approximation, not a regulatory-grade APR calculation.

Default processing fee assumed: **2% of principal, one-time**, used only when the borrower
hasn't supplied a real lender quote (`offersReceived`). My judgement, mid-market. Code:
`DEFAULT_PROCESSING_FEE_PCT`, `amortize.ts → approximateAPR()`.

### 3c. Secured-alternative product routing

If the borrower requested an **unsecured** product (personal or business loan) *and* holds
unencumbered collateral worth **≥ 1.2×** the amount requested, we re-price against a **loan
against property (LAP)** instead of what they asked for, and say so explicitly. Rationale: a
well-informed borrower in this position should almost always prefer the secured product — the
rate gap is large enough (personal 11–24% vs LAP 9.5–14%) that defaulting to "give them what
they asked for" would be a disservice. My judgement on the 1.2× multiple — high enough that a
modest cushion exists beyond the loan amount itself.

Code: `COLLATERAL_ROUTE_MULTIPLE`; applied in `rate.ts → routeProduct()`.

---

## 4. Verdict (Output O1)

Evaluated in this order — first match wins:

| # | Condition | Verdict | Why |
|---|---|---|---|
| 1 | Existing EMIs already consume ≥ 90% of the safe-carry FOIR budget, **and** at least one missed payment in the last 12 months | **Don't borrow** | Already overextended plus a live distress signal — new debt very likely compounds the problem |
| 2 | Existing debt priced above 30% APR (informal/app-loan territory), **and** at least one missed payment | **Don't borrow** | A debt-spiral signal independent of the FOIR math — paying down expensive debt should come before taking on new debt, even if new debt looks technically affordable |
| 3 | Safe-carry amount is less than **20%** of the amount requested | **Don't borrow** | The gap between what they want and what they can safely carry is too large for "borrow less" to be a meaningful answer |
| 4 | Amount requested exceeds safe-carry (but ≥ 20% of it) | **Borrow less** | There is a usable amount, just smaller than asked |
| 5 | Otherwise | **Borrow** | What was asked for is within the safe-carry ceiling |

Code: `OVEREXTENDED_EXISTING_FOIR`, `DONT_BORROW_USABILITY_FLOOR`; applied in
`verdict.ts → computeVerdict()`.

**"Don't borrow" is reachable** — this was tested directly against Anita's persona (see
`RUNTHROUGHS.md`), who currently hits rule #2.

---

## 5. Confidence and range-widening — drives "confidence widens with silence"

Confidence is computed as `answered / applicable` across the **additional** question set only
(the must-answer set is, by definition, always fully answered before an assessment runs).
"Applicable" means the question's `appliesIf()` condition matched this borrower — an
inapplicable question is never counted against them.

| Ratio answered | Confidence | Band widening applied to rate & eligibility |
|---|---|---|
| ≤ 34% | Low | ±25% |
| 34–67% | Medium | ±12% |
| > 67% | High | ±5% |

Widening is applied symmetrically around the computed midpoint of the rate band (never used to
*narrow* a band relative to its unwidened form — confidence can only widen, per the brief's
explicit rule). My judgement on the exact cutoffs and multipliers.

Code: `CONFIDENCE_LOW_MAX`, `CONFIDENCE_MEDIUM_MAX`, `WIDEN_BY_CONFIDENCE`;
`confidence.ts → levelFromRatio() / widenBand()`.

---

## 6. EMI ceiling and stress test (Output O4)

- The EMI ceiling shown is computed on `min(amount requested, safe-carry amount)` — i.e. once
  Output O1/O2 have already capped what's sensible, O4 shows the EMI for *that* capped amount,
  not the full amount asked for. This keeps the four outputs mutually consistent rather than
  contradicting each other.
- Tenure options shown: half the default tenure (floored at 12 months), the default tenure, and
  the max tenure for that product — so the borrower can see the standard tenure/EMI trade-off.
- **Stress case**: recompute the EMI at the default tenure with the rate raised by **2
  percentage points** (`STRESS_RATE_RISE_PP`), and flag whether the result plus existing EMIs
  would still sit under 50% of a 10%-reduced income. This dual stress (rate up, income down) is
  a single combined "bad month" scenario rather than two separate ones, to keep the card to one
  line. My judgement on the 2pp / 10% figures — deliberately moderate, not a worst-case tail
  scenario.

Code: `STRESS_RATE_RISE_PP`; `emi.ts → computeEmi()`.

---

## 7. What we don't know / explicitly guessed

Being honest about limits, per the brief's scoring criterion:

- **Rate bands (§3)** are directional, not live data. A production version would pull current
  published rate cards for at least the major Indian lenders per product type.
- **FOIR caps (§1)** reflect common industry practice as I understand it, not a single cited
  regulatory source — different lenders vary meaningfully here, especially for self-employed
  and informal-income borrowers where there is no single standard.
- **APR approximation (§3b)** is a spread-the-fee simplification, not a true IRR solve. Close
  enough for comparison purposes at typical Indian personal-loan tenures, but would drift at
  very short tenures (e.g. gold loans) where a fee is a larger share of the effective cost per
  year — worth flagging to a borrower with a very short-tenure product.
- **Dependents** is collected but not yet wired into a rule — it's the clearest candidate for
  the next threshold I'd add (see WALKTHROUGH.md): a higher dependent count should tighten the
  disposable-income floor in §1e, since ₹10,000 of headroom means something different for a
  single earner than for someone supporting four dependents.
- **Self-employed income is a single self-reported number.** We ask for a "typical month" net
  income and haircut it (§1c) rather than modelling a separate declared/ITR figure vs. actual
  cash-flow figure. A real lender usually anchors to the *verifiable* (ITR) figure for
  self-employed applicants, which can be meaningfully lower than what a borrower experiences
  month to month (this is exactly Ravi's situation — ITR-equivalent ~₹35k/month vs a
  self-reported typical month of ~₹55k). Our haircut is a proxy for that gap, not a real
  ITR-vs-cash reconciliation. A production version would ask for both figures explicitly.
- **Informal-income affordability (§1)** is the least confidently modelled segment — there is no
  clean industry standard for FOIR against undocumented cash income, and Anita's case in
  particular is closer to "best available judgement" than any of the others.
