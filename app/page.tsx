"use client";
import { useState, useEffect, useRef } from "react";
import {
  ArrowUp,
  ArrowRight,
  Check,
  Copy,
  Download,
  RotateCcw,
  BookOpen,
  MessageCircle,
  LoaderCircle,
  X,
  Volume2,
} from "lucide-react";
import { sampleStart, sampleReply, sampleDraft } from "../lib/sample";
type State = { messages: any[]; decisions: any[]; tasks: any[]; busy: any };
const initial: State = sampleStart();
export default function Home() {
  const [state, setState] = useState<State>(initial),
    [message, setMessage] = useState(""),
    [proposal, setProposal] = useState(""),
    [mode, setMode] = useState<"sample" | "live">("sample"),
    [status, setStatus] = useState({ configured: false, signedIn: false }),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [resetting, setResetting] = useState(false),
    [ready, setReady] = useState(false);
  const end = useRef<HTMLDivElement>(null),
    input = useRef<HTMLTextAreaElement>(null);
  const task = state.tasks.at(-1);
  const last = state.messages.at(-1);
  const working = !!state.busy || pending;
  const phase = working
    ? "Working"
    : task?.status === "review"
      ? "Ready for you"
      : task?.status === "done"
        ? "Step complete"
        : "Here with you";
  async function api(action: string, body?: any) {
    const r = await fetch(`/api/ambi/${action}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data: any = await r.json();
    if (!r.ok)
      throw new Error(data.error || "Something went wrong. Please retry.");
    return data;
  }
  useEffect(() => {
    let active = true;
    api("status")
      .then(async (s) => {
        if (!active) return;
        setStatus(s);
        if (s.signedIn && s.configured) {
          const v = await api("state");
          if (active) {
            setMode("live");
            setState(v);
          }
        } else {
          try {
            const v = JSON.parse(localStorage.getItem("ambi-sample") || "null");
            if (
              v &&
              Array.isArray(v.messages) &&
              Array.isArray(v.tasks) &&
              Array.isArray(v.decisions)
            )
              setState({
                ...v,
                busy: null,
                tasks: v.tasks.map((t: any) =>
                  t.status === "working"
                    ? { ...t, status: "review", draft: sampleDraft }
                    : t,
                ),
              });
          } catch {}
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (ready && mode === "sample")
      localStorage.setItem("ambi-sample", JSON.stringify(state));
  }, [state, mode, ready]);
  useEffect(() => {
    if (last?.proposal) setProposal(last.proposal.brief);
  }, [last?.id]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state.messages.length, pending]);
  useEffect(() => {
    if (mode !== "live" || !state.busy) return;
    const timer = setInterval(
      () =>
        api("state")
          .then(setState)
          .catch((e) => setError(e.message)),
      1500,
    );
    return () => clearInterval(timer);
  }, [mode, !!state.busy]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);
  async function perform(action: string, body: any) {
    setPending(true);
    setError("");
    try {
      const s = await api(action, body);
      setState(s);
      return s;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || working) return;
    const text = message.trim();
    if (mode === "sample") {
      setState({
        ...state,
        messages: [{ id: "sample-user", role: "user", text }, sampleReply],
      });
      setMessage("");
      return;
    }
    const result = await perform("chat", { message: text });
    if (result) setMessage("");
  }
  async function confirm() {
    if (!proposal.trim() || working) return;
    if (mode === "sample") {
      const id = "sample-task";
      const at = Date.now();
      setState({
        ...state,
        decisions: [
          {
            id,
            text: proposal,
            at,
            source: "You confirmed this sample decision",
            proposalId: "sample-assistant",
          },
        ],
        tasks: [
          {
            id,
            title: sampleReply.proposal.title,
            brief: proposal,
            status: "review",
            at,
            draft: sampleDraft,
          },
        ],
        busy: null,
      });
      return;
    }
    await perform("confirm", { brief: proposal });
  }
  async function reset() {
    if (mode === "sample") setState(initial);
    else await perform("reset", {});
    setMessage("");
    setProposal("");
    setResetting(false);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `${task.draft.subject}\n\n${task.draft.body}`,
      );
      setNotice("Draft copied. Nothing has been sent.");
    } catch {
      setError(
        "Clipboard access is unavailable. Select the draft text or download it.",
      );
    }
  }
  function download() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([`${task.draft.subject}\n\n${task.draft.body}`], {
        type: "text/plain",
      }),
    );
    a.download = "ambi-draft.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function readAloud() {
    if (!("speechSynthesis" in window)) {
      setNotice("Read aloud is not available in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(task.draft.body);
    window.speechSynthesis.speak(u);
    setNotice("Reading aloud. Use Stop reading to stop.");
  }
  const proposed =
    last?.proposal && !state.decisions.some((d) => d.proposalId === last.id);
  return (
    <div className="shell">
      <header>
        <a className="brand" href="/" aria-label="ambi home">
          <span className="brandmark">
            <span />
          </span>
          ambi
        </a>
        <span className="tagline">A little space. A next step.</span>
        <div
          className={`presence ${working ? "working" : task?.status === "review" ? "review" : task?.status === "done" ? "done" : ""}`}
          role="status"
        >
          <span className="light" />
          {phase}
        </div>
      </header>
      <main>
        <div className="intro">
          <div>
            <h1>
              You don’t have to hold
              <br className="desktop-break" /> everything in your head.
            </h1>
            <p>
              Talk it through. Choose one small step.
              <br />
              I’ll help you follow through.
            </p>
          </div>
          <div className="mode-panel">
            <span className="mode-label">
              {mode === "sample" ? "Sample journey" : "Live with OpenAI"}
            </span>
            <p>
              {mode === "sample"
                ? "A fictional example with a prepared response and draft. No AI calls."
                : "Your conversation and decisions are saved to your private workspace."}
            </p>
            {mode === "sample" ? (
              status.signedIn && status.configured ? (
                <button
                  className="text-button"
                  onClick={async () => {
                    setError("");
                    try {
                      setState(await api("state"));
                      setMode("live");
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Open my workspace <ArrowRight size={16} />
                </button>
              ) : (
                <a
                  className="text-button"
                  href="/signin-with-chatgpt?return_to=/"
                  target="_top"
                >
                  {status.signedIn
                    ? "API key setup needed"
                    : "Sign in for live AI"}{" "}
                  <ArrowRight size={16} />
                </a>
              )
            ) : (
              <button
                className="text-button"
                onClick={() => {
                  setMode("sample");
                  setState(initial);
                }}
              >
                Explore sample <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
        {error && (
          <div className="error" role="alert">
            <span>{error}</span>
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={18} />
            </button>
          </div>
        )}
        <div className="workspace">
          <section
            className="conversation"
            aria-labelledby="conversation-title"
          >
            <div className="section-head">
              <h2 id="conversation-title">
                <MessageCircle size={19} /> A space to think
              </h2>
              <button
                className="icon-button"
                title="Clear this workspace"
                aria-label="Clear this workspace"
                onClick={() => setResetting(true)}
                disabled={pending}
              >
                <RotateCcw size={17} />
              </button>
            </div>
            {resetting && (
              <div className="reset-confirm">
                <p>Delete this conversation, its decisions and drafts?</p>
                <button onClick={reset}>Delete workspace</button>
                <button
                  className="text-button"
                  onClick={() => setResetting(false)}
                >
                  Keep it
                </button>
              </div>
            )}
            <div className="messages" aria-live="polite">
              {state.messages.length === 0 ? (
                <div className="welcome">
                  <span className="small-mark" />
                  <h3>What’s on your mind?</h3>
                  <p>
                    A setback, an unfinished thought, or something you’d like
                    help moving forward.
                  </p>
                  <button
                    className="starter"
                    onClick={() => {
                      setMessage(
                        "I was rejected for a job I really wanted. I’m disappointed, but I’d like help writing a short email asking for feedback.",
                      );
                      input.current?.focus();
                    }}
                  >
                    “I got a job rejection. What now?” <ArrowRight size={17} />
                  </button>
                  <p className="gentle">
                    There’s no need to have a plan before you start.
                  </p>
                </div>
              ) : (
                state.messages.map((m) => (
                  <article className={`message ${m.role}`} key={m.id}>
                    <span className="speaker">
                      {m.role === "user" ? "You" : "ambi"}
                    </span>
                    <p>{m.text}</p>
                  </article>
                ))
              )}
              {pending && (
                <div className="thinking">
                  <LoaderCircle size={16} /> Thinking about your next step…
                </div>
              )}
              <div ref={end} />
            </div>
            <form onSubmit={send} className="composer">
              <label className="sr-only" htmlFor="message">
                Message ambi
              </label>
              <textarea
                id="message"
                ref={input}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  mode === "sample"
                    ? "Try the job-rejection example…"
                    : "Tell me what’s on your mind…"
                }
                maxLength={2000}
                rows={3}
                disabled={!ready || working}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (message.trim() && !working) void send(e as any);
                  }
                }}
              />
              <div className="composer-bottom">
                <span>
                  {mode === "sample"
                    ? "Sample responses are prepared in advance."
                    : "Only what you share here becomes context."}
                </span>
                <button
                  className="send"
                  type="submit"
                  aria-label="Send message"
                  disabled={!message.trim() || working || !ready}
                >
                  <ArrowUp size={22} />
                </button>
              </div>
            </form>
          </section>
          <aside className="notebook" aria-labelledby="next-title">
            <div className="section-head">
              <h2 id="next-title">
                <BookOpen size={19} /> Your next step
              </h2>
              <span className="saved-label">
                {state.decisions.length ? "Remembered" : "Yours to choose"}
              </span>
            </div>
            {!task && !proposed ? (
              <div className="empty-note">
                <div className="note-line" />
                <h3>
                  A thought can become
                  <br />
                  something you can do.
                </h3>
                <p>
                  When you’re ready, we’ll agree on one useful draft. You stay
                  in charge of the decision.
                </p>
                <div className="promise">
                  <Check size={17} />
                  <span>Nothing gets sent on your behalf.</span>
                </div>
              </div>
            ) : null}
            {proposed && (
              <div className="proposal">
                <h3>{last.proposal.title}</h3>
                <span className="state-tag">Suggested · not yet agreed</span>
                <label htmlFor="decision">
                  Edit the step you want ambi to take
                </label>
                <textarea
                  id="decision"
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  rows={6}
                  maxLength={2000}
                />
                <button
                  className="primary"
                  onClick={confirm}
                  disabled={working || !proposal.trim()}
                >
                  Agree & prepare draft <ArrowRight size={17} />
                </button>
                <p className="fine">
                  This saves your decision and starts the draft. You’ll review
                  the result.
                </p>
              </div>
            )}
            {task && (
              <div className="task">
                <h3>{task.title}</h3>
                <span className="state-tag">
                  {task.status === "working"
                    ? "Preparing your draft"
                    : task.status === "review"
                      ? "Ready for your review"
                      : task.status === "done"
                        ? "Reviewed by you"
                        : "Needs another try"}
                </span>
                <details className="decision-record" open>
                  <summary>Your decision</summary>
                  <p>{task.brief}</p>
                  <span>
                    {mode === "sample" ? "Sample decision" : "Confirmed by you"}{" "}
                    ·{" "}
                    {new Date(task.at).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </details>
                {task.status === "working" && (
                  <div className="working-note">
                    <LoaderCircle size={22} />
                    <p>
                      I’m preparing your draft.
                      <br />
                      <span>You can leave this page and come back.</span>
                    </p>
                  </div>
                )}
                {task.status === "failed" && (
                  <div className="failed">
                    <p>{task.error}</p>
                    <button
                      className="primary"
                      disabled={working}
                      onClick={() => perform("retry", { id: task.id })}
                    >
                      Retry draft
                    </button>
                  </div>
                )}
                {task.draft && (
                  <>
                    <div className="draft">
                      <h4>{task.draft.subject}</h4>
                      <p>{task.draft.body}</p>
                    </div>
                    <div className="draft-tools">
                      <button onClick={copy}>
                        <Copy size={16} /> Copy
                      </button>
                      <button onClick={download}>
                        <Download size={16} /> Save
                      </button>
                      <button onClick={readAloud}>
                        <Volume2 size={16} /> Read aloud
                      </button>
                    </div>
                    <button
                      className="stop-reading text-button"
                      onClick={() => window.speechSynthesis?.cancel()}
                    >
                      Stop reading
                    </button>
                    <div className="review-checks">
                      <h4>Before you use it</h4>
                      <ul>
                        {task.draft.checks.map((c: string, i: number) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                    {task.status === "review" ? (
                      <button
                        className="primary"
                        disabled={working}
                        onClick={() =>
                          mode === "sample"
                            ? setState({
                                ...state,
                                tasks: state.tasks.map((t) => ({
                                  ...t,
                                  status: "done",
                                })),
                              })
                            : perform("review", { id: task.id })
                        }
                      >
                        <Check size={18} /> I’ve reviewed this draft
                      </button>
                    ) : (
                      <p className="complete">
                        <Check size={18} /> One step moved forward. Nothing was
                        sent.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
        <footer>
          <span>ambi · Built at DevDay Exchange London, 2026</span>
          <span>
            {mode === "sample"
              ? "Sample stays in this browser. Clear it anytime."
              : "Text-only today. Tone sensing and hardware are future work."}
          </span>
        </footer>
      </main>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
