# The Scene 🎬🎵

## Connecting entertainment creatives

The Scene is an early-stage web app for adults in the entertainment industry. Its current implemented scope is account registration/sign-in, a first-party profile onboarding/view/edit flow, opt-in member discovery with filters, and a protected dashboard. It is not yet a dating/matching or messaging product: those screens/services are absent.

## Current capabilities and limitations

- **Implemented foundation:** core email/password auth flows, profile onboarding/view/edit, owner-only profile persistence/rules, and input validation. **Locally verified:** production build, lint, 11 focused unit tests, Auth/profile emulator flows, and Firestore/Storage rule tests.
- **Not done:** browser UI end-to-end tests, offline/error-path verification, public discovery, likes/matching, blocking/reporting/moderation, messaging/notifications, account deletion, legal/support content, and production deployment. See [`ROADMAP.md`](./ROADMAP.md) for the phase-by-phase checklist and launch gates.
- Firebase email/password registration and login.
- Registration requires a self-attestation that the user is at least 18. This is **not** identity or age verification; launch remains blocked pending owner/legal approval.
- Firebase auth-state restore, profile-completion lookup, sign-out, and Firebase password-reset email flow.
- Profile create, view, and edit for nickname, gender option, entertainment category/roles, bio, optional entered city/selected US state or territory, portfolio/social URLs, and connection preferences.
- Profile URL input is normalized to HTTP(S); unsafe protocols are rejected. Profile saves validate ownership and bounded field lengths.
- Firestore is the primary profile store when configured. Firestore errors are shown instead of being presented as successful LocalStorage saves. LocalStorage is only a compatibility fallback when Firebase is not configured.
- Photos: members can add a main photo plus up to 5 extras (6 total) in Edit Profile. Images are resized in the browser (max 1280px, JPEG, under 1 MiB, EXIF stripped). Discover cards show a tap-through carousel with a fullscreen viewer, and profile pages show a gallery. Photos appear immediately (no review); members can report them. Storage rules allow only owner-created `users/<uid>/photos/*` files and signed-in reads. **Live uploads stay off until Storage is enabled (requires the Blaze plan) and `firebase deploy --only storage,firestore` is run.** Verified with emulator rules tests only; abandoned uploads may leave orphaned files.
- Private profiles (`profiles/{uid}`) are readable only by their owner. Members who opt in (a "Let other members find me in Discover" checkbox on the profile form) also get a `publicProfiles/{uid}` copy limited to nickname, category, roles, bio, city/state, and connection preferences. Rules require it to mirror the private profile, and any signed-in member can read it only while `discoverable` is true. Per-field sharing: the owner picks which of bio, city, looking-for, and portfolio/social links are shared (`shared` list on the public doc); unshared fields are written blank and the rules enforce this. Email and gender never leave the private profile. Profiles saved before discovery stay hidden until the owner re-saves and opts in.
- Discover (`/discover`) is the post-login landing screen: opted-in members appear as swipeable cards (drag, ♥/✕ buttons, or ←/→ keys) with a bottom bar for Discover, Community, My profile, and Log out. “View profile” on a card opens a detail page (`/members/:id`) with the member's shared fields, Like/Pass, Report, and Block. Likes/passes are saved privately in `swipes/{uid}/items/{targetId}` (owner-only) and swiped members are not shown again; mutual likes create a match (see below). Collapsible category, role, state, and looking-for filters, paged 12 at a time, with loading/empty/error/retry states. Blocked members are excluded client-side (blocks are private; enforcement is soft until a trusted backend exists). Relevance ranking is not implemented. Discover queries order by document ID and need no composite index; the looking-for filter and self-exclusion run in the client.
- Community (`/forum`, `/forum/threads/:id`, `/groups/:id`): open Q&A threads with replies, groups (anyone can join/leave; the owner cannot leave), group-only posts, and group events (music video, film shoot, etc.) with going/maybe/can't-go RSVPs. An event's exact address is in a separate `private/details` doc readable only by the host and members who RSVP “going”. Author names are verified against the author's profile by the rules. Members can report threads, replies, groups, events, and members (`reports`, write-only) and block members (`blocks/{uid}/items`). Reports are reviewed on the admin screen by owner-seeded admins. No edit, image upload, pagination beyond 25 threads/50 groups, or notifications yet.
- Mobile layout: the app is responsive and checked for no horizontal overflow on pages at 360×780 (Galaxy S25), 393×852 (iPhone 16), 402×874 (iPhone 17), 412×923 (Pixel 10), 440×956 (iPhone 17 Pro Max), and a 320×640 stress size. It uses `100dvh`, safe-area insets (`viewport-fit=cover`), 16px inputs (no iOS zoom), and 44px touch targets. These are emulated viewports, not real-device tests.
- Opportunities (`/opportunities`, `/business`, `/admin`): businesses (labels, agencies, studios, production companies) apply for an account; an admin approves it by hand; approved businesses post casting calls/jobs that stay hidden until an admin approves each listing. Members browse approved listings by category and can report them. Admins are users with a `admins/{uid}` document that **only the project owner can create in the Firebase console** (the rules deny all client writes), so there is no client-set admin flag. The `/admin` screen lists pending businesses, pending listings, and member reports (approve/reject/dismiss). No payments: listings are free until billing exists, and there is no applicant messaging yet.
- Premium (`/premium`): plan definitions and a feature-gate helper (`src/services/plans.ts`) plus an upgrade page. Billing is off (`BILLING_LIVE=false`): everyone is on Free and the button charges nothing. Real entitlements need a payment provider and a trusted backend (ROADMAP Phase 8).
- Matches and chat (`/matches`, `/chat/:matchId`): when two members have both liked each other, the second liker's client creates `matches/{uidA_uidB}` (ids sorted). **The Firestore rules, not a backend, verify both private swipes are likes and that neither member blocked the other**, so matches can't be forged. Members chat in real time in `matches/{id}/messages` (members only, 2000 chars, no edit/delete, sender verified). Unread state uses `matches/{id}/reads/{uid}`; the bottom nav shows an unread/new-match badge (in-app only). Caveats: a member who liked first sees the match the next time they open Chats, not instantly; there is no unmatch, image sharing, or message reporting UI beyond reporting/blocking the member. **Push/email notifications are not implemented** (they need Cloud Functions on Blaze). Conversations and subscriptions rules stay closed.
- Firebase Cloud Functions is the selected candidate for trusted-backend evaluation, but no Functions code or deployment is configured.
- No account deletion, terms/privacy/community-guideline/support pages, moderation workflow, or production deployment is implemented.
- Capacitor is deferred.

