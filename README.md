# Four Against Darkness — Campaign Ledger

A browser-based campaign tracker for **Four Against Darkness (4AD)** and **Solo Game Master's Guide** journaling, styled as weathered yellow-tan parchment with red-brown ink lines.

## Features

- **4-Character Party Tracker & Marching Order:** Persistent party strip (`#1`–`#4`), quick `+`/`-` Life controls, Alive/Dead/Stone status, Lantern & Bandaged toggles, Core 8 classes + Custom Class with auto-calculated Melee/Ranged/Defense stats, Blessings, Healings, Clues, Gold/Gems/Jewelry, Spells/Scrolls checklist, Equipment, Traits, and Personal Quests.
- **Dual-Mode Multi-Map Dungeon Tracker:**
  - **20×28 Interactive Grid Mode:** Click-and-drag Rooms & Corridors with automatic red-brown outer walls, edge-click Doors/Secret/Locked doors, Stamps (Trap, Stairs, Boss, Treasure, Fountain, Altar), numbered Room Pins, Party Token, Undo, and Zoom.
  - **Paper Map Image Mode:** Upload photos/scans of hand-drawn maps and drop numbered Room Pins and the Party Token directly on top.
- **Solo Game Master's Guide Journal & Story Threads:** Structured entries (`Narrative`, `Oracle Q&A`, `Room / Discovery`, `Combat`, `Settlement`), search & type filters, map/pin linking, and an Active Threads/NPCs/Quests tracker.
- **4AD Dice & Solo Oracle Drawer:** `d6`, `2d6`, `d66`, and exploding `d6!` roller, Likelihood Yes/No/And/But oracle, and Verb/Noun & Twist spark generator with one-click journal logging.
- **Persistence & Export/Import:** Multi-campaign `localStorage` auto-save, full `.json` backup/restore, and `.md` journal export.

## Local Development

```bash
npm install
npm run dev
```

### Scripts

- `npm run build` — Type-check (`tsc -b`) and build production bundle to `dist/`
- `npm run lint` — Run `oxlint src`
- `npm run preview` — Preview the production build locally
