# GRIDIRON DB — CSS UI kit

Sharp-bordered football-database interface on a grass field ground, built on the
Organic design system tokens.

## Files

- `football-db.css` — the kit: tokens, reset, layout, panels, nav, buttons, tags,
  inputs, segmented tabs, filter chips, data table, pagination, stat tiles,
  meters, alerts, hero, photo placeholder, scoreboard, modal, utilities.
- `organic-styles.css` — the Organic design-system stylesheet (tokens it builds on).
- `index.html` — a working demo using only those classes (live search, row select,
  chips, tabs, toggle, modal in ~50 lines of vanilla JS).

## Use

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caprasimo&family=Figtree:wght@400;600;800&display=swap">
<link rel="stylesheet" href="organic-styles.css">
<link rel="stylesheet" href="football-db.css">
```

## Theming

Override in your own `:root` — everything reads from these:

```css
:root {
  --fb-accent: #e0a117;   /* CTA / highlight */
  --fb-grass: #3d472b;    /* field ground */
  --fb-shadow: 6px;       /* hard offset shadow depth */
  --fb-ink: #20261a;      /* borders + dark panels */
}
```

## Conventions

State is a class, never a separate component: `.is-active`, `.is-selected`,
`.is-sorted`, `.is-on`. Every border is square — the reset enforces
`border-radius: 0` globally; the only round shape is the football brand mark.
