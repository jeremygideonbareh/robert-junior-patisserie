# Robert Junior Pâtisserie — demo direction

Reference picked by client: **Palmo** (palmo.co.in). Borrowed only high-level traits: counting preloader,
one long scroll-driven 3D product story, rolling-digit stats, marquee breaks, add-to-basket carousel,
scroll-aware tab title, playful mini-game footer. Identity, copy, assets and code are all new.

- **Visual thesis:** "A tale in layers." The oxblood room from their Instagram → cream paper → gold.
  One set of Blender-made pastries is thrown between stations as you scroll: street → kitchen → counter → tray.
- **Hero focal asset:** 3D croissant (Blender, procedural) with raspberry, blueberry, macaron, berliner and tart orbiting.
- **Type:** Bodoni Moda (display, pâtisserie heritage) · Manrope (UI/body) · Caveat (handwritten ingredient notes, echoes their labelled posts).
- **Colour:** oxblood #5a0e16, night #22060a, cream #f3e8d6, butter #e8c47a, gold #c39a52, raspberry #b3122e.
- **Sections:** Loader → Hero → The Dough (pinned, 3 days) → Numbers (rolling digits) → Process (horizontal) →
  Marquee → The Counter (menu + add to tray) → Our view / your view (drag compare) → "Came for / stayed for" →
  Happiness tray CTA (3D pile) → Footer + catch-the-pastry game.
- **Conversion:** today ordering is "DM us". The site turns that into a tray builder → one tap sends a
  pre-written order to Instagram DM (copied to clipboard). Sticky tray button everywhere, CTAs every 1–2 screens.
- **Motion stack:** GSAP + ScrollTrigger + SplitText, Lenis as the only smooth-scroll engine, Three.js single fixed canvas.
- **Reduced motion:** no Lenis, no scrub, static layouts, canvas replaced by poster.
- **Asset provenance:** photos = client's own Instagram (@robertjuniorpatisserie, scraped 2026-09-24, demo use).
  3D = original, modelled procedurally in Blender 5.2 (`blender/pastries.blend`).
- **Needs client confirmation before launch:** prices, hours, WhatsApp number, "3 days / 27 layers" process claims,
  real reviews (none invented).
