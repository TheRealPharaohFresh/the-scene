# The Scene — Product & Engineering Roadmap

**Product:** The Scene — Connecting Entertainment Creatives
**Platform:** React, TypeScript, Vite, React Router, Firebase Authentication, Cloud Firestore
**Mobile:** Capacitor is deferred until the web product is stable and release-ready
**Last audited:** 2026-10-17

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
| React/TypeScript production build | Verified complete | `npm run build` passes after the Firestore optional-field fix; route JavaScript chunks are below 500 kB. The logo PNG is about 1.0 MB. |
| Repository lint | Verified complete | `npm run lint` passes after the current changes. |
| Profile input validation unit tests | Verified complete | `npm test -- --reporter=verbose`: 11 URL/schema validation tests pass. |
| Dependency vulnerability scan | Partial | A non-forced `npm audit fix` patched React Router to 7.18.4. Full audit reports 12 advisories (6 moderate, 6 high), including a test-only rules-unit-testing finding; production-only audit remains 11 (6 moderate, 5 high) through Firebase's nested `@grpc/grpc-js`/`undici`. `npm audit fix --force` proposes downgrading Firebase to 9.14.0 and was not run. |
| Registration, login, auth restore, logout, password reset | Partial | Emulator tests pass for registration, attestation persistence, login/logout, auth restore, profile create/update/reload, and reset-email request. Browser journeys, offline/error paths, reset-link completion, and live Firebase remain unverified. |
| 18+ eligibility | Partial | Registration requires a stored adult self-attestation. Owner selected to keep launch blocked until legal review; this is not independent age verification. |
| Profile create/view/edit persistence | Partial | Owner-only persistence and editing are implemented; emulator tests cover create/update/reload but not legacy schemas, browser UI, or cross-device production behavior. |
| Firebase auth/profile error states | Partial | Auth/profile core emulator flows pass. Offline, invalid-credential, and network failure behavior still need coverage. |
| Firestore and Storage privacy/validation rules | Partial | Seven Firestore/Storage rules tests pass locally, including owner privacy, schema validation, immutable ownership/creation, denied social writes, and deny-all uploads. Nothing has been deployed. |
| Cloud Storage | Blocked | Upload UI is unavailable and repository rules deny all Storage access. Owner must approve billing/setup and a tested upload/removal flow before enabling it. |
| Discovery/search | Missing | The screen/service is empty. Profiles are deliberately private, so public discovery cannot be implemented safely until a separate public-profile/privacy schema and tested query rules are approved. |
| Likes, passes, mutual matches | Blocked | No service exists. Firebase Cloud Functions 2nd-gen callable functions are the recommended evaluation target for authenticated commands; no Functions backend is configured or deployed. |
| Blocking/reporting/moderation | Blocked | No UI or service exists; collection rules deny client access. A trusted moderation, escalation, and retention design is required before discovery or messaging. |
| Messaging/notifications | Blocked | Screens are empty. No trusted match validation, conversation schema, unread/notification backend, or rules tests exist. |
| Founding 2,000 membership cap and review queue | Planned (Phase 7A) | Specified only; nothing implemented. Needs the trusted-backend/billing decision, admin authorization, and answers to the open policy questions before work starts. |
| Premium subscriptions | Blocked | Product scope, pricing, provider, trusted entitlement backend, credentials, and billing approval are unresolved. |
| Portfolio/networking | Partial | Profile fields and safe HTTP(S)-normalized external links are implemented; featured work, collaboration requests, and networking flows are not. |
| Legal/support documents and account lifecycle | Blocked | Terms, privacy/safety content, support routing, account deletion, retention, and incident handling need owner/legal decisions and trusted cleanup logic. |
| Release readiness | Blocked | Browser UI/offline tests, account deletion, moderation/messaging implementation, legal review, Firebase deployment verification, monitoring, and owner-approved launch configuration remain outstanding. |
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
- [x] Run emulator-backed registration, login, logout, auth restore, reset-email request, profile create/update/reload, and self-attestation persistence tests.
- [ ] Test onboarding UI, reset-link completion, invalid credentials, offline/network failure, and browser unauthorized-access behavior.
- [x] Add isolated Firestore/Storage rule-test cases using the `demo-the-scene` emulator project ID.
- [x] Run the Auth/profile and Firestore/Storage emulator suites using the isolated `demo-the-scene` project ID.
- [ ] Verify the adult eligibility policy with the owner/legal reviewer; self-attestation is not age verification.
- [ ] Implement a trusted account deletion and recovery flow.

