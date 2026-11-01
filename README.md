# ambi

**A little space to think. An agent to help you follow through.**

Built for the DevDay Exchange Community Hackathon, London, 1 November 2026.

[Try the public sample](https://ambi-london-2026.heysalad-5703.chatgpt.site) · [Public source](https://github.com/chilu18/ambi)

Current published status: sample journey verified; live OpenAI generation awaits API-key configuration and a real end-to-end check.

ambi helps independent workers turn a difficult moment into one small, agreed next step. Talk through a setback, edit and confirm a proposed task, then let ambi prepare a draft for you to review. Your decision and result stay together when you return.

## One complete journey

1. Tell ambi about a job rejection and ask for help requesting feedback.
2. Discuss the next step. A model suggestion is visibly **not yet agreed**.
3. Edit the proposed action and click **Agree & prepare draft**.
4. The server saves your explicit decision and starts a bounded drafting job.
5. Return to a draft with checks and placeholders. Copy/download it, then mark it reviewed.

Nothing is sent externally. The UI status light represents the agent’s state, not your mood.

## Stack

React + TypeScript on the supplied Sites Vinext starter; Cloudflare Workers and D1; OpenAI Responses API with structured outputs. `gpt-5-mini` is the default, configurable through `OPENAI_MODEL` (the request uses low reasoning effort, so choose a compatible model or update the request).

## Local setup

Requires Node 22.13+ and an OpenAI API key. Do not commit your key.

```sh
npm ci
cp .env.example .dev.vars
# Edit .dev.vars and add your OPENAI_API_KEY.
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_stale_payback.sql
npm run dev
```

Open the URL printed by the server (normally http://localhost:5173). The public page starts in **Sample journey**, a fictional prepared example with no model calls. For live local mode visit `/signin-with-chatgpt?return_to=/`; the supplied starter provides a loopback-only development identity. Production uses Sites-managed ChatGPT sign-in. Local and production databases are separate.

A missing key does not silently generate fake AI output. The sample is explicitly labelled. Clear the workspace to delete its current saved conversation, decisions and drafts. Sample data remains only in the current browser’s local storage until cleared.

## Checks

```sh
node --test tests/domain.test.mjs
npx tsc --noEmit
npx playwright install chromium
# With the dev server running:
npx playwright test
npm run build
```

See [acceptance criteria](docs/ACCEPTANCE.md) and [credits](docs/CREDITS.md).

## What is real, and what is deliberately small

Live mode uses OpenAI to hold the conversation and generate the draft. Human confirmation is enforced in application code. D1 saves per-user state; optimistic concurrency prevents overlapping steps from silently overwriting each other. `after()` keeps a short draft job running after its HTTP response; a failed or interrupted run can be retried. Each call has a 23-second timeout and the demo has a shared 100-call daily cap.

This is a bounded draft worker, not an always-on scheduler. Jobs interrupted by infrastructure are marked retryable when the user next opens the app. It does not monitor email, infer emotion from tone, control physical LEDs, or send messages. Browser read-aloud uses the browser’s speech synthesis when available; it is not OpenAI voice mode. Cross-device memory depends on signing in with the same account. Clear/reset invalidates pending results, but cannot recall data already processed by OpenAI. Model calls use `store:false`; provider processing policies still apply.

## Codex contribution

Codex helped scope the broad ambient-computer idea to a complete confirmation → background draft → review journey. It implemented the application, created tests showing that a late worker cannot overwrite a reset workspace, and ran build and browser checks. See [build log](docs/BUILD-LOG.md) for concrete evidence and limitations.

## References

- [Hackathon event](https://luma.com/dde-ldn-hack)
- [Codex documentation](https://developers.openai.com/codex) and [quickstart](https://developers.openai.com/codex/quickstart)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI Cookbook](https://developers.openai.com/cookbook)

The current app uses structured responses and application-controlled draft execution; it does not claim autonomous model tool use.
