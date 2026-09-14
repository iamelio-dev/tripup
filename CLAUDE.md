# TripUp — Claude Code Instructions

## Project

TripUp is a mobile-first React/Vite prototype for a design challenge.

Target viewport:

**393 × 852 px**

The immediate goal is a fully working **local prototype**.

Do not spend implementation effort on Vercel/deployment unless explicitly requested.

---

## Read Before Coding

Before making implementation decisions:

1. Read `PRD.md`.
2. Inspect the connected Figma file through Figma MCP (https://www.figma.com/design/3HCMZXGRzeZAUXX0loktCs/TripUp?node-id=0-1&t=PySPFVH6B5GaXSqV-1).
3. Understand the IA, flows, wireframes, hi-fi screens, components and tokens.

Do not start by inventing the application structure independently.

---

## Source of Truth

The design process was created in this order:

**IA → User Flows → Wireframes → High-Fidelity**

Later artefacts contain more detailed decisions.

### Behaviour / logic

Use this priority:

**Wireframes > User Flows > IA**

If a wireframe conflicts with an earlier flow or IA decision, follow the wireframe.

### Visual/UI

Use this priority:

**High-Fidelity > Wireframes > User Flows > IA**

If a hi-fi screen differs visually from a wireframe, follow the hi-fi screen.

### Product scope

**PRD > Figma**

The PRD defines what is currently in scope.

---

## Figma

Figma is the design source of truth.

For each required screen:

1. Find the corresponding wireframe.
2. Recreate its structure and layout.
3. Check whether a hi-fi version exists.
4. If it exists, use the hi-fi screen as the primary visual reference.
5. Reuse existing components.
6. Reuse existing tokens.
7. Implement the required behaviour.

Do not redesign screens that already have Figma references.

---

## Components

Prefer reusable React components.

Reuse existing Figma patterns wherever possible.

If an exact component does not exist:

- Follow the wireframe interaction pattern.
- Follow the visual language of the hi-fi screens.
- Reuse existing tokens.
- Create a reusable component.

Do not introduce unrelated visual styles or generic UI patterns when the Figma design already provides a direction.

---

## Required Scope

The primary journey is:

Home
→ Lisbon trip
→ Add Ren
→ Create restaurant poll
→ Publish poll
→ Vote
→ Results update
→ Close poll
→ Winning restaurant added to itinerary
→ Add dinner expense
→ Exclude Ren and Nick from wine
→ Updated balances
→ Consolidated debt

These interactions must work.

---

## Out of Scope

Do not implement unless explicitly requested:

- Payment processing
- Real money transfers
- Settlement functionality
- Add Event
- Authentication
- Backend
- Database
- Real-time networking
- Push notifications
- External APIs
- Production financial calculations

These features may appear visually if required by the Figma designs.

---

## Non-essential Controls

Not every button in the Figma design needs to be functional.

A control may intentionally do nothing when it:

- Is not required by the primary journey.
- Represents an out-of-scope feature.
- Is secondary to the demo.
- Exists primarily to make the UI believable.

However, every interaction required by the primary journey must work.

---

## State

Use simple deterministic local state.

Important state changes should persist during the demo session.

Examples:

- Adding Ren updates participant lists.
- Creating a poll creates a visible poll.
- Voting updates the selected option.
- Poll results update.
- Closing the poll identifies a winner.
- The winner appears in the itinerary.
- Excluding Ren/Nick updates the wine split.
- Balances update accordingly.

Do not build backend infrastructure to simulate these behaviours.

---

## Visual Target

Primary viewport:

**393 × 852 px**

Optimise for an iPhone Pro-sized layout.

The goal is not generic desktop responsiveness.

The two hi-fi screens are important visual benchmarks.

Pay particular attention to:

- Typography
- Spacing
- Layout
- Colour
- Surfaces
- Border radius
- Component sizing
- Hierarchy
- Bottom sheets
- Navigation
- Interaction states

Use design tokens instead of arbitrary values whenever possible.

---

## Implementation Style

Keep the implementation:

- Simple
- Modular
- Easy to edit
- Easy to iterate on
- Appropriate for a prototype

Avoid unnecessary abstraction and infrastructure.

Do not over-engineer mock functionality.

The quality of the final user experience matters more than production architecture.

---

## Before Declaring the Work Complete

Verify:

- The app runs locally.
- The main demo path works from Home to the final required state.
- Required state changes are preserved.
- The high-fidelity screens are visually represented.
- Wireframe layouts are respected.
- Existing components/tokens are reused.
- Missing components are consistent with the design.
- No required interaction is a dead end.
- Out-of-scope features are not blocking the demo.

When uncertain, prefer the most recent and most detailed Figma artefact, subject to the scope defined in `PRD.md`.