See [`ROADMAP.md`](./ROADMAP.md) for the audited status matrix, phase gates, exact blockers, and owner actions.

## Stack

- React, TypeScript, Vite, React Router
- Firebase Authentication and Cloud Firestore
- Firebase Cloud Storage is not enabled by app rules or the profile UI
- The profile form uses a small local US state/territory list and a free-text city field to avoid bundling a global city database.
- Vitest covers focused profile input validation plus emulator integration tests for Auth/profile workflows and Firestore/Storage rules. UI browser journeys, offline behavior, and live Firebase have not been tested.

## Local setup

Requirements: Node.js compatible with the installed Vite/Vitest versions and npm.

```bash
npm ci
cp .env.example .env
npm run dev
```

Fill the Firebase client configuration values from an **owner-approved non-production Firebase project** before using live Authentication/Firestore. The app requires:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

`VITE_FIREBASE_STORAGE_BUCKET` and `VITE_FIREBASE_MESSAGING_SENDER_ID` are optional. Storage is not used by the profile UI and the checked-in Storage rules deny access. `VITE_FIREBASE_MEASUREMENT_ID` is optional. `.env` is ignored by git; `.env.example` contains placeholders only. Do not put service-account credentials or other privileged secrets in Vite environment variables.

The Firebase owner must enable Email/Password Authentication and create the Firestore database in the selected project. The repository does not prove that Firebase services/rules are configured in any remote project.

## Emulator workflow

The app can connect Auth and Firestore to local emulators when `VITE_USE_FIREBASE_EMULATORS=true`. The app also connects to the Storage emulator (port 9199) in that mode. Install/use the Firebase CLI separately; it is not a project dependency.

For local emulator use, install the Firebase CLI and a Java runtime required by the emulators. Set dummy client values in the ignored `.env` (never real production configuration), for example:

```dotenv
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=localhost
VITE_FIREBASE_PROJECT_ID=demo-the-scene
VITE_FIREBASE_APP_ID=demo-app-id
VITE_USE_FIREBASE_EMULATORS=true
```

Install the Firebase CLI separately from the app dependencies:

```bash
npm install --global firebase-tools
```

In separate terminals:

```bash
firebase emulators:start --only auth,firestore --project demo-the-scene
npm run dev
```

