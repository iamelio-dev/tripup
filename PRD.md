# TripUp — Prototype PRD

## 1. Overview

TripUp is a mobile-first group travel planning and expense management app.

This prototype is being built for a design challenge and must demonstrate the core user journey described in the challenge brief.

The goal is to turn the existing Figma work into a coherent, believable working prototype that can be demonstrated locally.

The prototype should prioritise:

- Completing the required user journey
- Faithfully translating the existing Figma design
- Matching the supplied high-fidelity screens
- Following the layouts and interaction patterns established in the wireframes
- Providing meaningful state changes throughout the required flows
- Reusing the existing design system
- Keeping implementation simple and easy to iterate on

Real backend infrastructure, authentication, real-time networking, payment processing and production-ready calculations are not required.

Mock data and local application state are acceptable.

---

# 2. Challenge Scenario

It is the last evening of a group trip to Lisbon.

Ari opens TripUp and sees her trips on the home screen.

She opens the current Lisbon trip and adds Ren, a new friend joining for the final dinner.

Ari then creates a restaurant poll containing three nearby restaurants with different vibes.

The poll is sent to the group. Participants vote and the leading option updates.

When the poll closes, the winning restaurant is automatically added to the itinerary.

Later that evening, Ari records the dinner expenses.

When splitting the wine expense, she excludes Ren and Nick.

TripUp updates each participant's balance, consolidates the resulting debts to minimise transfers, and allows the participants to settle their shares directly in the app.

The flow ends with a confirmation that the group's expenses have been settled.

---

# 3. Prototype Objective

The prototype must allow a reviewer to experience the required scenario from beginning to end.

The required journey is:

Home
→ Open Lisbon trip
→ Add Ren
→ Create restaurant poll
→ Poll is shared
→ Vote on restaurant
→ Poll results update
→ Poll closes
→ Winning restaurant appears in itinerary
→ Add dinner expense
→ Exclude Ren and Nick from wine
→ Balances update
→ View consolidated debts

Payment/settlement functionality is out of scope for the current implementation and may be added later.

Add Event functionality is also out of scope for the current implementation and may be added later.

The final prototype should prioritise making the required journey coherent and convincing rather than implementing every feature represented in the wider product.

---

# 4. Technology

Implement the prototype using:

- React
- Vite
- TypeScript
- React Router where appropriate
- CSS / CSS Modules
- Local/mock application state

The project should run locally through the standard Vite development workflow.

Deployment to Vercel is not part of the current implementation task.

The target device is an iPhone Pro.

Reference viewport:

393 × 852 px

The application should be designed primarily for this viewport rather than as a generic desktop-responsive website.

Desktop viewing only needs to remain usable enough for development and review.

---

# 5. Source of Truth

The Figma file contains the Information Architecture, user flows, wireframes, high-fidelity screens, components and design tokens.

The following hierarchy determines how implementation decisions should be made.

## 1. PRD

Defines:

- Product scope
- Required functionality
- Explicit exclusions
- Prototype priorities
- Technical constraints

## 2. Wireframes

Wireframes are the primary source of truth for:

- Screen structure
- Layout
- Navigation
- Interaction flow
- Screen states
- Behaviour

The wireframes were created after the Information Architecture and user flows.

Therefore, if the IA or original flow diagrams conflict with the wireframes, follow the wireframes.

## 3. High-fidelity screens

The high-fidelity screens are the primary source of truth for:

- Visual appearance
- Typography
- Colour
- Spacing
- Component styling
- Surface treatments
- Visual hierarchy
- Responsive behaviour
- Interaction states where represented

If the high-fidelity screens conflict with the wireframes on visual/UI decisions, follow the high-fidelity screens.

## 4. Design System

Use the existing Figma:

- Components
- Variables
- Tokens
- Typography
- Icons
- Spacing
- Colours
- Radii
- Other established patterns

## 5. Information Architecture and Original Flows

The IA and original flow diagrams provide useful context and intent.

However, they should not override a later, more detailed wireframe decision.

---

# 6. Important Interpretation Rule

The design process was created in stages:

Information Architecture
→ User Flows
→ Wireframes
→ High-Fidelity Screens

Later artefacts therefore contain more detailed design decisions.

When there is a conflict:

### For behaviour and logic

Use:

Wireframes > original flows > IA

### For visual/UI decisions

Use:

High-fidelity screens > wireframes > original flows > IA

### For product scope

Use:

PRD > Figma

Do not attempt to reconstruct an earlier decision when a later Figma artefact has already resolved it.

---

# 7. Figma Inspection

Before implementing the application, inspect the connected Figma file through Figma MCP.

Review:

