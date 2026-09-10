# Sticker Hub · Neo-Brutalism (React)

Neo-Brutalist skin for Sticker Hub, built in **React (Vite)** on top of the
**Gumroad Foundry design-system architecture**, and patched onto the original
Material 3 page **without deleting a single line of it**.

## How the patch works

| Layer | File | Role |
| --- | --- | --- |
| Old UI (untouched) | `../index.html` | Material 3 app — fully intact, still functional |
| Patch bootstrap | `nb/nb-patch.js` | Appends `#__nb_root__` overlay + floating M3⇄NB switcher, lazy-loads the bundle |
| Patch chrome CSS | `nb/nb-patch.css` | Styles for overlay / splash / switcher only (`.nbp-*` scoped) |
| React app | `nb/dist/nb-app.js` | Self-contained bundle (React + lottie-web + jszip) |

* Default view is **Neo-Brutalism**; the floating bottom-left button (or the
  `M3` button in the top bar) switches back to Material 3.
* Choice persists in `localStorage['tg_ui_view_nb']`; `?ui=nb|m3` overrides.
* The bot token uses the **same** localStorage key as the M3 app, so tokens
  and (optionally) history work across both skins.
* Revert = delete the two `nb/` lines appended to `../index.html`.

## Gumroad-Foundry-style architecture

```
nb/src/
├── tokens/            # design tokens (JS source of truth)
│   ├── colors.js      #   raw palette → semantic tokens (light/dark)
│   ├── spacing.js typography.js radii.js shadows.js motion.js zindex.js
│   └── index.js       #   registry + toCssVarMap()
├── styles/            # "compiled" token CSS + scoped base/layout
│   ├── tokens.css     #   --nb-* custom properties, data-theme swap
│   ├── base.css       #   scoped reset, checker, spinner, scrollbar
│   └── layout.css     #   app shell
├── icons/             # chunky SVG icon set (primitive)
├── components/        # one folder per component: index.jsx + styles.css
│   ├── Button/ Card/ Badge/ TextField/ StatusBadge/ ProgressBar/
│   ├── Snackbar/ EmptyState/ ThemeSwitch/ TopBar/ MediaCard/
│   ├── SetPanel/ HistoryList/ TgsPlayer/
├── lib/               # ported logic: tgCore, mediaParser, downloadManager,
│   │                  # tokenManager (same key/salt as M3), tgs, utils, fonts
├── hooks/             # useTheme, useStickerHub (polling controller)
├── App.jsx            # composition root
└── main.jsx           # mountNBApp() ← consumed by nb/nb-patch.js
```

Design decisions:

* **Elevation** = hard offset shadows (`4px 4px 0 ink`), not blur — the
  defining Neo-Brutalist trait; pressed state "slams" the element into the
  page (translate + zero shadow).
* **Borders** are always 2–3px solid `outline` (ink in light, light-ink in
  dark); radii stay 0–4px.
* **Theming** swaps only the semantic layer (`data-theme` on `.nb-theme`),
  Foundry-style: components never reference raw palette values.
* Everything is scoped under `.nb-app` / `#__nb_root__` / `.nbp-*`, so the
  Material 3 page underneath is never restyled.

## Scripts

```bash
cd nb
npm install
npm run dev     # standalone dev server → http://localhost:5173/
npm run build   # → nb/dist/nb-app.js (what the patch loads)
```

> `nb/dist/` is committed on purpose: the static patch loads it directly,
> no build step is needed to serve the repo root.
