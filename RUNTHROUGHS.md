# Run-throughs: Priya, Ravi, Anita

For each persona: the must questions the app asks (same order for everyone — this set doesn't
adapt), the additional questions the app actually surfaces (this set adapts to earlier
answers — see the "questions *not* asked" line for what was skipped and why), the four
outputs, and the Negotiation Card. Numbers below are the actual output of the engine
(`scripts/check-personas.ts` — run `npx tsx scripts/check-personas.ts` to reproduce).

---

## Priya, 29 — Bengaluru, salaried software engineer

### Must questions asked
| Question | Answer |
|---|---|
| Purpose | Wedding |
| Amount wanted | ₹8,00,000 |
| Loan type | Personal loan |
| Income type | Salaried |
| Net monthly income | ₹1,10,000 |
| Existing EMIs | ₹14,000 (car loan) |
| Household expenses | ₹45,000 (incl. ₹28,000 rent) |
| Age | 29 |
| Credit score | 780 |
| Dependents | 0 |

### Additional questions the app surfaced (adaptive)
Because Priya is salaried, **variable income share** never appears (self-employed only). Because
she has an existing EMI, **existing-loan detail** is offered; because her requested product is
unsecured, **collateral** is offered. In total 9 additional questions are applicable to her
profile. She answered **job stability** (5 years — below the 2-year haircut threshold, so no
penalty), **card utilisation** (20% — well under the stress threshold), **past bounces** (0),
**emergency savings** (4 months), and **upcoming large expense** (₹0) — and used the "skip, not
applicable" option on **existing-loan detail**, **collateral**, **co-applicant income**, and
**offers received**, since none of those felt relevant to her situation. 5 of 9 answered — the
app proceeds with medium confidence and says so, rather than pretending the skipped questions
don't matter.

### Outputs
| Output | Result |
|---|---|
| **O1 Verdict** | **Borrow.** What she's asking for is within her safe-carry ceiling. |
| **O2 Amount** | Safe to carry: **₹12,80,226**. Lender may sanction: **₹17,86,059**. Use the safe-carry figure — she's asking for ₹8,00,000, comfortably inside it either way. |
| **O3 Rate** | **10.8% – 14.8%** on a personal loan (all-in APR 11.5% – 15.1%). Priced favourably — excellent credit score (780) puts her near the low end of the personal-loan band. |
| **O4 EMI** | Ceiling **₹21,383/month** at a 4-year tenure. Stress case (rate +2pp or income −10%): EMI could reach ₹22,184 — still comfortably safe. |
| **Confidence** | Medium (5/9 additional questions answered) — ranges would tighten further with more detail. |
| **Flags** | None. |

### Negotiation Card
> **Verdict:** Borrow
> **I can safely carry:** ₹12.8L · **A lender may offer:** ₹17.9L
> **Fair rate for my profile:** 10.8% – 14.8% on a personal loan · All-in APR 11.5% – 15.1%
> **Monthly EMI I should agree to:** ₹21,383/month (could reach ₹22,184 under stress)
> *Based on a reasonable amount of detail — a few more answers would tighten this further.*

---

## Ravi, 42 — Mysuru, self-employed kirana store owner

### Must questions asked
| Question | Answer |
|---|---|
| Purpose | Business expansion (second stock line + delivery vehicle) |
| Amount wanted | ₹15,00,000 |
| Loan type | Business loan (unsecured, as he asked) |
| Income type | Self-employed |
| Net monthly income | ₹55,000 (his own sense of a typical month — see note below) |
| Existing EMIs | ₹0 (never taken a formal loan) |
| Household expenses | ₹22,000 |
| Age | 42 |
| Credit score | Unknown (no bureau history) |
| Dependents | 2 |

**A note on income:** the persona brief gives both a cash-income range (₹40,000–80,000/month)
and a lower ITR-equivalent figure (₹4,20,000/year ≈ ₹35,000/month). The must-question asks for
a self-reported "typical month," so we used ₹55,000. RULES.md §7 documents this gap explicitly —
a real lender would likely anchor closer to the ITR figure, which our income haircut (below)
is a proxy for, not a full reconciliation.

### Additional questions the app surfaced (adaptive)
Self-employed, so the app asked for **variable income share** (50% — triggers a real haircut on
his safe-carry income) instead of the salaried-only "job stability" question. It asked about
**collateral** (his unencumbered shop premises, ~₹45,00,000) because he'd selected an unsecured
product — this single answer changes the entire pricing outcome (see below). It asked about
**co-applicant income** (wife, ₹18,000/month), **upcoming large expenses** (none), and — because
his stated purpose was business expansion — whether the **loan is productive** (yes) and his
**expected monthly return** (₹15,000). It did not ask about card utilisation or existing-loan
detail, since he has no cards on file and no existing EMIs. He answered 8 of 10 applicable
questions — high confidence.

