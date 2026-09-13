# Borrower Copilot

A self-assessment tool for Indian borrowers. Answer questions about your income and what you
want to borrow; get four straight answers :-
1. Should you borrow at all? 
2. How much?
3. At what rate? 
4. What EMI to agree to? 

BONUS!! - A one-page Negotiation Card to take to a lender.

No login. No credit bureau pull. Nothing typed into the app is stored or sent anywhere — it's a
pure client-side app, all state lives in memory and disappears on refresh.

## Run it (under 5 minutes)

Requires Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open the URL it prints (typically `http://localhost:5173`). That's it — no backend, no
environment variables, no API keys.

To produce a static production build:

```bash
npm run build
npm run preview   # serves the built output locally
```

## Verifying the rules directly (optional)

The three required persona run-throughs (`RUNTHROUGHS.md`) were generated from the engine, not
hand-written. To reproduce them or try your own borrower profile without going through the UI:

```bash
npx tsx scripts/check-personas.ts
```

This runs `runAssessment()` — the same function the UI calls — directly against Priya, Ravi, and
Anita's full profiles and prints all four outputs plus confidence and flags. It's the fastest
way to sanity-check a rule change: edit a threshold in `src/rules/thresholds.ts`, re-run the
script, see the numbers move.

## Project layout

```
src/
  types/borrower.ts      # the BorrowerInput / AssessmentResult contract
  rules/                 # all lending logic — no React, no UI code
    thresholds.ts          # every threshold/band/assumption, named and commented
    amortize.ts             # EMI / reverse-EMI / APR math (pure formulas, no judgement calls)
    eligibility.ts           # Output O2 — lender-likely vs. safe-carry
    rate.ts                   # Output O3 — rate band, APR, secured-product routing
    emi.ts                     # Output O4 — EMI ceiling, tenure options, stress case
    verdict.ts                  # Output O1 — borrow / don't / borrow-less, and risk flags
    confidence.ts                # range-widening based on how much was answered
    engine.ts                     # orchestrates the above into one AssessmentResult
  questions/
    schema.ts               # every question: tier, prompt, appliesIf(), isAnswered(), movesOutput
    flow.ts                   # adaptive sequencing — recomputes what's next after every answer
  ui/                        # React components only — no thresholds or lending logic live here
  App.tsx                    # wires intro → question flow → interstitial → results together
```

The split between `/rules` and `/ui` is deliberate: every number the app shows can be traced to
a named constant in `thresholds.ts` and a short comment explaining it, without touching any
`.tsx` file. `RULES.md` mirrors this file constant-for-constant with the reasoning behind each
one.

## What this is not

Not a credit model, not a bureau integration, not a loan origination system. It's a
self-assessment a borrower can run before they talk to a lender, built from FOIR-style
affordability math and representative (not live) Indian lending-market rate bands. See
`RULES.md` §7 for exactly what's a documented assumption vs. a citable source.
