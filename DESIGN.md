# DESIGN.md — CareerPilot landing

## Visual world (niche: editorial career journal)
Warm paper surfaces (`#faf8f4`/`#f3eee4`/`#fffdf9`), deep ink-green brand
(`#1a2e22` family), single gold accent (`#b48327` family). Georgia serif display,
system sans body. Corner system: 8px buttons, 12-16px cards, 16px+ photo frames.
One deliberate polarity flip: dark ink final-CTA panel. Everything else light.

## Landing composition
1. Slim sticky nav (64px, one line) with wordmark and anchor links.
2. Asymmetric split hero: headline left (max 2 lines), 19-word subtext, one
   primary plus one secondary CTA. Right: 3D-tilting photographic collage
   (picsum seeds `careerpilot-desk`, `careerpilot-notes`) with functional
   caption below the images. Warm mesh backdrop at hero scale only.
3. Glance strip: three hairline-divided facts (replaces hero micro-strip).
4. Features bento (6 cells, no equal cards): wide photo cell, standard cells,
   one dark ink cell for rhythm. Two photographic cells minimum.
5. How-it-works as numbered hairline rows with supporting photo (distinct
   family from bento, no card repetition).
6. FAQ accordion, dark final CTA, quiet footer with colophon.

## Motion (one authored moment)
Pointer-driven 3D tilt on the hero collage (CSS vars, no rerenders), slow orb
drift, periodic shine sweep, gentle float on the overlap photo. Scroll reveal
elsewhere. All motion collapses under `prefers-reduced-motion`.

## Hard rules honored
Zero em/en dashes in visible copy. No kickers or eyebrows above headings.
No pills or labels overlaid on images. No fake product UI. Content-matched
photography (desk, notebook, typing, office) with functional captions.