## Phase 2 — Data model, security, and privacy foundation

- [x] Restrict profile document reads to their owner until a safe public-profile model exists.
- [x] Validate user/profile document fields, types, sizes, and ownership in Firestore rules.
- [x] Deny client access to incomplete likes, matches, conversations, messages, notifications, subscriptions, reports, and blocks.
- [x] Deny all Storage access until setup and upload safety are owner-approved.
- [x] Add an empty Firestore indexes manifest; no application query currently requires a composite index.
- [x] Validate the checked-in Firestore and Storage rules with Firebase Emulator Suite tests.
- [x] Design separate public/private profile data and explicit discoverability/privacy preferences (`publicProfiles` with an owner opt-in `discoverable` flag; covered by rules tests). Remaining: per-field visibility controls.
- [ ] Define schema evolution, production indexes, rate limits, moderation access, retention, and cross-collection account deletion.
- [ ] Do not deploy rules or alter production Firebase configuration without explicit approval.

## Phase 3 — Profile completion and media

- [x] Keep nickname, gender option, industry/category, category-specific roles, bio, an entered city/selected US state or territory, portfolio/social links, and connection preferences in the profile flow.
- [x] Normalize external profile links to HTTP(S), reject other schemes, preserve the creation timestamp while editing, and validate field sizes.
- [x] Implement owner profile editing and a saved-profile view.
- [ ] Add emulator-backed legacy-schema migration tests; update, validation, and privacy coverage is present in the current emulator suites.
- [x] Built photo uploads (main + 5 extras): client resize, MIME/size/path-restricted Storage rules with emulator tests, add/remove/reorder UX, swipe-card carousel, fullscreen viewer, profile gallery.
- [ ] Enable live uploads: owner enables Blaze + Storage (us-central1/us-west1/us-east1), then deploy Storage rules and test live.
- [ ] Photo moderation: currently shown immediately with report; consider review/automated checks (needs Cloud Functions).
- [ ] Keep only city/region the user elects to provide; do not collect or expose a precise home location.

## Phase 4 — Creative discovery and search

- [x] Create a dedicated public profile projection that excludes email, auth metadata, precise location, private settings, and moderation fields.
- [ ] Add discovery eligibility, discoverability controls, self/block exclusions, category/role/region/intent filters, and privacy tests. Done: opt-in control, self exclusion, category/role/state/intent filters, rules tests. Also done: swipe-card landing screen, private like/pass records, per-field sharing, member detail pages, client-side block exclusion. Remaining: trusted block enforcement and browser UI tests.
- [x] Use deterministic ordering, bounded query pages, deduplication, and retry/empty/error states.
- [ ] Add profile detail navigation without exposing private profile documents.
- [ ] Generate/document required Firestore indexes only for implemented queries.
- **Gate:** Do not expose discovery until the public/private schema, rules, and block exclusions pass emulator tests.

## Phase 5 — Likes, matching, and interaction state

