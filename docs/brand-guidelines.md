# VOLTA — Brand Guidelines v2.0

> Last updated: 2026-09-01
> Status: Draft — pending final sign-off before build
> Supersedes: v1.0 (NABD) — full identity pivot, see Changelog

## Brand Concept

**VOLTA** — a curated electronics accessories shop (chargers, audio, phone & laptop
accessories, small smart-home gadgets) for young professionals and students in the
Gulf/MENA region who want their tech to look as good as it works. The name evokes
voltage/electricity — direct, high-energy, unmistakably tech. The mark is a **symmetric
neon-green thunderbolt**: two mirrored bolt strokes meeting at a central point, forming
a balanced diamond-like silhouette rather than the usual single-direction jagged bolt —
it reads as a logo mark first, a lightning bolt second, and scales cleanly down to a
favicon.

This is a full pivot from the earlier warm/boutique direction (v1.0, "NABD") to a bold,
high-contrast, tech-forward identity: black-dominant surfaces, a single unmistakable
neon-green signal color, white for content and contrast.

**Slogan:** اشحن طاقتك — *"Power Up"*

## Quick Reference

| Element | Value |
|---------|-------|
| Primary Color | #39FF14 |
| Secondary Color | #0A0A0A |
| Accent Color | #FFFFFF |
| Primary Font | IBM Plex Sans Arabic |
| Voice | قوي · نقي · متوهج (Powerful, Clean, Glowing) |

---

## 1. Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Neon Green | #39FF14 | rgb(57,255,20) | The one signal color: primary CTA fill, hover borders/glows, active states, links |
| Neon Green Deep | #2ECC0F | rgb(46,204,15) | Hover/active on the primary CTA (the CTA is the one element that's neon by default, so hover *deepens* rather than brightens) |
| Neon Green Bright | #6BFF4D | rgb(107,255,77) | Rare — pressed/flash micro-states only |

### Secondary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Black | #0A0A0A | rgb(10,10,10) | Page background (off-black, not pure #000 — easier on screen at large fills) |
| Surface | #16171A | rgb(22,23,26) | Card/box background, sits just above the page background |
| Surface Elevated | #1F2023 | rgb(31,32,35) | Hover background lift on cards/boxes |

### Accent Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| White | #FFFFFF | rgb(255,255,255) | Primary text/content color on black |
| Border Gray | #2A2C30 | rgb(42,44,48) | Default box borders (neutral until hovered) |
| Muted Gray | #9A9AA1 | rgb(154,154,161) | Secondary/caption text on black |

### Semantic Colors

| State | Hex | Usage |
|-------|-----|-------|
| Success | #39FF14 | Reuses brand neon — "success" and "brand" are the same signal here by design |
| Warning | #EAB308 | Low stock, pending states |
| Error | #EF4444 | Form errors, out-of-stock |
| Info | #3B82F6 | Informational banners/toasts |

Error/Warning/Info stay off the black-white-neon palette on purpose — they need to read
as distinct system states, not be mistaken for brand/interactive accents.

### Accessibility

