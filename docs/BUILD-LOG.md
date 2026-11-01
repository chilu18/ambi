# Build log — 1 November 2026, London

- Before 11:00: idea exploration and architecture diagrams, explicitly credited as prior work.
- Build window: inspected an application-empty repository and scoped to a single job-rejection → draft → review journey.
- Codex implemented explicit confirmation, per-user durable state, bounded background execution, retry recovery and separate sample/live modes.
- Initial verification: 8 domain tests passed and the first production build passed. Browser and live-API verification are recorded below when complete.

Concrete Codex example: the `late worker cannot write after reset or cancellation` test verifies that an old asynchronous result cannot replace a cleared workspace. The implementation checks the task ID against the current active run before saving.
- Verification: 9 domain tests passed, including duplicate-confirmation protection; 3 browser tests passed, covering the sample journey, refresh persistence, mobile overflow, reset, empty input and anonymous API access rejection.
- UI review: an independent Impeccable reviewer requested one status-placement fix; refreshed desktop/mobile captures resolved it. The design detector returned no findings.
- Live API and hosted signed-in journey remain unverified until a key is configured. No sample output is claimed as live AI evidence.
- Published version 1 at https://ambi-london-2026.heysalad-5703.chatgpt.site and public source at https://github.com/chilu18/ambi.
- Hosted verification: all 3 browser tests passed without signing in. Public GitHub returned HTTP 200. A forged identity header was rejected with HTTP 401 by the hosted state API.
- Local worker integration passed: signed-in decision persisted; confirmation returned 202; missing-key failure cleared the running state and exposed retry; duplicate confirmation, foreign task IDs and cross-origin writes were rejected. This deliberately tests failure handling, not live generation.
