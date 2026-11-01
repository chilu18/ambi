export const initialState = () => ({
  messages: [],
  decisions: [],
  tasks: [],
  busy: null,
});
export function cleanText(value, max = 2000) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new Error(`Please enter between 1 and ${max} characters.`);
  return value.trim();
}
export function confirmDecision(state, brief, id, now) {
  if (state.busy)
    throw new Error("Please wait for the current step to finish.");
  const last = state.messages.at(-1);
  if (!last?.proposal)
    throw new Error("Talk with ambi to propose a draft first.");
  if (state.decisions.some((d) => d.proposalId === last.id))
    throw new Error("This proposed step has already been confirmed.");
  const decision = {
    id,
    text: cleanText(brief),
    at: now,
    source: "You confirmed this decision",
    proposalId: last.id,
  };
  const task = {
    id,
    title: last.proposal.title,
    brief: decision.text,
    status: "working",
    at: now,
    draft: null,
    error: null,
  };
  return {
    ...state,
    decisions: [...state.decisions, decision].slice(-10),
    tasks: [...state.tasks, task].slice(-10),
    busy: { id, at: now, kind: "draft" },
  };
}
export function finishDraft(state, id, draft) {
  if (state.busy?.id !== id) return state;
  cleanText(draft.subject, 180);
  cleanText(draft.body, 6000);
  if (
    !Array.isArray(draft.checks) ||
    draft.checks.some((x) => typeof x !== "string")
  )
    throw new Error("Invalid draft checks.");
  return {
    ...state,
    busy: null,
    tasks: state.tasks.map((t) =>
      t.id === id ? { ...t, status: "review", draft, error: null } : t,
    ),
  };
}
export function recover(state, now) {
  if (!state.busy || now - state.busy.at < 60000) return state;
  return {
    ...state,
    busy: null,
    tasks: state.tasks.map((t) =>
      t.id === state.busy.id
        ? {
            ...t,
            status: "failed",
            error: "This run was interrupted. Retry your draft.",
          }
        : t,
    ),
  };
}