- White (#FFFFFF) on Black (#0A0A0A): 20.1:1 (AAA)
- Neon Green (#39FF14) on Black (#0A0A0A): 15.7:1 (AAA) — safe for text, icons, and fills
- Black text (#0A0A0A) on Neon Green (#39FF14) fill: 15.7:1 (AAA) — this is why the
  primary CTA uses black text on a neon fill, not white-on-neon
- Muted Gray (#9A9AA1) on Black: 7.4:1 (AAA) — safe for secondary/caption text
- All interactive elements meet WCAG 2.1 AA; touch targets ≥ 44×44px

---

## 2. Typography

Unchanged from v1.0 — still Arabic-first with one type family covering both scripts, so
the AR↔EN nav toggle never breaks the identity. Lean harder into bold/black weights for
headings here to carry the "strong visual hierarchy" and "tech-savvy" requirements
through type contrast rather than color alone (color is reserved for the neon signal).

### Font Stack

```css
--font-heading: 'IBM Plex Sans Arabic', 'IBM Plex Sans', system-ui, -apple-system, sans-serif;
--font-body: 'IBM Plex Sans Arabic', 'IBM Plex Sans', system-ui, -apple-system, sans-serif;
--font-mono: 'IBM Plex Mono', 'JetBrains Mono', monospace;
```

### Type Scale

| Element | Size (Desktop) | Size (Mobile) | Weight | Line Height |
|---------|----------------|---------------|--------|-------------|
| H1 | 52px | 34px | 700 | 1.2 |
| H2 | 36px | 28px | 700 | 1.25 |
| H3 | 26px | 22px | 600 | 1.3 |
| H4 | 20px | 18px | 600 | 1.4 |
| Body | 16px | 16px | 400 | 1.6 |
| Body Large | 18px | 18px | 400 | 1.6 |
| Small | 14px | 14px | 400 | 1.5 |
| Caption | 12px | 12px | 400 | 1.4 |

### Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## 3. Logo Usage

### Mark Description

A **symmetric thunderbolt**: two mirrored zigzag strokes meeting at a shared center
point, forming a balanced diamond-like silhouette (not the usual asymmetric single-
direction lightning bolt). Solid Neon Green (#39FF14), with a soft neon glow
(blur ~12px, same hue at low opacity) behind it on dark backgrounds. Pairs with the
"VOLTA" wordmark (uppercase, bold, tight tracking) or "فولتا" in Arabic mode.

### Variants

| Variant | File | Use Case |
|---------|------|----------|
| Wordmark (EN) | logo-volta-en.svg | English mode nav/header |
| Wordmark (AR) | logo-volta-ar.svg | Arabic mode nav/header |
| Bolt Mark Only | logo-bolt-icon.svg | Favicon, app icon, small spaces |
| Monochrome (white) | logo-mono-white.svg | On neon-green surfaces, print, single-color contexts |

### Clear Space

Minimum clear space = height of the bolt mark on all sides.

### Minimum Size

| Context | Minimum Width |
|---------|---------------|
| Digital — Full Wordmark | 110px |
| Digital — Bolt Icon | 24px |
| Print — Full Wordmark | 30mm |
| Print — Bolt Icon | 10mm |

### Don'ts

- Don't rotate, skew, or break the mirror symmetry of the bolt
- Don't recolor the bolt outside Neon Green / White-mono / Black-mono
- Don't place the neon bolt on mid-tone backgrounds — it needs black (or white, using
  the mono variant) to read at full contrast
- Don't stack a glow effect on the bolt AND on surrounding UI at once — one glow source
  per view keeps the neon accent feeling intentional, not noisy

---

## 4. Voice & Tone

### Brand Personality

| Trait | Description |
|-------|--------------|
| **قوي (Powerful)** | Direct, confident, high-energy — short sentences, active verbs |
| **نقي (Clean)** | Minimal-friction copy — no filler, one idea per line, generous white/black space |
| **متوهج (Glowing)** | The neon accent shows up in language too — used for emphasis, sparingly, never everywhere |

### Voice Chart

| Trait | We Are | We Are Not |
|-------|--------|------------|
| Powerful | Direct, confident | Aggressive, shouty |
| Clean | Minimal, precise | Sterile, robotic |
| Glowing | Energetic in small doses | Neon-everywhere, exhausting |

### Tone by Context

| Context | Tone | Example |
|---------|------|---------|
| Marketing/Hero | Bold, benefit-led | "طاقة تشحن يومك." |
| Product page | Clear, specific | "شحن كامل خلال 45 دقيقة." |
| Error messages | Calm, solution-focused | "ما لقينا نتائج — جرّب كلمة ثانية." |
| Success/confirmation | Brief, energetic | "تمت الإضافة ⚡" |

### Prohibited Terms

| Avoid | Reason |
|-------|--------|
| الأفضل في السوق / "best in the market" | Unverifiable generic superlative |
| ثوري / "revolutionary" | Overused |
| دافئ / "cozy", "warm" language | Belonged to the retired v1.0 direction — off-brand now |
| Corporate jargon (synergy, leverage, disruptive) | Breaks the direct/powerful voice |

---

## 5. Imagery Guidelines

### Photography Style

- **Lighting:** Dramatic, high-contrast studio lighting on black backgrounds, with a
  neon-green rim light or reflection as the signature accent — the opposite of soft/warm
- **Subjects:** Product isolated on black, or in-hand against a dark environment
- **Color treatment:** Deep blacks, punchy whites, neon-green highlight only — no warm
  tones, no busy multicolor backgrounds
- **Composition:** Clean, high-contrast, one clear focal subject, negative space in black

### Icons

- Style: Outlined, 24px base grid, 1.5px stroke, white by default
- On hover/active: stroke shifts to Neon Green
- Fill: None (outline only), except badges/counters which are solid neon with black glyphs

### Content Note — Demo Products

The prototype ships with **placeholder/demo tech products** (e.g. wireless earbuds,
charging pads, power banks, a smartwatch, a mechanical keyboard) — this is a concept
build, not a live catalog, so product content should look real enough to demonstrate
the UI/UX (real-sounding names, prices, specs) without claiming to be an actual SKU.

---

## 6. Design Components

**Consistency rule:** every interactive surface — buttons, product cards, nav items,
inputs — shares the *same* corner radius and the *same* hover language. One visual
grammar, applied everywhere, is what makes the UI read as "consistent" rather than
assembled from parts.

### The Hover Language

- **Default state:** dark surface (#16171A), 1px neutral border (#2A2C30), white text/icon
- **Hover state:** border shifts to Neon Green + a soft neon glow appears
  (`0 0 20px rgba(57,255,20,0.35)`), surface lifts one step (#16171A → #1F2023),
  transition 200ms ease-out
- **Exception — the Primary CTA:** filled solid Neon Green *by default* (not just on
  hover) with black text, since it must win visual hierarchy immediately. Hover deepens
  the fill to Neon Green Deep (#2ECC0F) rather than adding glow (it's already the
  brightest thing on screen)

### Buttons

| Type | Default | Hover | Border Radius |
|------|---------|-------|----------------|
| Primary | Neon Green fill, black text | Neon Green Deep fill | 14px |
| Secondary | Transparent, white border, white text | Border → Neon Green + glow | 14px |
| Tertiary (text-only) | Muted gray text | Text → Neon Green | — |

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight spacing |
| sm | 8px | Compact elements |
| md | 16px | Standard spacing |
| lg | 24px | Section spacing |
| xl | 32px | Large gaps |
| 2xl | 48px | Section dividers |

### Border Radius — one shared value

| Element | Radius |
|---------|--------|
| Buttons, cards, inputs, product cards, nav items | **14px** (the one "smooth edged box" radius, used everywhere for consistency) |
| Badges/counters (small circular indicators) | 9999px (pill — the one deliberate exception, for genuinely circular elements) |
| Modals / mini-cart drawer | 20px (slightly larger, matching the "bigger surface → bigger radius" pattern) |

---

## 7. UX Principles

These are the working rules for the build, not just descriptors — each maps to a
concrete implementation decision.

| Principle | What it means in practice |
|-----------|---------------------------|
| **Minimal UX friction** | Guest checkout, no forced signup to browse/add-to-cart, persistent cart across pages, exactly one primary CTA visible per screen, no interrupting modals on entry |
| **Consistent interactive UI** | Every box (button/card/input/nav item) uses the same 14px radius and the same default→hover color-shift language (see "The Hover Language" above) — no per-component one-offs |
| **Strong visual hierarchy** | Hierarchy comes from three levers used together: type scale/weight, spacing, and the fact that Neon Green *only ever* marks the single most important interactive element in view — it never gets diluted into decoration |
| **Responsive design** | Mobile-first grid: 2 columns mobile → 3 tablet → 4 desktop; nav collapses to a slide-out drawer below tablet width; sticky bottom cart bar on mobile |
| **Smooth page transitions** | Route changes cross-fade + slide up slightly (300ms, `cubic-bezier(0.4,0,0.2,1)`); product-card → product-detail uses a shared-element transition (the product image morphs into place) rather than a hard cut; loading states use a pulsing neon-outline skeleton, never a generic spinner |
| **Demo tech products** | See Imagery Guidelines above — realistic placeholder catalog, not a real inventory |

---

## 8. Responsive Breakpoints

Built and delivered as **three explicit versions**, not just fluid scaling — each tier
gets deliberate layout decisions, not the same layout squeezed smaller.

| Breakpoint | Range |
|------------|-------|
| Phone | 0–767px |
| Tablet | 768–1023px |
| Desktop | 1024px+ |

| Region | Phone | Tablet | Desktop |
|--------|-------|--------|---------|
| **Navigation** | Hamburger → full-screen slide-out drawer; logo + search icon + cart icon inline; language switch inside the drawer | Hamburger drawer still used, but with a persistent inline search bar (not just an icon) since there's more width | Fully inline: logo, category links, search bar, wishlist, cart, language switch — all in one sticky row |
| **Hero** | Stacked: image band on top (capped height so the CTA is visible without scrolling), headline + CTA below, full-width | Split layout begins here: text ~45% / product visual ~55%, side by side | Same split as tablet, scaled up with the desktop type scale and more generous padding |
| **Product grid** | 2 columns | 3 columns | 4 columns |
| **Product card interaction** | Quick-add + favorite icons **always visible** (no hover on touch) — tap the card to open product detail | Same as phone — still a touch-first surface | Icons hidden by default, revealed on hover along with the image crossfade (mouse-driven hover works here) |
| **Cart** | Sticky bottom bar (item count + total + "View Cart"), thumb-reachable; opens a full-screen cart drawer | Top-right cart icon with badge → side drawer | Top-right cart icon with badge → side drawer |
| **Typography** | Uses the "Mobile" column from the Type Scale table | Uses the "Desktop" column (tablet screens are wide enough — no separate third scale) | Uses the "Desktop" column |
| **Section spacing** | Reduced — `lg` (24px) between sections to limit scroll fatigue | Full scale — `2xl` (48px) between sections | Full scale — `2xl` (48px) between sections |

The touch-vs-hover split on product cards matters more than it looks: the neon
hover-glow language (§6) is a mouse-driven affordance and simply doesn't fire on a
touchscreen, so phone/tablet can't rely on "hover reveals the button" — those controls
have to be visible by default there, or the quick-add action becomes undiscoverable.

---

## AI Image Generation

### Base Prompt Template

Always prepend to image generation prompts:

```
High-contrast tech product photography, matte black background (#0A0A0A),
dramatic studio lighting, a single neon-green (#39FF14) rim light or reflection
as the signature accent, clean negative space, premium tech-forward aesthetic —
no warm tones, no cluttered multicolor backgrounds.
```

### Style Keywords

| Category | Keywords |
|----------|----------|
| **Lighting** | dramatic studio lighting, high contrast, neon-green rim light |
| **Mood** | powerful, clean, glowing, high-energy, precise |
| **Composition** | centered, isolated subject, generous black negative space |
| **Treatment** | deep blacks, punchy whites, single neon accent only |
| **Aesthetic** | modern tech, cyber-minimal — not warm, not cluttered, not multicolor-neon |

### Visual Don'ts

| Avoid | Reason |
|-------|--------|
| Warm/soft lighting, sand tones | That was the retired v1.0 (NABD) direction |
| Multiple neon colors (pink, blue, purple together) | Breaks the "one signal color" discipline |
| Busy/cluttered backgrounds | Contradicts the high-contrast minimal aesthetic |

### Example Prompts

**Hero Banner:**
```
High-contrast tech product photography, a pair of wireless earbuds and their
charging case on a matte black surface, dramatic side lighting, a neon-green
(#39FF14) rim light tracing the case edge, deep black background, generous
negative space on the left third for headline text, premium cyber-minimal aesthetic.
```

**Social Media Post:**
```
Close-up shot, hand holding a matte-black power bank with a thin neon-green
(#39FF14) status strip glowing, dark environment, dramatic single-source
lighting, minimal composition, high-contrast tech-forward feel.
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-09-01 | Initial guidelines — NABD identity (warm/boutique direction) |
| 2.0 | 2026-09-01 | Full pivot to VOLTA — new name, symmetric neon-green thunderbolt mark, black/neon-green/white palette, added UX Principles section (minimal friction, consistent hover language, visual hierarchy, responsive, smooth page transitions, demo product content) |
