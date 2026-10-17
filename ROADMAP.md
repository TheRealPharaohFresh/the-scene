# The Scene — Product & Engineering Roadmap

**Product:** The Scene — Connecting Entertainment Creatives
**Platform:** React, TypeScript, Vite, React Router, Firebase Authentication, Cloud Firestore
**Mobile:** Capacitor is deferred until the web product is stable and release-ready
**Last audited:** 2026-10-16

## Product vision

The Scene helps adults in entertainment discover collaborators, build professional connections, and find meaningful relationships. Members present a creative profile, discover relevant people, express interest, match mutually, and communicate safely.

## Working principles

- Treat repository behavior, not earlier README claims, as evidence.
- Preserve existing work; keep the current React, TypeScript, Vite, and Firebase architecture.
- Keep security rules restrictive. A hidden control or route guard is not authorization.
- Do not deploy rules, change production data/settings, enable billing, publish, or incur costs without explicit owner approval.
- Do not claim a feature is complete without tracing its backend flow and running its relevant checks.
- Document owner decisions and external setup that block safe implementation; do independent work in the meantime.
- Interview Assist and other unrelated features are out of scope.

## Audit and verification matrix

| Requirement | Status | Evidence and remaining proof |
| --- | --- | --- |
| Working-tree preservation | Verified complete | Initial audit found pre-existing edits in `src/features/auth/profile/Profile.tsx` and `src/features/auth/profile/ProfileCard.tsx`; both were retained. |
| React/TypeScript production build | Verified complete | `npm run build` passes; route JavaScript chunks are below 500 kB. The logo PNG is about 1.0 MB. |
| Repository lint | Verified complete | `npm run lint` passes after the current changes. |
| Profile input validation unit tests | Verified complete | `npm test -- --reporter=verbose`: 11 URL/schema validation tests pass. |
| Dependency vulnerability scan | Partial | A non-forced `npm audit fix` patched React Router to 7.18.4; `npm audit` still reports 11 advisories (6 moderate, 5 high) through Firebase's nested `@grpc/grpc-js`/`undici` dependencies. `npm audit fix --force` proposes downgrading Firebase to 9.14.0 and was not run. |
| Registration, login, auth restore, logout, password reset | Partial | Firebase SDK flows and error/loading handling exist; no Firebase emulator integration tests or live Firebase verification were run. |
| 18+ eligibility | Partial | Registration requires a stored adult self-attestation. This is not independent age verification and requires owner/legal review. |
| Profile create/view/edit persistence | Partial | Owner-only Firestore/local compatibility paths and an edit route are implemented; emulator-backed and cross-device end-to-end tests remain absent. |
| Firebase auth/profile error states | Partial | Profile status is checked against Firestore during login/auth restore; Firebase/network behavior has not been exercised against an emulator. |
| Firestore privacy and validation rules | Partial | Rules now validate identity/profile schemas and keep profiles owner-readable. Rules have not been tested in an emulator or deployed. |
| Cloud Storage | Blocked | Upload UI is unavailable and repository rules deny all Storage access. Owner must approve billing/setup and a tested upload/removal flow before enabling it. |
| Discovery/search | Missing | The screen/service is empty. Profiles are deliberately private, so public discovery cannot be implemented safely until a separate public-profile/privacy schema and tested query rules are approved. |
| Likes, passes, mutual matches | Blocked | No service exists. Secure mutual matching needs trusted server logic or a formally tested authorization design; no Cloud Functions/backend is configured. |
| Blocking/reporting/moderation | Blocked | No UI or service exists; collection rules deny client access. A trusted moderation, escalation, and retention design is required before discovery or messaging. |
| Messaging/notifications | Blocked | Screens are empty. No trusted match validation, conversation schema, unread/notification backend, or rules tests exist. |
| Premium subscriptions | Blocked | Product scope, pricing, provider, trusted entitlement backend, credentials, and billing approval are unresolved. |
| Portfolio/networking | Partial | Profile fields and safe HTTP(S)-normalized external links are implemented; featured work, collaboration requests, and networking flows are not. |
| Legal/support documents and account lifecycle | Blocked | Terms, privacy/safety content, support routing, account deletion, retention, and incident handling need owner/legal decisions and trusted cleanup logic. |
| Release readiness | Blocked | No emulator rules suite, moderation/messaging implementation, legal review, Firebase deployment verification, monitoring, or owner-approved launch configuration. |
| Capacitor | Deferred | Mobile expansion is intentionally out of scope until the web release gates pass. |

