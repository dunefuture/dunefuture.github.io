# Public participant reader — privacy compatibility audit

Status: **OPEN / REVIEW REQUIRED**. Source inspected: `championship.html` in website integration branch. No live Firestore access performed.

## Observed source behavior
- The public page initializes the Firebase client SDK with project `dune-future-championship`.
- It queries `tournaments/dune-future-championship-2027/participants` with `where("status", "==", "approved")`.
- It maps **entire document objects** using `doc.data()`, then renders only a name and an APPROVED label using DOM `textContent`.
- The separate static `championship-public.json` is a draft leaderboard with 21 empty slots. It is **not** the registration ledger.
- The new private registration flow uses `phase1Registrations`, `phase1Seats`, `phase1PersonSeats`, `phase1Roster` and related private collections. The old public reader is not a proven compatible substitute for the sanitized roster.

## Risk and limits
The `status == approved` client-side query is **not** field-level redaction. Firestore rules govern which documents can be read; the browser receives the full contents of any allowed document. Rendering only `name` does not prevent other permitted fields from being delivered to the client. Therefore this audit cannot certify the legacy participants collection as privacy-safe without examining actual deployed rules and document schemas.

## Release blockers
1. Confirm deployed Firestore rules and fields of approved participant documents without publishing personal information.
2. Decide whether the legacy public query should be removed or replaced by an explicitly sanitized public projection; preserve other tournament features.
3. Verify browser reads with anonymous, player and administrator roles against approved rules, including query compatibility and unauthorized access denial.
4. Confirm public roster is never derived from unapproved or unverified registrations.
5. Test with registration CLOSED and independent rollback approval before any public deployment.

## Current guardrail
Do not add direct browser reads of private enrollment, review, audit or identity documents. Do not change deployed rules or live collections as part of this audit. No production readiness claim.
