# myTasks. myNotes. myLinks.

> A three-column personal productivity dashboard — zero dependencies, zero server, zero security compromises. Available in **French** and **English**.

## Security — why this project can be used anywhere

This is one of the dashboard's greatest strengths. Here is why it poses **no risk** in a secure environment:

| Criterion        | This project                                                                  |
| ---------------- | ----------------------------------------------------------------------------- |
| Network requests | **None** — no CDN, no API, no tracking                                        |
| External deps    | **None** — plain HTML, CSS and Vanilla JavaScript only                        |
| Server required  | **No** — opens directly via `file://` in the browser                          |
| Data sent        | **Never** — everything stays on your machine (`localStorage` only)            |
| Installation     | **None** — no executable, no package manager, no admin rights                 |
| Auditable code   | **Yes** — a handful of readable files, nothing minified or obfuscated         |

> **In practice**: you can open this on any machine without internet access, or in any environment where installing tools or reaching external services is not possible. It makes no outbound connections, loads nothing from the outside, and stores your data only where you choose.

---

![Dashboard preview](mon_dashboard.png)

![Diagraming preview](mes_diagrammes.png)

## Why this project?

Some environments have **no internet access** or don't allow installing tools: no task-tracking software, no CDN, nothing from the outside.

Yet your productivity depends on your ability to **log your tasks**, your **notes** and your **useful links** somewhere — and find them again each morning.

This project solves that problem: a **single HTML file** you drop on your desktop that works in any browser, even offline.

---

## The three panels

### myTasks. — Task manager

Add tasks in an instant, sort them by priority, tick them off as the day goes on.

- Three priority levels: **Urgent**, **Normal**, **Later**
- Status filters: All, To do, Done, Urgent, Normal, Later
- Checkbox to mark a task as complete
- Individual deletion

### myNotes. — Structured notepad

Everything you need to remember, organised as notes made of freely stackable blocks.

- Five block types per note:
  - **Title** — short bold text to structure the note
  - **Text** — free paragraph
  - **Code** — monospace block with grey background (commands, regex, snippets…)
  - **List** — bullet points
  - **Table** — columns separated by `|`, first line = headers
- Each note has a customisable colour
- Add, edit and delete notes and blocks in edit mode

### myLinks. — Useful link directory

Your links organised by category, accessible in one click.

- Customisable categories with a colour of your choice
- Displayed with name and description
- Add, edit and delete in edit mode

### myDiagrams. — Diagram editor

A lightweight SVG diagram editor accessible via the diagram icon (top-right of the dashboard).

- Five shape types: **Rectangle**, **Rounded rectangle**, **Database** (cylinder), **Cloud** (external service), **Free text**
- Draw **arrows** between shapes by clicking source → target, or by dragging from a connection dot
- **Double-click** on any shape (or use the ✎ button) to edit its label inline
- **Colour** each shape with the six theme colours
- **Resize** shapes by dragging the bottom-right handle
- **Pan** by dragging on the canvas background; **zoom** with the mouse wheel or toolbar buttons
- Manage multiple diagrams from the ☰ panel

---

## Data persistence

Everything is saved automatically in the browser's `localStorage` — your content survives browser restarts.

- **Auto-save**: every change is saved instantly with a brief "✓ Saved" indicator (Google Docs style)
- **Export/Import**: optional JSON backup via the administration page — download all your data or restore from a previous backup

## Administration page

The ⚙ icon in the top-right corner of the dashboard opens `admin.html`. It lets you:

- **Choose the language** — switch between Français and English (saved in localStorage)
- **Export (JSON)** — download all your data (tasks, notes, links, diagrams) as a backup file
- **Import (JSON)** — restore data from a previously exported backup
- **Clear localStorage** — resets to the default sample data on next load

## Internationalisation

The interface is available in **French** (default) and **English**. The language is chosen from the administration page and stored in `localStorage`.

Translations live in the `i18n/` folder:

| File           | Role                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| `i18n/fr.js`   | French translations (`var i18n_fr`)                                        |
| `i18n/en.js`   | English translations (`var i18n_en`)                                       |
| `i18n/i18n.js` | Engine: reads `localStorage["lang"]`, exposes `window.t` and `applyI18n()` |

---

## Quick start

### Standalone file (simplest)

Download `dist/doc-survival-kit-{version}.html` from this repository and open it in Chrome or Edge. That's it — everything is bundled in a single file.

### Via npx (recommended)

```bash
npx doc-survival-kit
```

Creates a `doc-survival-kit/` folder in the current directory and opens the application automatically in the browser. Subsequent runs simply open the application without overwriting anything.

> Requires Node.js >= 16.7. Works best in Chrome or Edge.

### Without any tool

1. Copy the following files and folder into a new directory:

- `index.html`
- `admin.html`
- `diagram.html`
- `diagram.js`
- `diagrammes.js`
- `liens.js`
- `mesLiens.js`
- `mesNotes.js`
- `notes.js`
- `style.css`
- `taches.js`
- `i18n/` (entire folder)

2. Open `index.html` in Chrome or Edge
3. That's it.

Sample content is already present in each panel to give you an idea of what you can put there.

### Manually

1. Clone or download this repository
2. Open `index.html` in Chrome or Edge
3. That's it.

```bash
git clone https://github.com/ymedaghri/doc-survival-kit.git
cd doc-survival-kit
open index.html   # macOS
# or
start index.html  # Windows
```

---

## Tech stack

| Technology    | Detail                                       |
| ------------- | -------------------------------------------- |
| HTML          | Semantic structure, no framework             |
| CSS           | Separate styles in `style.css`, no framework |
| JavaScript    | Vanilla, no third-party library              |
| Local storage | Browser `localStorage` (auto-save)           |

---

## Build

To generate a standalone HTML file from the source:

```bash
npm run build
```

This creates `dist/doc-survival-kit-{version}.html` — a single file containing all three pages (dashboard, admin, diagrams) with hash-based navigation. The standalone file works identically to the multi-file version.

---

## Author

**Youssef MEDAGHRI-ALAOUI**
[craftskillz.com](https://www.craftskillz.com/posts/stay-secure-and-productive)

---

## License

This project is distributed under the **MIT** licence — you are free to use, modify and redistribute it, including in commercial projects, provided you retain the original author credit.