## Phase 0 — Repository audit and execution plan

- [x] Inspect branch, working tree, source tree, scripts, Firebase config, rules, and available tests.
- [x] Preserve pre-existing profile edits.
- [x] Run baseline lint/build. Baseline lint and build were blocked by errors in the pre-existing dirty `Profile.tsx`; current lint/build pass.
- [x] Continue into implementation after the audit.
- [x] Add this evidence-based status matrix and keep unresolved items visible.

## Phase 1 — Core reliability and account lifecycle

- [x] Make Firebase initialization a cached singleton, reject partial configuration clearly, and retry initialization after failure.
- [x] Keep Storage optional during Firebase initialization; avoid silently switching to LocalStorage after configured Firestore failures.
- [x] Check profile completion from the signed-in user's Firestore profile on login and auth restore.
- [x] Add auth-listener cleanup when route components unmount before initialization finishes.
- [x] Implement Firebase password-reset delivery, prevent duplicate auth submissions, and wire logout.
- [x] Require an explicit 18+ self-attestation at registration and persist it with server timestamps.
- [x] Add profile schema/URL validation and server-side rule validation for owner writes.
- [x] Add profile editing and loading/error/retry feedback.
- [ ] Run emulator-backed registration, login, logout, auth restore, reset, onboarding, profile create/edit, offline, and unauthorized-access tests.
- [ ] Verify the adult eligibility policy with the owner/legal reviewer; self-attestation is not age verification.
- [ ] Implement a trusted account deletion and recovery flow.

## Phase 2 — Data model, security, and privacy foundation

- [x] Restrict profile document reads to their owner until a safe public-profile model exists.
- [x] Validate user/profile document fields, types, sizes, and ownership in Firestore rules.
- [x] Deny client access to incomplete likes, matches, conversations, messages, notifications, subscriptions, reports, and blocks.
- [x] Deny all Storage access until setup and upload safety are owner-approved.
- [x] Add an empty Firestore indexes manifest; no application query currently requires a composite index.
- [ ] Validate Firestore and Storage rules with Firebase Emulator Suite tests.
- [ ] Design separate public/private profile data and explicit discoverability/privacy preferences.
- [ ] Define schema evolution, production indexes, rate limits, moderation access, retention, and cross-collection account deletion.
- [ ] Do not deploy rules or alter production Firebase configuration without explicit approval.

## Phase 3 — Profile completion and media

- [x] Keep nickname, gender option, industry/category, category-specific roles, bio, an entered city/selected US state or territory, portfolio/social links, and connection preferences in the profile flow.
- [x] Normalize external profile links to HTTP(S), reject other schemes, preserve the creation timestamp while editing, and validate field sizes.
- [x] Implement owner profile editing and a saved-profile view.
- [ ] Add emulator-backed legacy-schema, validation, update, and privacy tests.
- [ ] Enable optional image uploads only after owner approval and Storage setup/billing review.
- [ ] Before enabling uploads, add MIME/content validation, file-size/path restrictions, progress/retry/removal UX, and tested Storage rules.
- [ ] Keep only city/region the user elects to provide; do not collect or expose a precise home location.

## Phase 4 — Creative discovery and search

- [ ] Create a dedicated public profile projection that excludes email, auth metadata, precise location, private settings, and moderation fields.
- [ ] Add discovery eligibility, discoverability controls, self/block exclusions, category/role/region/intent filters, and privacy tests.
- [ ] Use deterministic ordering, bounded query pages, deduplication, and retry/empty/error states.
- [ ] Add profile detail navigation without exposing private profile documents.
- [ ] Generate/document required Firestore indexes only for implemented queries.
- **Gate:** Do not expose discovery until the public/private schema, rules, and block exclusions pass emulator tests.

## Phase 5 — Likes, matching, and interaction state

- [ ] Persist like/pass state with idempotent actions, duplicate protection, and account/block checks.
- [ ] Create matches only for mutual interest using trusted server logic or an emulator-tested authorization design.
- [ ] Prevent clients from forging matches or acting for other users.
- [ ] Add match list/detail and new-match notification flows.
- [ ] Test duplicates, concurrency/races, retries, blocking, deletion, and unauthorized access.
- **Gate:** No match UI should claim success until trusted persistence and authorization work end to end.

## Phase 6 — Messaging and notifications

