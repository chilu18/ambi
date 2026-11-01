import { env } from "cloudflare:workers";
import { after } from "next/server";
import {
  initialState,
  cleanText,
  confirmDecision,
  finishDraft,
  recover,
} from "../../../../lib/domain.mjs";
import { converse, draftTask } from "../../../../lib/ai";
export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
async function read(owner: string) {
  const db = env.DB!;
  await db
    .prepare(
      "INSERT OR IGNORE INTO ambi_workspaces (owner,state,version) VALUES (?,?,0)",
    )
    .bind(owner, JSON.stringify(initialState()))
    .run();
  const row: any = await db
    .prepare("SELECT state,version FROM ambi_workspaces WHERE owner=?")
    .bind(owner)
    .first();
  return { state: JSON.parse(row.state), version: row.version };
}
async function save(owner: string, state: any, version: number) {
  const r = await env
    .DB!.prepare(
      "UPDATE ambi_workspaces SET state=?,version=version+1 WHERE owner=? AND version=?",
    )
    .bind(JSON.stringify(state), owner, version)
    .run();
  if (r.meta.changes !== 1)
    throw new Error(
      "Another step changed this conversation. Refresh and try again.",
    );
}
async function quota() {
  const day = new Date().toISOString().slice(0, 10);
  await env
    .DB!.prepare("INSERT OR IGNORE INTO ambi_usage (day,count) VALUES (?,0)")
    .bind(day)
    .run();
  const r = await env
    .DB!.prepare(
      "UPDATE ambi_usage SET count=count+1 WHERE day=? AND count<100",
    )
    .bind(day)
    .run();
  if (r.meta.changes !== 1)
    throw new Error(
      "The shared demo has reached its daily AI limit. Try the sample journey.",
    );
}
async function run(owner: string, id: string) {
  try {
    const start = await read(owner);
    const task = start.state.tasks.find((t: any) => t.id === id);
    if (!task || start.state.busy?.id !== id) return;
    const draft = await draftTask(task, start.state.messages);
    const latest = await read(owner);
    if (latest.state.busy?.id !== id) return;
    await save(owner, finishDraft(latest.state, id, draft), latest.version);
  } catch (e) {
    const latest = await read(owner);
    if (latest.state.busy?.id !== id) return;
    await save(
      owner,
      {
        ...latest.state,
        busy: null,
        tasks: latest.state.tasks.map((t: any) =>
          t.id === id
            ? {
                ...t,
                status: "failed",
                error: "The draft could not finish. Retry when you are ready.",
              }
            : t,
        ),
      },
      latest.version,
    );
  }
}
async function handle(request: Request, action: string) {
  const owner = request.headers.get("oai-authenticated-user-id");
  if (action === "status")
    return json({
      configured: !!(env as any).OPENAI_API_KEY,
      signedIn: !!owner,
    });
  if (!owner)
    return json(
      { error: "Sign in to keep your conversation and use live AI." },
      401,
    );
  if (!env.DB)
    return json(
      { error: "Memory storage is not available. Please try again later." },
      503,
    );
  if (request.method === "POST") {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      return json({ error: "Request origin not allowed." }, 403);
    const length = Number(request.headers.get("content-length") || 0);
    if (length > 12000)
      return json({ error: "This message is too long." }, 413);
  }
  try {
    let { state, version } = await read(owner);
    const restored = recover(state, Date.now());
    if (restored !== state) {
      await save(owner, restored, version);
      state = restored;
      version++;
    }
    if (action === "state" && request.method === "GET") return json(state);
    if (request.method !== "POST") return json({ error: "Not found" }, 404);
    const raw = await request.text();
    if (raw.length > 12000)
      return json({ error: "This message is too long." }, 413);
    const body = JSON.parse(raw || "{}");
    if (action === "reset") {
      await save(owner, initialState(), version);
      return json(initialState());
    }
    if (state.busy)
      return json(
        { error: "ambi is working on your current step. Please wait." },
        409,
      );
    if (action === "chat") {
      const message = cleanText(body.message);
      await quota();
      const id = crypto.randomUUID();
      const busy = { id, at: Date.now(), kind: "conversation" };
      await save(owner, { ...state, busy }, version);
      try {
        const reply = await converse(state, message);
        cleanText(reply.reply, 3000);
        if (reply.proposal) {
          cleanText(reply.proposal.title, 100);
          cleanText(reply.proposal.brief, 2000);
        }
        const current = await read(owner);
        if (current.state.busy?.id !== id)
          return json({ error: "This conversation was reset." }, 409);
        state = {
          ...current.state,
          busy: null,
          messages: [
            ...state.messages,
            { id: crypto.randomUUID(), role: "user", text: message },
            {
              id: crypto.randomUUID(),
              role: "assistant",
              text: reply.reply,
              proposal: reply.proposal,
            },
          ].slice(-24),
        };
        await save(owner, state, current.version);
        return json(state);
      } catch (e) {
        const current = await read(owner);
        if (current.state.busy?.id === id)
          await save(owner, { ...current.state, busy: null }, current.version);
        throw e;
      }
    }
    if (action === "confirm") {
      const id = crypto.randomUUID();
      state = confirmDecision(state, body.brief, id, Date.now());
      await quota();
      await save(owner, state, version);
      after(() => run(owner, id));
      return json(state, 202);
    }
    if (action === "retry") {
      const task = state.tasks.find(
        (t: any) => t.id === body.id && t.status === "failed",
      );
      if (!task) throw new Error("There is no failed draft to retry.");
      await quota();
      state = {
        ...state,
        busy: { id: task.id, at: Date.now(), kind: "draft" },
        tasks: state.tasks.map((t: any) =>
          t.id === task.id ? { ...t, status: "working", error: null } : t,
        ),
      };
      await save(owner, state, version);
      after(() => run(owner, task.id));
      return json(state, 202);
    }
    if (action === "review") {
      if (
        !state.tasks.some((t: any) => t.id === body.id && t.status === "review")
      )
        throw new Error("This draft is not ready for review.");
      state = {
        ...state,
        tasks: state.tasks.map((t: any) =>
          t.id === body.id
            ? { ...t, status: "done", reviewedAt: Date.now() }
            : t,
        ),
      };
      await save(owner, state, version);
      return json(state);
    }
    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json(
      {
        error:
          e instanceof Error
            ? e.message
            : "This step failed. Please try again.",
      },
      400,
    );
  }
}
export async function GET(req: Request, { params }: any) {
  return handle(req, (await params).action);
}
export async function POST(req: Request, { params }: any) {
  return handle(req, (await params).action);
}
