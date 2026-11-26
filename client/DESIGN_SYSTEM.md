# SATHEE Guidance Agent — Design System

A restrained, academic product UI. Neutral surfaces carry the content; one deep blue marks
the primary action and current state; colour beyond that is reserved for **data (subjects)** and
**status**. All values live as CSS custom properties in `src/styles/tokens.css` — components
never use raw hex values (the one exception is `utils/format.js`, which mirrors the subject and
chart tokens as hex because SVG chart attributes can't read CSS variables).

## Files

| File | Contents |
|---|---|
| `styles/tokens.css` | Colour, type, spacing, radius, elevation, motion, layout tokens |
| `styles/base.css` | Reset, typography & layout utilities, reduced-motion handling |
| `styles/components.css` | Buttons, cards, badges, forms, segmented, tabs, alerts, empty/loading states, progress, lists, tables, dialog, toast, menu, accordion, video |
| `styles/layout.css` | App shell: sidebar, tablet rail, mobile top bar + tab bar + "More" sheet |
| `styles/pages.css` | Feature styles (tasks, dashboard, planner, chat, tests, results, landing, auth) |

## Colour

| Role | Token | Value | Use |
|---|---|---|---|
| Background | `--color-bg` | `#f6f7f9` | App canvas |
| Surface | `--color-surface` | `#ffffff` | Cards, inputs, menus |
| Subtle surface | `--color-surface-subtle` | `#fbfcfd` | Sidebar, card footers, table heads |
| Border | `--color-border` / `-strong` / `-input` | `#e6e9ed` / `#dde1e7` / `#c7cdd6` | Dividers / emphasis / form controls |
| Text | `--color-text` / `-secondary` / `-muted` | `#101828` / `#344054` / `#667085` | Primary / body / meta (muted is 4.9:1 on white) |
| Primary | `--color-primary` | `#2c50c4` | Primary buttons, active nav icon, focus ring, links (6.5:1 on white) |
| Success | `--color-success` | `#0f7a55` | Completed, correct, good score |
| Warning | `--color-warning` | `#a3500b` | Pending from earlier days, marked for review, mid score |
| Danger | `--color-danger` | `#c4320a` | Destructive actions, incorrect, low score |

Status colours always ship with an icon or a text label — never colour alone.

**Subject palette** (data colours): Physics `#3d63d6`, Chemistry `#0c8f80`, Mathematics `#b55a12`,
Biology `#a8741a`, Mixed `#667085`. Validated with a colour-vision-deficiency checker for both
subject sets that actually appear together (JEE: Phy/Chem/Math; NEET: Phy/Chem/Bio). Subjects are
always also named in text (dot + label), so identity never depends on colour.

## Typography

Single family: **Inter** (variable, optical sizes), loaded in `index.html`; tabular numerals
(`.num`) for every changing number.

| Token | Size | Use |
|---|---|---|
| `--text-2xs` | 11px | Overlines, meta only |
| `--text-xs` | 12px | Hints, captions, badges |
| `--text-sm` | 13px | Secondary UI text |
| `--text-base` | 14px | UI body, buttons, inputs |
| `--text-md` | 15px | Reading body, chat, card titles |
| `--text-lg` | 17px | Section headings |
| `--text-xl` / `2xl` / `3xl` | 20 / 24 / 30px | Metrics, page titles, auth & landing headings |

Weights: 400 body, 500 labels/controls, 600 headings & values. Headings use slight negative tracking.

## Spacing, radius, elevation

- **Spacing:** 4px base — `--space-1` (4) … `--space-20` (80). Card padding 20px, page gutter 32px desktop / 24px tablet / 16px mobile.
- **Radius:** 4 / 6 / 8 / 10 / 14px. Controls 8px, cards 10px, dialogs 14px. No pill-shaped cards.
- **Elevation:** `--shadow-xs` (resting cards), `-sm` (hover, active nav), `-md` (sticky bars), `-lg` (menus, dialogs, toasts). Borders do most of the separation work.

## Components

| Component | Variants / notes |
|---|---|
| Button (`.btn`, `ui/Button.jsx`) | `primary` (one per view), `secondary`, `ghost`, `subtle`, `danger`; sizes `sm` 30px, default 36px, `lg` 44px; `btn-icon`; loading = spinner + disabled + `aria-busy` |
| Card | `.card` + `.card-header` (title, subtitle, action) / `.card-body` / `.card-footer` |
| Badge | neutral, primary, success, warning, danger, solid |
| Field (`ui/Field.jsx`) | Visible label, hint, inline error with icon; wires `aria-describedby` / `aria-invalid` |
| Segmented (`ui/Segmented.jsx`) | Single-choice, `aria-pressed`; `sm`, `block` |
| Tabs | Underline tabs, `role=tablist`, arrow-key navigation (Mock tests) |
| Alert | info, warning, danger, success, neutral; optional actions |
| Empty / error states | Icon + title + one sentence + at most one action |
| Skeletons (`ui/Skeleton.jsx`) | Layout-matching page skeletons (`dashboard`, `split`, `grid`, `charts`) |
| Metric strip | Shared `.metrics` row of inline stats — no icon tiles |
| Confirm dialog (`context/ConfirmContext.jsx`) | Promise-based `confirm({ title, description, confirmLabel, tone })`; focus trap, Esc, focus return; bottom sheet on mobile |
| Toast (`context/ToastContext.jsx`) | success / error / info, icon, dismiss button, auto-hide (errors stay longer) |
| Task row (`TaskItem.jsx`) | Checkbox (44px hit area), subject dot, meta, type badge, expandable log form with validation |

## States

- **Hover:** background tint or border darken, 120ms.
- **Focus:** 3px primary ring (`--ring-focus`) on every interactive element; never removed.
- **Active:** one step darker background.
- **Disabled:** 50% opacity, no pointer events.
- **Loading:** skeletons for page/section loads; inline spinner + verb ("Saving") for actions.
- **Error:** inline next to the field; server errors in an alert at the top of the form.

## Charts

Recharts styled through `CHART` in `utils/format.js`: hairline horizontal grid, no axis lines,
12px muted ticks, 4px rounded bar ends, 2px lines with hollow dots, light shared tooltip. One
series = no legend; two series = legend. Subject colours only for per-subject data.

## Layout & responsive

| Breakpoint | Navigation | Content |
|---|---|---|
| ≥ 1081px | 248px grouped sidebar (Today / Learn / Assess), exam countdown, account menu | Primary column + 360px secondary column |
| 721–1080px | 68px icon rail with tooltips | Secondary column becomes a 2-up grid below |
| ≤ 720px | Top bar + bottom tab bar (Home, Plan, Assistant, Tests, More) + "More" sheet | Single column; chat goes full-bleed with a history drawer; tests get a bottom question bar and palette sheet |

## Motion

120–260ms, ease-out, opacity/transform only. `prefers-reduced-motion` disables all animation.

## Accessibility checklist

Skip link · focus moves to `<main>` on navigation · visible focus everywhere · 44px touch targets
on mobile · labelled icon buttons · `aria-live` for toasts, chat and timer warnings · radio-group
semantics and keyboard shortcuts in tests (A–D, ← →, M) · 16px inputs on iOS to prevent zoom.
