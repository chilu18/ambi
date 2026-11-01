---
name: ambi
description: A quiet workspace for one considered next step.
colors:
  ground: "#f5f6f2"
  paper: "#fff"
  ink: "#163d3a"
  muted: "#53665f"
  teal: "#116b5d"
  line: "#d6dfd9"
  wash: "#e9f0e8"
  notebook: "#f9faf7"
  action-hover: "#084d42"
  focus: "#178471"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(36px,4vw,56px)"
    fontWeight: 400
    lineHeight: 1.07
    letterSpacing: "-0.025em"
  title:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.7
  section:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  action:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 550
rounded:
  workspace: "14px"
  composer: "12px"
  control: "10px"
  tool: "8px"
  pill: "99px"
spacing:
  compact: "12px"
  control: "14px"
  action: "18px"
  section: "26px"
  message: "28px"
  intro: "48px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.paper}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "14px 18px"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-tool:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tool}"
    padding: "9px 12px"
  proposal-input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "14px"
    width: "100%"
  workspace:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.workspace}"
  message-user:
    backgroundColor: "{colors.wash}"
    rounded: "{rounded.composer}"
    padding: "15px 18px"
---

# Design System: ambi

## Overview

**Creative North Star: "A little space. A next step."**

ambi inherits its teal identity from the existing diagrams and expresses it as a quiet, light workspace. A restrained serif opening gives way to readable sans-serif conversation and task content. The interface keeps a thought, an explicit decision, and a reviewable draft visually distinct.

The first surface pairs conversation with a next-step notebook. Its desktop split and mobile stack support the current journey without making that exact composition mandatory for every future screen. The implementation direction used recorded roll `seed:7e8cc4d22c6b38fd`; this is provenance, not a user-selected option.

**Key Characteristics:**
- Teal actions on warm off-white and white surfaces.
- Serif invitation, sans-serif working content.
- Quiet borders and tonal separation.
- State communicated with text alongside color.

## Colors

### Primary

Teal carries primary actions, the brand mark, and the input caret. Its deeper hover tone makes actionable state visible.

**The Action Teal Rule.** Use teal for the primary step and focus, keeping prose in ink and muted tones.

### Neutral

Ground surrounds the white conversation surface; the slightly tinted notebook separates task material. Wash groups user messages and the starter prompt. Line defines panel boundaries without heavy contrast. Ink carries content and muted carries supporting context.

State lights also use purple for working, amber for review, and green for completion; they accompany a written status rather than replacing it. Their exact values remain in source because they are local status details rather than a general accent palette.

## Typography

**Display Font:** Instrument Serif, with Georgia and serif fallbacks.
**Body Font:** DM Sans, with a sans-serif fallback.

The opening is expressive but restrained. Working content remains compact and legible: section titles use the section role; task titles use the title role; explanatory text uses the body role. Conversation messages are larger (15px) with generous leading (1.75), while intro text uses 16px and 1.6 leading. Supporting labels range from 11px to 13px. The notebook empty-state heading uses the display family at 34px and 1.15 leading.

**The Working Voice Rule.** Reserve serif typography for the invitation and notebook empty state; use sans-serif for decisions, drafts, controls, and conversation.

## Layout

The desktop container has a maximum width of 1400px and 5% horizontal padding. The header is 92px tall. Introductory content precedes a workspace with two columns in a 1.05:1 ratio and a minimum height of 590px. Conversation comes first, notebook second. Section headings share a ruled baseline and aligned internal spacing.

At 760px and below, the workspace stacks in document order, horizontal page padding becomes 6%, and the header becomes 76px tall. The opening heading becomes 40px. The conversation scroll area is bounded at 540px desktop and 440px mobile. Message content caps at 65ch; empty-state copy at 38ch. Spacing is extracted from actual components rather than a hypothetical uniform scale.

## Elevation & Depth

Workspace surfaces stay flat. White, notebook tint, wash, and thin borders establish grouping. The only box shadow is on the transient toast (`0 8px 30px #163d3a20`), separating feedback from the document beneath it. No decorative grids or animated backgrounds belong to the inherited direction.

**The Quiet Surface Rule.** Separate persistent regions with tone and borders; reserve elevation for transient feedback.

## Shapes

The workspace has gently rounded outer corners, while controls are tighter. The frontmatter distinguishes workspace, composer, control, tool, and pill radii; the old blanket 14px control rule is reconciled to the implementation. Circular brand marks, status dots, and the send control are native to this visual identity.

## Components

### Buttons

Primary actions are full-width teal controls with white text, compact rounded corners, and centered icon-and-label content. Hover deepens the teal. Tool buttons are white with a fine green-gray border; hover uses wash. Text actions are underlined and unfilled. Disabled buttons use half opacity and a non-action cursor. Circular send controls retain a visible accessible label.

### Inputs / Fields

The composer is a white bordered container with a borderless textarea inside. Focus surrounds the composer with a 2px teal outline and 2px offset. Proposal fields use a visible border, the control radius, and a vertically resizable textarea. General keyboard focus uses a 3px focus-color outline with 4px offset.

### Chips

The sample/live mode label is an outlined pill with muted teal text. It is informational rather than an interactive filter.

### Cards / Containers

The workspace groups both panes behind a fine outer border. User messages receive wash, inset padding, and the composer radius; assistant text stays on the conversation surface. The notebook uses a quiet tinted ground. Keep these semantic differences visible in new states.

### Navigation

The header combines the circular ambi mark and wordmark with a short tagline and a right-aligned written presence state. The tagline hides on mobile. The home link keeps the brand accessible without adding a separate navigation bar.

### Decision and review

A proposal exposes an editable brief and an explicit agreement action. A saved decision uses an expandable ruled record above the draft. Draft tools and review checks sit below the draft body. The primary action changes with the next available step; completion remains written feedback.

Working indicators pulse over 1.5 seconds or rotate over 1.2 seconds. Reduced-motion preference disables animation. No continuous decorative motion is used.

## Do's and Don'ts

### Do:
- **Do** retain teal actions, ink content, and muted supporting text.
- **Do** pair status color with a written state.
- **Do** preserve conversation-before-notebook reading order on small screens.
- **Do** keep keyboard focus visible and respect reduced motion.

### Don't:
- **Don't** add decorative grids or animated backgrounds.
- **Don't** apply the workspace radius indiscriminately to every control.
- **Don't** make draft creation or completion appear to mean a message was sent.
