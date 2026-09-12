# Five-minute walkthrough

## What this is

A borrower answers 8–10 must-questions and gets a first answer immediately — verdict, eligible
amount, rate band, EMI ceiling, all with wide ranges and a visible "low confidence" label. From
there, an adaptive additional-question set (different for a salaried employee, a self-employed
shop owner, and an informal-income gig worker) tightens each range, and every question either
moves a number or isn't asked at all. The engine's central move is showing two numbers where
most tools show one: what a lender will likely sanction, and what the borrower can actually
safely carry — and telling them, explicitly, which one to use and why.

## The core design decision

Everything else follows from one choice: **separate `/rules` from `/ui` completely.** The rules
engine is a set of pure functions — `BorrowerInput` in, `AssessmentResult` out — that know
nothing about React. Every threshold lives in one file (`thresholds.ts`) with a comment
explaining where it came from. `RULES.md` mirrors that file line for line. This means:

- I can defend any number without opening a component file.
- A rule change (say, tightening the informal-income FOIR cap) is a one-line edit, verifiable
  in seconds with `npx tsx scripts/check-personas.ts` before it ever touches the UI.
- The "explainability" scoring criterion is structural, not something bolted on — every output
  in `AssessmentResult` carries its own `why` string generated at the point the number is
  computed, not written separately as UI copy that could drift from the actual logic.

## What I'd build next, given more time

1. **A real ITR-vs-cash-income split for self-employed borrowers.** Right now `netMonthlyIncome`
   is a single self-reported figure, haircut by a flat assumption. Ravi's persona exposed this
   directly — his real situation (₹40–80k cash, ~₹35k ITR-equivalent) doesn't fit cleanly into
   one number. Two fields plus a rule that anchors the lender-likely calc to the lower,
   verifiable figure would be materially more honest.
2. **Dependents feeding the disposable-income floor.** Collected but not yet wired into a
   threshold — a higher dependent count should tighten the 10% floor in §1e of RULES.md.
   Straightforward to add; I ran out of time-box before wiring it in.
3. **A real IRR solve for APR**, replacing the fee-spread approximation — matters most for
   short-tenure products like gold loans, where a flat fee is a much larger share of the
   effective annual cost.
4. **Save-and-resume via a shareable link** (still no server, no login) — encode answers in the
   URL so a borrower can pick this up again, or hand the link to a family member helping them
   decide, without needing an account.
5. **A second collateral-routing path**: gold-loan routing for borrowers who mention gold jewellery
   as an asset, not just property — currently only property triggers the LAP re-route.

## What I'd cut if the timebox got tighter

- The tenure-options row on the EMI output (nice for intuition, not load-bearing for any of the
  four required outputs).
- The Negotiation Card's print/PDF button — useful, but a borrower can screenshot the card just
  as well, and it's not part of the four scored outputs.
- Co-applicant income handling — it's real and used, but it's the one additional question I'd
  drop first under time pressure, since it affects the least dramatic outcome swing of anything
  in the additional set.

## Where I'm least confident

The rate bands (§3, RULES.md) and the exact FOIR cap percentages (§1). Both are my judgement,
informed by publicly known Indian lending-market norms, not a cited regulatory source or a live
rate feed — RULES.md says this plainly rather than dressing the numbers up as more authoritative
than they are. If I were building this for real, sourcing current published rate cards from a
handful of major lenders per product type would be the first thing I'd fix.
