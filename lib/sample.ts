export function sampleStart() {
  return { messages: [], decisions: [], tasks: [], busy: null };
}
export const sampleReply = {
  id: "sample-assistant",
  role: "assistant",
  text: "That is disappointing, especially after putting time into an application. We can take this one step at a time. Would a short, thoughtful request for feedback help you close the loop?",
  proposal: {
    title: "Ask for useful feedback",
    brief:
      "Prepare a warm, concise feedback request after my job application was declined. Thank the hiring team and ask for one thing I could improve. Save it as a draft for me to review; do not send it.",
  },
};
export const sampleDraft = {
  subject: "Thank you — a quick request for feedback",
  body: "Hi [Hiring manager],\n\nThank you for letting me know about the decision, and for the time you spent considering my application for [Role].\n\nWhile I’m disappointed, I appreciated the opportunity to learn more about your team. If you have a moment, is there one area I could strengthen for future opportunities? Any feedback would be helpful.\n\nThanks again, and I wish you and the team all the best.\n\n[Your name]",
  checks: [
    "Replace the recipient, role and name placeholders.",
    "Make sure the tone feels like you.",
    "Review the recipient address before sending yourself.",
  ],
};