1. Information architecture
2. User flows
3. Wireframe screens
4. High-fidelity screens
5. Components
6. Variables/tokens

Identify the screens and states required for the three in-scope flows.

Do not begin by independently designing the product.

The goal is to translate the existing design into code.

---

# 8. Screen Identification

Every relevant screen should have a unique, stable identifier.

Use screen IDs consistently between:

- Figma
- PRD
- React routes
- React components
- Implementation notes

Example:

`S01 — Home`

`S02 — Trip Overview`

`S03 — People`

`S04 — Add Participant`

If a screen has meaningful UI states, represent those states explicitly.

Example:

`S06a — Poll — Unvoted`

`S06b — Poll — Voted`

`S07a — Poll Results — Open`

`S07b — Poll Results — Closed`

The exact IDs should follow the existing Figma naming where possible rather than inventing a parallel naming system.

---

# 9. Implementation of Existing Figma Screens

For every required screen:

1. Locate the corresponding Figma wireframe.
2. Recreate its structure and layout.
3. Check whether a high-fidelity version exists.
4. If a high-fidelity version exists, use it as the visual reference.
5. Reuse existing Figma components and tokens.
6. Implement the interactions required by the wireframe and PRD.

Where a high-fidelity screen exists, the implementation should aim to make the coded result visually recognisable as the same design.

Where only a wireframe exists, use the established design system and the high-fidelity screens to determine its visual treatment.

---

# 10. Reusable Components

Prefer reusable React components over duplicated UI.

Existing Figma components should be mapped to reusable implementation components where practical.

Examples may include:

- Buttons
- Cards
- List items
- Navigation
- Tabs
- Poll options
- Participant rows
- Expense rows
- Bottom sheets
- Modals
- Selection controls
- Chips
- Feedback/confirmation surfaces

Do not create unnecessary abstractions simply for architectural purity.

The prototype should remain easy to modify during the design challenge.

---

# 11. Missing Components

Not every UI element required by the wireframes will necessarily exist as an exact Figma component.

When a required component does not exist:

1. Follow the interaction pattern shown in the wireframe.
2. Use the visual language established by the high-fidelity screens.
3. Reuse existing tokens.
4. Reuse smaller existing components where possible.
5. Create the new component consistently with the established design.

For example:

If the create-poll flow uses a bottom sheet but there is no exact bottom-sheet component available, implement a bottom sheet using the same visual conventions as the existing design system.

Do not introduce an unrelated UI style.

---

# 12. Functional Scope

## In scope

The following functionality must work:

### Trip access

- Home screen
- View trips
- Open the Lisbon trip

### Participants

- View participants
- Add Ren
- Reflect the new participant in the relevant group UI

### Polls

- Create a restaurant poll
- Add/select three restaurant options
- Publish the poll
- View the created poll
- Vote on a poll
- Show the selected state
- Show updated results
- Close the poll
- Identify the winning restaurant
- Add the winning restaurant to the itinerary

### Expenses

- Access expenses
- Add/log the dinner expense required for the scenario
- Configure the wine expense split
- Exclude Ren
- Exclude Nick
- Reflect the resulting participant split
- Update/display the resulting balances
- Show the consolidated debt outcome

---

# 13. Explicitly Out of Scope

The following do not need to be implemented at this stage:

- Payment processing
- Real money transfers
- In-app settlement
- Add Event flow
- Real authentication
- User accounts
- Backend infrastructure
- Persistent database
- Real-time multiplayer/networking
- Push notifications
- External restaurant APIs
- Production-grade expense calculations

These features may exist visually where they are required by the supplied designs, but they do not need to be functional unless they are necessary to complete an in-scope flow.

---

# 14. Non-essential UI

The wireframes or high-fidelity screens may contain buttons, controls or features that are not essential to the three required flows.

These elements may be implemented as visual/non-functional controls.

Examples:

- Secondary actions
- Unused navigation destinations
- Future functionality
- Non-essential settings
- Payment actions
- Add Event actions

A button may do nothing when:

1. It is not required for the primary journey.
2. It is present because the real product would contain it.
3. Making it functional would require implementing an out-of-scope feature.

Do not create fake flows behind these controls just to make every button functional.

Primary-flow interactions must always work.

---

# 15. Application State

Use simple deterministic local state.

The prototype should preserve meaningful state during the demo session.

Examples:

When Ren is added:

`Ren` should subsequently appear in the relevant participant lists.

When a poll is created:

The created poll should subsequently exist in the appropriate poll UI.

When Ari votes:

The selected option should visually update.

When the poll closes:

The winning restaurant should become the selected winner and appear in the itinerary.

When Ren and Nick are excluded from the wine expense:

