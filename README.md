# Portfolio Website

Live at https://josephcin1.github.io/ — served by GitHub Pages from the `docs/` folder. No build step: edit, commit, push.

## How it's organized

```
docs/
  index.html                 loads React + Babel from a CDN, then the three scripts below
  data/
    site.json                name, headline, about, skills, contact links
    projects.json            the project cards on the home page (order = display order)
    projects/<slug>.json     one spotlight page per project
  assets/
    js/charts.jsx            chart components (bar, diverging bar, funnel, confusion matrix)
    js/blocks.jsx            section renderers + the BLOCKS registry
    js/app.jsx               routing (#/project/<slug>) and page layout
    css/style.css            theme tokens at the top (colors, fonts), light + dark
    resume.pdf
```

## Common edits

**Change text about me** → `docs/data/site.json`.

**Add a project**
1. Add an entry to `docs/data/projects.json` with a new `slug`.
2. Create `docs/data/projects/<slug>.json` (copy an existing one as a template).

**Remove or hide a project** → delete its entry in `projects.json`, or add `"hidden": true` to keep it for later.

**Reorder projects** → reorder the entries in `projects.json`.

**Spotlight sections** — each item in a project's `sections` array has a `type`:

| type | what it draws | key fields |
|---|---|---|
| `text` | heading + paragraphs | `title`, `body` (string or array) |
| `stats` | number tiles | `items: [{value, label}]` |
| `list` | bullet list | `items: [string]` |
| `callout` | highlighted takeaway | `title`, `body` |
| `table` | data table | `columns`, `rows` |
| `steps` | numbered process | `items: [{title, body}]` |
| `formula` | monospace formula box | `lines`, `body` |
| `week` | 7-day schedule strip | `days: [{day, events: []}]` |
| `bar` | horizontal bar chart | `data: [{label, value}]`, `format`, `max`, `showValues` |
| `diverging` | gains vs losses around zero | `data: [{label, value}]`, `format` |
| `funnel` | shrinking pipeline stages | `steps: [{label, value, note}]` |
| `confusion` | classifier confusion matrix | `labels`, `matrix` |
| `matchScore` | Travel Guide interactive scorer | see `travel-guide.json` |

Formats: `int`, `dec1`, `dec2`, `pct0`, `pct1`, `usd`.

To add a new section type, write a component in `blocks.jsx` (or `charts.jsx`) and add it to the `BLOCKS` registry.

## Run locally

```
cd docs
python -m http.server 8000
```
Then open http://localhost:8000. (Opening `index.html` directly won't work: the browser blocks loading the JSON files from disk.)
