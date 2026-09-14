# TripUp — prototype

Mobile-first React/Vite prototype of the TripUp group-travel app, built from the
Figma file (`3HCMZXGRzeZAUXX0loktCs`) and `PRD.md`.

Reference viewport: **393 × 852** (iPhone Pro). On a desktop browser the app
renders inside a phone frame; below 460px wide it fills the screen.

```bash
npm install
npm run dev     # http://localhost:5173
```

---

## Demo script — the required journey

1. **Home (S01)** — tap the arrow on the **Lisbon** card.
2. **Trip Itinerary (S02)** — the hi-fi screen: map, calendar strip, event cards.
   The whole trip is planned out — tap any day in the strip. **21 April** opens
   with the inbound flight, **27 April** ends with the outbound one, and the days
   between line up with the seeded expenses (Tram 28 on the 23rd, Time Out Market
   on the 24th, Fado on the 25th, MAAT on the 26th).
3. **Add Ren** — tap the avatar stack in the header → **Travel Buddies (S05)** →
   **+** → **Search Buddy (S06)** → tap **Ren** → **Add Buddy**.
   Ren now appears in the header stack and every participant list.
4. **Create the poll** — tap **+** in the tab bar → **New Poll**.
   - **S07** — type (or accept) *"Where are we eating tonight?"*. Both time rows
     start at **None**; tap either one to open the iOS-style wheel sheet (day /
     hour / minute, with **Clear** and **Done**) → **Continue**.
   - **S08** — two options are pre-filled; tap a **Nearby** suggestion to add a third → **Send poll**.
5. **Poll is live** — a live-poll card appears in the itinerary at 20:00.
6. **Vote (S09)** — tap the card, pick an option, **Submit vote**.
7. **Results update (S10 / S20 hi-fi)** — the rest of the group votes in over a few
   seconds, the percentages move, and *"Left to vote"* counts down for real.
8. **The poll closes itself** — there is no close button. A poll resolves as soon
   as everyone has voted, or when the deadline runs out, whichever comes first.
   With the deadline left at **None** it simply waits for the last vote, and a
   poll with no event time sits at the end of the day until it resolves.
   The winner then replaces the poll card in the itinerary as a real event card
   with its photo, address and walking/bus time from MAAT.
9. **Log the dinner** — **+** → **Log expense**.
   - **S12** — key in `186`, the "For" field → **Next**.
   - **S13** — **Paid … Equally / By** — Ari is selected → **Next**.
   - **S14 → S15** — switch **Split** to **By item**. The bill breaks into
     *Mains to share*, *Mezze & sides*, *House wine*.
10. **Exclude Ren and Nick from the wine (S16)** — tap the avatar stack on the
    **House wine** row, deselect **Ren** and **Nick**, **Confirm**.
    Their share drops from $26.57 to $18.00; the wine drinkers go to $30.00.
11. **S17 Summary** → **Log Expense**.
12. **Balances update** — the expenses tab total goes $1347 → $1533 and
    *"You owe $53"* becomes *"You are owed $103"*.
13. **Consolidated debts** — tap the balance card → **Breakdown**: every balance,
    then the netted transfers — **6 transfers instead of 31**.

---

## Screen map

| ID | Screen | Where |
|----|--------|-------|
| S01 | All Trips | `src/screens/HomeScreen.tsx` |
| S02 | Trip Itinerary (**hi-fi**) | `src/screens/TripScreen.tsx` → `ItineraryTab` |
| S03 | Trip Expenses | `src/screens/TripScreen.tsx` → `ExpensesTab` |
| S04 / S11 | Add sheet | `src/sheets/AddSheet.tsx` |
| S05 / S06 | Travel Buddies, Search Buddy | `src/sheets/BuddiesSheets.tsx` |
| S07–S10, S20 (**hi-fi**) | Poll question, options, vote, results | `src/sheets/PollSheets.tsx` |
| S12–S17 | Bill total, paid by, split, per-item buddies, summary | `src/sheets/BillSheets.tsx` |
| — | Consolidated debts breakdown | `src/sheets/BreakdownSheet.tsx` |

Icons in `src/components/Icons.tsx` are the **actual vectors exported from
Figma** — every path is Figma's, with the ink colours swapped for `currentColor`.
Three icons are hand-drawn because the file has no vector for them (the keypad
delete key, which is a screenshot in the wireframe, plus the chevron and check
used by the breakdown sheet and toast); they are marked as such in the file.

Components in `src/components/` map 1:1 to the Figma design-system components:
`Header` (shared by S01 and S02/S03), `EventCard`, `FlightCard`, `DistanceTime`,
`CalendarStrip` (TabBar/Calendar), `TabBar`,
`Sheet` + `SheetButton` (Sheet Primary Button), `PollOptionRow` (Poll Option variant
set), `Avatar` / `BuddiesPreview` (Buddies Preview 4), `TransactionGroup`, `MapCard`,
`SpendDonut`.

Tokens live in `src/styles/tokens.css` and mirror the Figma variables
(`Background/*`, `Text/Colour/*`, `Text/Size/*`, `Button/*`). Type is
**Plus Jakarta Sans** at −1.9% tracking, as specified in the hi-fi screens.

---

## The clock

The prototype runs on **trip time**, not wall-clock time: `src/state/clock.ts`
starts the app at 16:00 on Friday 26 April 2026 and advances in real time. That
makes the 18:30 deadline genuinely 2h 30min away when the demo opens — the
figure the wireframes show — and lets the countdown and the deadline-based
auto-close be real rather than faked. Pick a deadline in the past from the wheel
to watch a poll resolve on expiry instead of on votes.

## Numbers

The seed data is tuned so the app reproduces the figures drawn in the Figma
screens exactly:

- Trip total **$1347** (the hi-fi expenses ring)
- **You owe $53** before the dinner (wireframe S03)
- MAAT Ticket **−$18**, Breakfast **−$4.50**, Souvenirs **$21.13** (wireframe S03)

Balances are computed, not mocked — `src/state/money.ts` holds the share,
balance and settle-up logic, and every balance set sums to zero.
Consolidation is greedy largest-debtor / largest-creditor matching.

---

## Deliberately not functional

Per `PRD.md` §13–14 these exist visually but do nothing: Smart add, Transport /
Stay / Spot or event (Add Event), Scan Bill, Settle now, notifications, share and
navigate buttons on event cards, the poll option info buttons, and the two
upcoming trips on Home.