- [ ] Create conversations only for verified matches or another owner-approved connection type.
- [ ] Enforce participant-only conversation/message reads and writes in backend rules/trusted logic.
- [ ] Add real-time messages, bounded history, size validation, timestamps, sender validation, retries, and empty/error states.
- [ ] Add block/report controls from profile, match, and conversation surfaces.
- [ ] Add unread state and in-app notifications; defer push until platform/privacy approval.
- [ ] Define unmatched/deleted/blocked account and abuse handling.
- [ ] Test authorization, persistence, block enforcement, pagination, and notification behavior.

## Phase 7 — Safety, trust, and moderation

- [ ] Implement categorized report submission with optional details, confirmation, and restricted access.
- [ ] Implement block/unblock and enforce it in discovery and messaging at the backend.
- [ ] Provide trusted admin/moderation authorization; never trust a client-set admin flag.
- [ ] Obtain owner/legal-reviewed community guidelines, terms, privacy policy, safety guidance, and support/contact content.
- [ ] Define abuse/rate limiting, report escalation, retention, deleted-account behavior, and incident response.
- [ ] Test that report content is private and blocking has immediate server-enforced effects.
- **Gate:** No public launch before blocking/reporting/moderation and reviewed safety/legal content are ready.

## Phase 8 — Premium subscriptions

- [ ] Confirm premium features, pricing, free-tier boundaries, trial, cancellations, and refunds with the owner.
- [ ] Select an approved payment provider and trusted webhook/entitlement architecture.
- [ ] Add status, purchase/restore/cancel, expiration/failure handling only after provider decisions and credentials.
- [ ] Never accept a client-controlled subscription flag or create live products/charges without approval.
- [ ] Document mobile-store requirements before any Capacitor subscription work.

## Phase 9 — Portfolio and networking tools

- [x] Display validated portfolio/social links without embedding arbitrary third-party content.
- [ ] Add real featured creative work and collaboration context with persistence, privacy, rules, and tests.
- [ ] Consider saved profiles or collaboration requests only after discovery/matching foundations.
- [ ] Distinguish professional networking from dating intent in preferences and interaction flows.

## Phase 10 — Quality, accessibility, and performance

- [x] Add focused profile validation unit tests and a repeatable Vitest command.
- [x] Add route-level lazy loading and replace the global city dataset with a local state/territory list plus a city input.
- [ ] Add integration/rules tests for critical auth/profile journeys using emulators.
- [ ] Review keyboard-only navigation, labels, focus visibility, mobile breakpoints, loading/empty/error states, and network retry UX.
- [x] Confirm route splitting and city-dataset removal keep all generated JavaScript chunks below the build warning threshold.
- [ ] Inspect browser console and failed network requests in a real/emulated browser flow.
- [ ] Resolve the remaining Firebase transitive dependency advisories without an unreviewed breaking downgrade; assess actual shipped runtime exposure.
- [x] Confirm `.env` is ignored and `.env.example` contains placeholders only.

## Phase 11 — Release readiness and deployment

- [x] Document local setup, env variables, emulator ports, current data model, and implemented limitations in `README.md`.
- [x] Document a production launch/rollback checklist without deploying or changing production.
- [ ] Owner: configure a non-production Firebase project, Authentication providers/domains, Firestore rules, indexes, monitoring, and backups.
- [ ] Owner: approve Storage/billing setup only if uploads are in launch scope.
- [ ] Owner/legal: review age assurance, privacy/terms/safety documents, support, data retention, and account deletion.
- [ ] Pass auth/profile journeys and rules tests; finish blocking/reporting before public release.
- [ ] Confirm no known critical/high security issues, billing readiness, rollback owner, and deployment approval.
- **Gate:** No deploy, migration, production Firebase change, or release without explicit owner approval.

## Phase 12 — Capacitor mobile expansion

- [ ] Defer until the web product is stable and release-ready.
- [ ] Audit mobile routing, safe areas, keyboard interaction, camera/gallery permissions, and uploads when approved.
- [ ] Add Capacitor configuration/platforms only after owner authorization; verify iOS/Android builds on appropriate tooling.
- [ ] Review current Apple/Google policies for dating, user content, subscriptions, account deletion, privacy, and safety.

## Immediate next steps

1. Owner: choose/configure a dedicated Firebase Emulator/local project and run auth/profile flows plus Firestore rules tests; do not point tests at production.
2. Owner/legal: confirm the 18+ assurance approach and approve safety, privacy, support, retention, and deletion requirements.
3. Engineering: design the public/private profile and trusted interaction backend before starting discovery, matching, blocking, or messaging.