- [x] Evaluate Firebase Cloud Functions 2nd-gen callable functions as the candidate trusted backend: [callable requests carry Firebase Auth context](https://firebase.google.com/docs/functions/callable) and can integrate [App Check](https://firebase.google.com/docs/app-check/cloud-functions), and the local emulator supports pre-deployment testing. Admin SDK writes must enforce authorization in function code rather than relying on client Firestore rules. This is not approval to deploy or incur cost.
- [ ] Persist like/pass state with idempotent actions, duplicate protection, and account/block checks.
- [ ] Create matches only for mutual interest using trusted server logic or an emulator-tested authorization design.
- [ ] Design callable handlers to require an authenticated caller, validate payload and eligibility, apply block checks, and perform interest/match changes transactionally; keep direct client writes denied and return only safe public data.
- [ ] Decide App Check, rate limits/abuse controls, region, cost/billing, and owner approval before implementing or deploying Functions.
- [ ] Prevent clients from forging matches or acting for other users.
- [ ] Add match list/detail and new-match notification flows.
- [ ] Test duplicates, concurrency/races, retries, blocking, deletion, and unauthorized access.
- **Gate:** No match UI should claim success until trusted persistence and authorization work end to end; no remote Functions deployment without explicit billing and deployment approval.

## Phase 6 — Messaging and notifications

- [ ] Create conversations only for verified matches or another owner-approved connection type.
- [ ] Enforce participant-only conversation/message reads and writes in backend rules/trusted logic.
- [ ] Add real-time messages, bounded history, size validation, timestamps, sender validation, retries, and empty/error states.
- [ ] Add block/report controls from profile, match, and conversation surfaces.
- [ ] Add unread state and in-app notifications; defer push until platform/privacy approval.
- [ ] Define unmatched/deleted/blocked account and abuse handling.
- [ ] Test authorization, persistence, block enforcement, pagination, and notification behavior.

## Mobile responsiveness (done, emulated)

All screens were checked for horizontal overflow at 360×780, 393×852, 402×874, 412×923, 440×956 and 320×640 (current Android/iPhone sizes plus a small stress size). Uses `100dvh`, safe-area insets, 16px inputs and 44px touch targets. Still open: real-device testing (iOS Safari, Android Chrome) and landscape/tablet review.

## Phase 7 — Safety, trust, and moderation

> Status note: an admin review screen now exists for reports, business applications and listings (admins are owner-seeded in the console). A first community forum (threads, groups, events with RSVP-gated addresses) shipped with write-only `reports` and private `blocks`. Still required: an admin review/moderation tool with trusted authorization, report triage and retention, rate limiting/abuse controls, and legal/safety content for in-person meetups.

- [ ] Implement categorized report submission with optional details, confirmation, and restricted access.
- [ ] Implement block/unblock and enforce it in discovery and messaging at the backend.
- [ ] Provide trusted admin/moderation authorization; never trust a client-set admin flag.
- [ ] Obtain owner/legal-reviewed community guidelines, terms, privacy policy, safety guidance, and support/contact content.
- [ ] Define abuse/rate limiting, report escalation, retention, deleted-account behavior, and incident response.
- [ ] Test that report content is private and blocking has immediate server-enforced effects.
- **Gate:** No public launch before blocking/reporting/moderation and reviewed safety/legal content are ready.

### Phase 7A — Founding 2,000 Membership Capacity and Registration Review Queue

**Status: planned, not implemented.** Nothing below exists in the app, rules, or backend. This section is planning only; no cap, queue, status field, rule change, migration, or deployment is made by it.

**Where it fits.** It needs a trusted backend (the Phase 5 Cloud Functions decision) and trusted admin authorization (Phase 7), and it controls who may use Phase 4 discovery and Phase 5/6 features. Implement it **before public launch and before opening registration beyond a closed test group**, and after the trusted-backend, billing, and admin-authorization decisions. It should not start until the Phase 1 browser/offline checks are done.

**Depends on (existing work):**
- Registration, `users/{uid}` self-attestation document, and the auth-state listener (`src/features/auth/authService.ts`).
- Profile completion (`profiles/{uid}`, `markProfileComplete`, `hasCompletedProfile`) and `ProtectedRoute` / `HomeRedirect` routing.
- Discovery eligibility (`publicProfiles/{uid}` and its `discoverable` flag, Phase 4). Pending and rejected applicants must never be readable there.
- Phase 5 trusted-backend decision (callable Functions, App Check, billing approval) and Phase 7 trusted admin authorization (custom claims set server-side; never a client-set admin flag).

**A. Capacity and membership definition**
- [ ] Initial capacity is 2,000 **approved** members who completed registration and the required profile. Registration attempts, or accounts that authenticated but have no completed profile, do not count.
- [ ] Define the single point at which membership is confirmed (proposed: the trusted backend marks the application `approved` after profile completion and consumes one place) and use it identically in registration, profile creation, and approval.
- [ ] Capacity is stored server-side, defaults to 2,000, and is changeable only by authorized administrators. No public or user-writable setting.

**B. After capacity is reached**
- [ ] Applicants can still register and submit the profile (existing auth and validation apply) but do not become approved.
- [ ] Completed applications go to a persistent review queue with `pending_review` status.
- [ ] Show the confirmation copy below, stating that capacity is reached, the application will be reviewed, and acceptance is not guaranteed.
- [ ] Keep submitted data so applicants do not re-enter it.
- [ ] Pending/rejected applicants are excluded from discovery, search, matching, and messaging by **Firestore rules and backend checks**, not only by hidden UI.

**C. Default applicant copy** (store centrally, e.g. one config module or document, so it can change without touching the registration flow):

> **Welcome to The Scene — Your Application Is Under Review**
>
> Thank you for your interest in joining The Scene, a community built to connect entertainment industry creatives, foster collaboration, and create meaningful connections.
>
> We've reached our initial membership capacity of 2,000 approved members. You can still submit your profile for consideration.
>
> Our team will review your application to determine whether your background, interests, and goals align with The Scene community. If your application is approved, you'll receive an update with instructions on how to access your membership.
>
> Submission does not guarantee acceptance. We appreciate your interest and thank you for your patience while we review applications.
>
> The Scene Team
>
> Your people. Your vision. Your scene.

**D. Statuses** — one validated status field on the existing account/profile model (extend `users/{uid}`; do not add a parallel lifecycle):

| Status | Meaning | Allowed |
| --- | --- | --- |
| `profile_incomplete` | Authenticated, profile not finished | Complete or edit own profile only |
| `pending_review` | Complete; awaiting a decision (capacity full) | See own status page, edit own application |
| `approved` | Counts toward capacity | Full member features, subject to other rules |
| `rejected` | Reviewed and declined | See own status page only; no member access |

- [ ] Permitted transitions: `profile_incomplete` → `pending_review` or `approved` (by trusted backend only); `pending_review` → `approved` or `rejected` (admin only); `rejected` → `approved` only by a later authorized decision. Clients can never set status.
- [ ] Applicants see respectful status messaging; internal moderation notes are never exposed to them.

**E. Admin review queue**
- [ ] Secure admin-only interface to view pending applications, inspect the profile information needed, approve or reject, and see capacity and pending counts.
- [ ] Record the decision, timestamp, and reviewing admin for each decision.
- [ ] Notify applicants when status changes. In-app status only until an email/push provider is chosen and configured; do not promise email, SMS, or push.
- [ ] Admin controls and routes must not be visible or callable by ordinary members.

**F. Capacity enforcement and concurrency**
- [ ] Enforce the cap in the trusted backend with a Firestore transaction on a single authoritative counter (or equivalent reservation), never from React state, local storage, or a client counter.
- [ ] Simultaneous registrations must never approve more than the configured capacity.
- [ ] Define how a place is counted, reserved or consumed on approval, and how abandoned or failed profile creation is released. Counting happens at confirmed approval, not at sign-up.
- [ ] Decide idempotency and retry behavior so a repeated request cannot consume two places.

**G. Data model and rules (to be designed after re-inspecting the repo at implementation time)**
- [ ] Minimum additions: authoritative capacity/count document, application status and timestamps on `users/{uid}`/`profiles/{uid}`, admin decision records, and applicant status notifications.
- [ ] Firestore rules: clients cannot write status, capacity, or decision fields; only the owner can read their own status; admins via server-set claims only. No secrets or privileged credentials in the frontend.
- [ ] Existing profile write rules and the discovery projection must be updated so non-approved members cannot become discoverable.

**H. App integration**
- [ ] Route guards and `HomeRedirect` send `pending_review` and `rejected` users to an application-status page, not the member dashboard; approved first-login and returning users keep today's flow.
- [ ] Profile creation (`CreateProfile`), auth-state listener, and dashboard read status from the same source.

**Open policy decisions (settle before the dependent behavior is built):**
1. Is the 2,000 cap permanently fixed, or can an administrator expand it?
2. Does an approved member who deletes their account or leaves free a place?
3. Can a rejected applicant appeal or reapply?
4. Are applications reviewed strictly in submission order, or can admins prioritize?
5. How long are pending and rejected applications retained?
6. What happens if someone registers while a place is available but never completes the profile?
7. What happens if an approved member's profile later becomes incomplete?
8. What privacy and retention requirements apply to submitted application data?

**Implementation order:**
1. Confirm current registration, profile-completion, auth, and route-guard behavior (finish Phase 1 browser checks).
2. Define lifecycle and capacity-counting rules (answer the open questions).
3. Design the data model and trusted enforcement mechanism (needs Phase 5 backend/billing decision).
4. Implement concurrency-safe capacity enforcement.
5. Integrate the queue with registration and profile creation.
6. Add pending, approved, and rejected experiences.
7. Build secure admin review tools.
8. Add in-app applicant status notifications.
9. Test concurrency, security, privacy, and every lifecycle transition against emulators.
10. Update documentation and prepare for release.

**Acceptance criteria:**
- Exactly the configured capacity of members can be approved even under simultaneous requests (emulator concurrency test).
- A non-admin, pending, or rejected user cannot read or write status, capacity, other applicants, or discovery data (rules tests).
- Approved members' existing sign-in, profile, and discovery flows are unchanged.
- Pending and rejected users land on the status page after login.
- Every decision records reviewer and timestamp, and status transitions outside the table above are rejected.
- **Gate:** do not enable the cap or queue, change production rules, or deploy backend code without explicit owner approval.

## Phase 8 — Premium subscriptions

- [ ] Confirm premium features, pricing, free-tier boundaries, trial, cancellations, and refunds with the owner.
- [ ] Select an approved payment provider and trusted webhook/entitlement architecture.
- [ ] Add status, purchase/restore/cancel, expiration/failure handling only after provider decisions and credentials.
- [ ] Never accept a client-controlled subscription flag or create live products/charges without approval.
- [ ] Document mobile-store requirements before any Capacitor subscription work.

### Monetization plan (owner-provided; prices are test hypotheses, not market rates)

Order of priority, easiest/lowest-infrastructure first within each tier:

1. **Premium membership, $10.99/mo** (this phase): advanced searches, profile customization, more networking/messaging, analytics/visibility tools, exclusive opportunities. Free tier must stay genuinely useful.
2. **Business/recruiter accounts** (test $49 / $99 / $199 per month): talent discovery, saved searches, casting listings, team access. Requires business verification.
3. **Paid casting calls and job listings** (test $19 standard, $49 featured, $99+ monthly package): requires listing review to block fake casting calls and scams.
4. **Profile boosts / featured placement** (test $3.99 24h, $9.99 7d, $19.99 creator of the week): paid placements must be clearly labelled; never promise jobs.
5. **Sponsorships and events/workshops**: sponsored opportunities, featured events, paid workshops.
6. **Marketplace commissions** (e.g. 10% of verified-service bookings): needs payments, disputes and fraud handling.
7. **Advertising** (AdMob/AdSense): only after traffic grows.

Illustrative model only (not a forecast): 200 members + 25 businesses + 40 listings + boosts ≈ $6,133/mo before fees, taxes and refunds.

Rollout: build community → premium → business accounts/listings → boosts/sponsors → marketplace. Safety rules: verification and fraud prevention before paid listings; entitlements are set only by a trusted backend, never by the client.

Implementation status (no billing needed, done): plan definitions, feature-gate helper and Premium page (billing off); business-account applications with manual admin approval; casting/job listings hidden until admin approval; admin review screen for businesses, listings and reports; owner-seeded `admins/{uid}` authorization (console-only writes). Still blocked: real charging (provider choice, Blaze billing, owner approval), subscription entitlements, boosts, paid listings, verification beyond manual review, applicant messaging.

**Owner action to enable review:** in the Firebase console, create a Firestore document `admins/<your-uid>` (any field, e.g. `note: "owner"`). Your uid is shown in Authentication > Users.

## Phase 9 — Portfolio and networking tools

- [x] Display validated portfolio/social links without embedding arbitrary third-party content.
- [ ] Add real featured creative work and collaboration context with persistence, privacy, rules, and tests.
- [ ] Consider saved profiles or collaboration requests only after discovery/matching foundations.
- [ ] Distinguish professional networking from dating intent in preferences and interaction flows.

## Phase 10 — Quality, accessibility, and performance

- [x] Add focused profile validation unit tests and a repeatable Vitest command.
- [x] Add route-level lazy loading and replace the global city dataset with a local state/territory list plus a city input.
- [x] Add and pass emulator integration/rules tests for critical Auth/profile and Firestore/Storage authorization paths.
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
- [ ] Decide whether the Founding 2,000 cap and review queue (Phase 7A) must be in place before public registration opens; if so, it is a release blocker.
- [ ] Confirm no known critical/high security issues, billing readiness, rollback owner, and deployment approval.
- **Gate:** No deploy, migration, production Firebase change, or release without explicit owner approval.

## Phase 12 — Capacitor mobile expansion

- [ ] Defer until the web product is stable and release-ready.
- [ ] Audit mobile routing, safe areas, keyboard interaction, camera/gallery permissions, and uploads when approved.
- [ ] Add Capacitor configuration/platforms only after owner authorization; verify iOS/Android builds on appropriate tooling.
- [ ] Review current Apple/Google policies for dating, user content, subscriptions, account deletion, privacy, and safety.

## Immediate next steps

1. Engineering: add browser UI coverage for onboarding and profile edit, complete reset-link testing, and exercise invalid-credential/offline/network failure states against emulators.
2. Owner/legal: confirm the 18+ assurance approach and approve safety, privacy, support, retention, and deletion requirements; until then, self-attestation is not launch approval.
3. Owner: answer the eight open policy questions in Phase 7A (Founding 2,000 membership cap and review queue) so it can be scheduled.
4. Engineering/owner: design the public/private profile model and authenticated callable contracts before starting discovery, matching, blocking, or messaging. Decide App Check, abuse controls, region, billing, and deployment approval before any remote Functions setup.