### Outputs
| Output | Result |
|---|---|
| **O1 Verdict** | **Borrow less.** Safe-carry is close to, but below, the ₹15,00,000 he wants. |
| **O2 Amount** | Safe to carry: **₹14,29,098**. Lender may sanction: **₹27,74,185** — a much bigger gap than Priya's, because the lender-likely figure uses his stated income at a generous FOIR with no haircuts, while safe-carry applies the self-employed income haircut and the disposable-income floor. |
| **O3 Rate** | **Re-routed to a Loan Against Property (LAP)**, not the unsecured business loan he asked for — because his collateral (₹45L) is well over 1.2× the amount requested. Rate: **12% – 14.1%** (all-in APR 12.1% – 14.1%), instead of what an unsecured business loan at an unknown credit score would have priced at (would have landed near 18-19%, the top of the 11–20% unsecured band). This routing is the single biggest lever in Ravi's outcome. |
| **O4 EMI** | Ceiling **₹18,129/month** on the safe-carry amount, 15-year LAP tenure. Stress case: could reach ₹20,050 — still safe. |
| **Confidence** | High (8/10 additional questions answered). |
| **Flags** | Credit score unknown — priced as higher risk until he checks it. |

### Negotiation Card
> **Verdict:** Borrow less than you asked
> **I can safely carry:** ₹14.3L · **A lender may offer:** ₹27.7L
> **Fair rate for my profile:** 12.0% – 14.1% on a loan against property · All-in APR 12.1% – 14.1%
> *(Not the unsecured business loan rate — you own unencumbered property worth well over the amount you're asking for. Ask specifically for a Loan Against Property.)*
> **Monthly EMI I should agree to:** ₹18,129/month (could reach ₹20,050 under stress)
> *Credit score unknown — priced as higher risk until you check it (free, via CIBIL/Experian).*

---

## Anita, 35 — Hubballi, delivery-platform rider + home tailoring

### Must questions asked
| Question | Answer |
|---|---|
| Purpose | Vehicle (electric scooter, to increase delivery capacity) |
| Amount wanted | ₹1,50,000 |
| Loan type | Two-wheeler loan |
| Income type | Informal |
| Net monthly income | ₹28,000 |
| Existing EMIs | ₹0 (her existing debt is three informal app loans, not formal EMIs) |
| Household expenses | ₹22,000 |
| Age | 35 |
| Credit score | Unknown |
| Dependents | 2 |

### Additional questions the app surfaced (adaptive)
Informal income skips the salaried/self-employed-specific questions entirely. The app asked
about **existing-loan detail** because she has debt outstanding even though `existingEMIs` was
reported as 0 (3 loans, ₹35,000 outstanding, worst known rate 32%) — this single answer is what
triggers the "already carrying expensive debt" verdict rule. It asked about **past bounces** (1
in the last 12 months — this compounds directly with the debt-rate flag) and **emergency
savings** (0 months). Because her purpose is a vehicle for work, it asked whether the **loan is
productive** (yes) and her **expected monthly return** (₹4,000 from extra delivery capacity).
It did not ask about collateral (not applicable to a two-wheeler loan routing) or card
utilisation (no cards). She answered 4 of 7 applicable questions.

### Outputs
| Output | Result |
|---|---|
| **O1 Verdict** | **Don't borrow — not now.** Triggered by Rule #2 in RULES.md §4: she's carrying debt priced above 30% *and* has a missed payment in the last 12 months. The honest answer here isn't "borrow less," it's "fix the expensive debt first." |
| **O2 Amount** | Safe to carry: **₹88,269** (informal income is haircut 30%, and the FOIR cap for informal income is the tightest of any tier). Lender may sanction: **₹2,86,737** — a lender's generic affordability check would likely offer far more than she should actually take. |
| **O3 Rate** | **14.2% – 18.2%** on a two-wheeler loan (all-in APR 15.1% – 18.7%) — priced near the top of the band because her credit score is unknown. |
| **O4 EMI** | Ceiling **₹3,112/month** — shown for completeness, but the verdict says don't take this loan at all right now. |
| **Confidence** | Medium (4/7 additional questions answered). |
| **Flags** | Credit score unknown; 1 missed payment in the last 12 months; informal income hard to prove to a mainstream lender; little to no emergency buffer; already carrying debt priced above 30%. |

### Negotiation Card
> **Verdict:** Don't borrow — not now
> **I can safely carry:** ₹88,269 · **A lender may offer:** ₹2,86,737
> **Fair rate for my profile:** 14.2% – 18.2% on a two-wheeler loan · All-in APR 15.1% – 18.7%
> **Monthly EMI (if you did borrow):** ₹3,112/month
> **Worth mentioning:** you're already carrying debt priced above 30% with a missed payment in
> the last year. Before this or any new loan, the priority is paying down or consolidating that
> existing debt — a mainstream lender is unlikely to approve a new loan on top of it, and if one
> does, it will price the risk in heavily.

This is exactly the outcome the brief asks for: **"Don't" is a legitimate answer and must be
reachable** — Anita's numbers are the proof that the engine doesn't just default to "yes, here's
an EMI" once income is entered.
