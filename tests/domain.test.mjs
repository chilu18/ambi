import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  cleanText,
  confirmDecision,
  finishDraft,
  recover,
} from "../lib/domain.mjs";
const proposed = () => ({
  ...initialState(),
  messages: [
    {
      id: "proposal-a",
      role: "assistant",
      proposal: { title: "Feedback", brief: "Prepare feedback draft" },
    },
  ],
});
test("a proposal alone does not create a human decision", () => {
  assert.equal(proposed().decisions.length, 0);
});
test("confirmation saves exactly the edited human decision", () => {
  const s = confirmDecision(proposed(), " Ask for feedback only ", "a", 100);
  assert.equal(s.decisions[0].text, "Ask for feedback only");
  assert.equal(s.tasks[0].status, "working");
  assert.equal(s.busy.id, "a");
});
test("cannot execute without a proposal or while busy", () => {
  assert.throws(() => confirmDecision(initialState(), "draft", "a", 0));
  assert.throws(() =>
    confirmDecision({ ...proposed(), busy: { id: "b" } }, "draft", "a", 0),
  );
});
test("late worker cannot write after reset or cancellation", () => {
  const s = initialState();
  assert.equal(finishDraft(s, "old", {}), s);
});
test("completion records a reviewable draft, not an external send", () => {
  const s = finishDraft(confirmDecision(proposed(), "draft", "a", 0), "a", {
    subject: "Feedback",
    body: "Hello",
    checks: ["Check name"],
  });
  assert.equal(s.tasks[0].status, "review");
  assert.equal(s.busy, null);
  assert.equal(s.tasks[0].sent, undefined);
});
test("stale jobs become retryable while active jobs stay working", () => {
  const s = confirmDecision(proposed(), "draft", "a", 1000);
  assert.equal(recover(s, 2000), s);
  const r = recover(s, 62000);
  assert.equal(r.tasks[0].status, "failed");
  assert.equal(r.busy, null);
});
test("empty, huge and non-string input rejected", () => {
  for (const x of ["", null, {}, "a".repeat(2001)])
    assert.throws(() => cleanText(x));
});
test("empty model draft is rejected", () => {
  assert.throws(() =>
    finishDraft(confirmDecision(proposed(), "draft", "a", 0), "a", {
      subject: "x",
      body: "",
      checks: [],
    }),
  );
});

test("a repeated confirmation cannot create a second task", () => {
  const s = confirmDecision(proposed(), "draft", "a", 0);
  const done = finishDraft(s, "a", { subject: "x", body: "hello", checks: [] });
  assert.throws(() => confirmDecision(done, "draft", "b", 100));
});