`firebase.json` configures Auth on port `9099`, Firestore on port `8080`, and Storage on port `9199`; it points the emulator/CLI at the checked-in rules and Firestore indexes. Rule tests use the isolated `demo-the-scene` project ID and never target a production project:

```bash
npm run test:rules
```

The rules test suite uses Auth-mocked identities and checks owner-only profile access, profile validation, account self-attestation, denied interaction writes, and denied Storage uploads. The Auth/profile suite exercises registration, attestation persistence, profile create/update/reload, sign-in/out, auth-state restore, and reset-email requests. Both suites have passed against local emulators; they do not replace browser UI journeys or live Firebase verification.
Run the suites one at a time because they share emulator ports.

## Commands

```bash
npm run dev       # Start Vite development server
npm run build     # Type-check and create a production bundle
npm run lint      # Run ESLint
npm test          # Run focused Vitest unit tests
npm run test:rules # Run Firestore/Storage rules tests in local emulators
npm run test:auth  # Run Auth/profile integration tests in local emulators
npm run preview   # Preview the production bundle locally
```

The current tests include 11 profile-validation unit tests, 7 Firestore/Storage rules tests, and 2 Auth/profile emulator integration tests. They do not replace browser UI journeys, offline/error-path testing, or production Firebase verification.

## Dependency audit

The non-forced `npm audit fix` updated semver-compatible dependencies, including React Router. The current full dependency audit reports 12 advisories (6 moderate, 6 high); the production-only audit reports 11 (6 moderate, 5 high) through Firebase's nested `@grpc/grpc-js` and `undici` packages. The additional full-audit finding is associated with the rules-test dependency and Firebase SDK version. npm's forced fix proposes downgrading Firebase to 9.14.0; that change was not applied. The exposure of the production transitive packages in the browser runtime has not been assessed. Resolve and review the advisories before production launch; do not claim the dependency tree is vulnerability-free.

## Data and security model in this repository

- `users/{uid}` stores the owner's account/profile identity fields and adult self-attestation; reads are owner-only. Attestation is user-supplied, not independently verified.
- `profiles/{uid}` stores the creative profile. Reads and writes are owner-only; Firestore rules bound fields and validate the current schema.
- Firestore rules deny client access to future interaction/safety collections until trusted authorization and matching UI exist.
- Storage rules deny everything except the photo path `users/<uid>/photos/*`; they are not deployed until Storage is enabled.
- Profile completion is determined from the authenticated owner's Firestore profile document when Firebase is configured. UI route guards supplement backend rules; they are not security enforcement.
- `firestore.indexes.json` defines one composite index (`threads`: `groupId` + `createdAt` desc) for forum and group post lists. Deploy it with the rules; it takes a few minutes to build.

## Production change and rollback policy

No production rules, indexes, data, Firebase settings, billing, or services were changed for this work. Never deploy rules or enable Storage/billing without explicit owner approval and a successful non-production emulator review.

After approval, use an explicitly selected project and the approved Firebase CLI command, for example:

```bash
firebase deploy --only firestore:rules,firestore:indexes --project <approved-project-id>
```

Do not deploy the Storage rules until the owner enables Storage/Blaze. Before any production change, save the currently deployed rules/index configuration. If validation fails after an approved deployment, restore the last reviewed rules from version control and re-run non-production emulator checks; do not make emergency production edits without the project owner.

## Launch blockers

Before a public launch, the owner must approve the age-assurance approach, legal/privacy/safety content, support contact, retention and deletion policy, moderation and incident response, and the production Firebase configuration. Engineering must complete and test privacy-safe discovery, mutual matching, blocking/reporting, trusted messaging/notifications, and account deletion before exposing user-generated profiles or contact.

### What remains, in order

1. Set up a dedicated non-production Firebase project/emulator workflow and pass Auth, profile persistence, and Firestore/Storage rules tests. No emulator-backed rules tests have been run yet.
2. Get owner/legal decisions on age assurance, privacy/terms/safety content, support, retention, account deletion, and whether media uploads or paid subscriptions are in scope.
3. Design and test a privacy-safe public profile projection and trusted backend authorization before implementing discovery, matching, blocking/reporting, or messaging.
4. Finish accessibility and browser/network checks, assess and resolve the remaining Firebase transitive dependency advisories, and configure production monitoring/backups only after owner approval.
5. Complete release review and obtain explicit deployment approval. Keep Capacitor deferred until the web product is release-ready.