Their participation state should update and the resulting split should reflect the exclusions.

Real backend persistence is unnecessary.

---

# 16. Poll Behaviour

The prototype should simulate a believable group poll.

Required behaviour:

1. Create three restaurant options.
2. Publish the poll.
3. Display the poll in the appropriate location.
4. Allow a vote.
5. Update the selected state.
6. Update visible results.
7. Identify a leading option.
8. Allow the poll to close.
9. Display the winner.
10. Add the winning restaurant to the itinerary.

The prototype may use mocked votes to simulate the group.

Real-time networking is not required.

---

# 17. Expense Behaviour

The expense flow should communicate the intended product behaviour without requiring production-ready financial infrastructure.

Required behaviour:

1. Log the dinner expense.
2. Configure the wine split.
3. Show participants included in the split.
4. Exclude Ren.
5. Exclude Nick.
6. Reflect the updated split.
7. Show updated participant balances.
8. Show the consolidated debt outcome.

Exact calculations may be mocked or simplified where necessary, provided the resulting UI is coherent and believable.

---

# 18. Visual Rules

The app should closely reflect the supplied Figma designs.

Priorities:

1. Match the high-fidelity screens closely.
2. Follow wireframe layouts for screens without high-fidelity versions.
3. Reuse existing components.
4. Reuse existing tokens.
5. Preserve the established hierarchy and spacing.
6. Preserve the mobile-first layout.
7. Maintain visual consistency when creating missing components.

Use the supplied 393 × 852 viewport as the primary benchmark.

The two supplied high-fidelity screens should be treated as key visual quality references.

---

# 19. Mobile Layout

The primary target is:

393 × 852 px

The application should be optimised for an iPhone Pro-sized viewport.

The two high-fidelity screens already use responsive components.

Preserve that responsive behaviour where appropriate.

Do not optimise the design primarily for large desktop screens.

Avoid introducing desktop navigation or layouts that are not represented in the Figma design.

---

# 20. Demo Experience

The prototype should feel like a coherent product rather than a collection of disconnected mock screens.

A reviewer should be able to understand:

- Where they are
- What action they can take
- What happened after an action
- How the product progresses through the journey
- How the state changes

Primary interactions should never be dead ends.

Secondary/non-essential interactions may remain non-functional as described above.

---

# 21. Development Priorities

Prioritise implementation in this order:

### Priority 1

The complete required journey.

### Priority 2

Accurate implementation of the two high-fidelity screens.

### Priority 3

Accurate wireframe structure for the remaining required screens.

### Priority 4

Meaningful state changes and transitions.

### Priority 5

Reusable components and clean implementation.

### Priority 6

Secondary visual/non-functional controls.

Do not spend significant implementation effort on out-of-scope features before the required journey is complete.

---

# 22. Development Workflow

Before writing the full application:

1. Read this PRD.
2. Read `CLAUDE.md`.
3. Inspect the Figma file through MCP.
4. Identify all screens required for the three in-scope flows.
5. Map the screen IDs.
6. Identify application states.
7. Identify reusable components.
8. Identify missing components.
9. Identify the required design tokens.
10. Create an implementation plan.

Then:

11. Implement the shared foundation.
12. Implement the primary journey.
13. Validate the interactions locally.
14. Compare the implementation with the Figma references.
15. Refine visual differences.
16. Test the entire journey from Home to the final required state.

Do not build every possible product feature before validating the primary journey.

---

# 23. Local Definition of Done

The current implementation is complete when:

- The project runs locally.
- The required screens are implemented.
- The three in-scope flows can be demonstrated.
- The primary journey can be completed without external services.
- The two high-fidelity screens are clearly represented in the implementation.
- Wireframe layouts are respected for screens without hi-fi versions.
- Existing components and tokens are reused.
- Missing components are visually consistent with the design system.
- Primary interactions result in meaningful state changes.
- The app is optimised for the 393 × 852 reference viewport.
- Out-of-scope features do not block the primary journey.

Vercel deployment is intentionally not part of this stage.

---

# 24. Final Implementation Principle

This is a design implementation challenge, not a greenfield product-design exercise.

Do not redesign the product.

Do not reinterpret a wireframe unnecessarily.

Do not implement an earlier IA/flow decision when a later wireframe has replaced it.

Do not prioritise generic engineering conventions over the supplied design when doing so would materially change the prototype.

Translate the existing Figma work into a convincing working product.

When behaviour is defined by the wireframes, follow the wireframes.

When visual styling is defined by the high-fidelity screens, follow the high-fidelity screens.

When something is missing, infer it from the established design system rather than inventing a new visual language.

Focus first on making the required journey work locally.