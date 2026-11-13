# Championship 2027 — public roster publication gate

**Status: NOT AUTHORIZED FOR PRODUCTION.** This procedure is a review contract, not permission to publish or open registration.

## Approved source and boundary

- The enrollment ledger (`phase1Registrations`, `registrations`, identity/seat-lock collections) is private and must never be copied into the public repository or CI artifacts.
- The public projection must contain **only** `schemaVersion`, `lineupStatus`, `slots` (each `id`, `name`) and `matches` (each `id`, `round`, `a`, `b`, `result` with permitted status/winner). The parser rejects extra fields.
- Before any name is included, an authorized tournament administrator must independently verify the approved public display name, publication basis/consent, seat ownership, and dispute/appeal status in a private system.
- A `draft` publication contains exactly 21 null names and no matches. A `finalized` publication requires 21 names and a complete, non-duplicated 210-match/21-round schedule. Finalization is a separate authorized decision.

## Required publication sequence

1. In a **private, access-controlled** environment, prepare an allowlisted candidate JSON from reviewed approved records. Never log or export source registration documents, emails, UIDs, Discord IDs, person locks, or private audit fields.
2. Run `node scripts/validate-championship-public.mjs path/to/candidate.json`. Exit 0 means **schema only**; it does not authorize publication or certify consent, provenance or correctness.
3. Require independent human approval of each proposed display name and of the exact candidate diff, plus verification of production rules and rollback readiness.
4. Open a separate reviewed PR containing **only the sanitized candidate JSON**. Require CI green, a second reviewer and explicit release authorization before merging. No direct pushes or automated Firebase writes.
5. After authorized deployment, confirm the public page shows only approved fields, inspect access behavior with an anonymous browser, and retain an agreed rollback path.
6. On discrepancy, revoke publication authorization, revert the public projection through the approved release process, and investigate privately. Do not expose private records while diagnosing.

## Explicit non-goals

- This gate does not verify deployed Firestore rules, Google OAuth, production admin UID, backup custody, migration, participant eligibility, or account creation.
- The public page's existing legacy participant collection query remains a separate compatibility risk; see `docs/championship-public-reader-privacy-audit.md`.
- Registration stays **CLOSED**, release stays **NO-GO**, and Draft PR #2 stays unmerged until the full release gate is approved.
