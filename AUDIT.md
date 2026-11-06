# Football league app audit ? 6 November 2026

## Assessment

The application was not fully working. Several source-level defects are fixed locally. Production Firebase access remains unresolved and prevents an end-to-end production sign-off. No production records, users, or rules were changed.

## Findings and changes

| Priority | Finding | Resolution |
| --- | --- | --- |
| Critical | Anonymous REST reads of both configured `players` and `matches` collections returned HTTP 403 `PERMISSION_DENIED` / ?Missing or insufficient permissions.? Public pages request these collections without authentication. | Confirmed live with read-only requests. Added visible subscription errors and a proposed, undeployed rules policy. Project-owner review, admin provisioning, and rule deployment remain required. |
| High | `/admin` trusted any `localStorage.adminAuth` value. A stale flag could show admin controls after the Firebase session expired; `/players` had no guard at all. | Both management routes now wait for Firebase Auth and redirect signed-out users. The client guard authenticates sessions; actual admin authorization must be enforced by deployed Firestore rules. |
| High | Logout only cleared a browser flag and left Firebase signed in. | Calls Firebase `signOut`. |
| High | Player creation, match writes, and subscriptions had no error handling. Failures looked like empty lists or unresponsive buttons. | Visible errors, loading/empty states, in-progress controls, success messages, and retry-friendly forms. Enter now submits login and create forms. |
| High | Player rename/delete used `forEach(async ...)` without awaiting related match writes. Success could be shown early; failures could leave inconsistent records. | Player and related matches commit in a single atomic batch. Commit failures propagate to the UI; oversized operations are refused without partial changes. |
| Medium | Players tab offered no inline list, and management controls were on a separate, easily missed page. | Players tab displays the list/count and a clearly labelled Manage Players (Edit / Remove) button. The management page links back to adding players. |
| Medium | Whitespace names, duplicate names, same-player fixtures, negative/fractional scores, and incomplete score pairs were accepted or silently discarded. Scores automatically forced Finished status. | Explicit validation and Upcoming/Live/Finished selection. Names are trimmed and duplicate-checked case-insensitively. Existing matches are selected by ID, including repeated pairings. |
| Medium | League generation could append the same fixtures repeatedly, partially write on failure, and treat a real player named BYE as an absent participant. | Generation checks the current database for an existing league, commits one batch, and uses a null bye marker. Double round-robin fixture properties are regression-tested. |
| Medium | Standings/stats/profile used separate calculations. Unplayed players disappeared from stats; malformed Finished results could count as draws; string scores could concatenate in profile totals; special names collided with object properties. | Shared standings/score validation using Map, numeric conversion, inclusion of registered players with zero games, and consistent tie-breaks. |
| Medium | Form/streak history followed random Firestore document order. Large score graph bars overflowed. | Deterministic matchday/timestamp/ID ordering and scaled bars. Legacy true completion order remains unrecoverable. |
| Medium | Vercel config omitted SPA rewrites. Unknown client routes were blank. Global CSS was not imported, and fixed login dimensions could overflow narrow screens. | Added SPA rewrite, a 404 route, imported a minimal responsive stylesheet, labelled forms, and keyboard-accessible player profile links. |
| Medium | Package manifest mixed Create React App with Vite and declared ESLint 8 for a newer flat config. Fresh installs depended on peer-dependency bypasses. | Removed unused react-scripts, aligned lint tooling, regenerated the lockfile, and added regression/browser tooling. Compatible security updates applied; final advisory status is recorded below. |
| Low | Git already tracked generated dist and dependency cache files. | Added `.gitignore`; existing tracked entries still require a deliberate repository cleanup. |

## Validation

- `npm run lint`: passed with no errors or warnings.
- `npm test`: 41 tests passed across scheduling/statistics, mocked Firestore services, and React authentication/forms/error handling.
- `npm run build`: passed. Vite reports a remaining bundle-size warning: the main JavaScript bundle is about 805 kB before gzip, about 243 kB compressed. Route/vendor splitting is a future performance improvement.
- `npm run test:browser`: 16 checks passed at desktop (1280 x 800) and mobile (375 x 812) sizes. Covered public routes, unknown route, navigation, and both protected management routes with forged local storage. Inspected dashboard/login screenshots. The sandbox required explicitly stopping the test Vite process to complete shutdown; all test assertions passed and Playwright recorded a passed run.
- `npm ls --depth=0`: passed, with no missing dependencies.
- Dependency audit after updates: 0 reported vulnerabilities. Supported ESLint 10 is retained. Targeted overrides select patched minimatch 11 for lint tooling and patched grpc-js for Firebase's Node dependency tree. Revisit these overrides when upstream dependency ranges are updated.
- Browser Firebase WebChannel connections were unavailable in the test environment. Browser checks establish rendering/navigation/auth guards, not working production data synchronization. The independent live REST checks, including requests with the configured client API key, confirmed public read denial.

The live check used collection-list GET requests with `pageSize=1`; it recorded status/error only and did not print player or match records. It confirms anonymous read denial, not the authorization state of any signed-in admin. No admin credentials were supplied.

## Required before production sign-off

1. Review and test `firestore.rules` against the deployed schema and existing access policy. Provision intended admin UIDs or claims, publish reviewed rules, and verify anonymous reads and admin-only writes. See README for concrete steps.
2. Verify create, rename, delete, match updates, league generation, and logout with a real authorized admin after rules are corrected. Local service/component tests use mocks; production write permission is unverified.
3. For simultaneous administrators, migrate fixture references from player names to stable IDs and enforce name uniqueness and league-generation concurrency on a trusted backend. Current duplicate/existing-league checks can race across clients, and a concurrent match edit can be overwritten during a rename. Atomic batches prevent partial commits, not stale read races.
4. Large datasets beyond 450 related writes require a backend migration/cleanup job. Generation currently supports at most 21 players and refuses larger leagues explicitly.
5. Historical match completion order cannot be reconstructed reliably when original documents have neither matchday nor timestamps. Current form uses deterministic fallback ordering.
6. Production deployment, Firebase rule-emulator verification, real credential/login checks, and signed-in production writes are not covered by this audit run.

Tracked generated build/dependency-cache files were restored after verification to keep the audit diff focused on source. Run `npm run build` before using `npm run preview` or deploying static build files.
