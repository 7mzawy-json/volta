# VOLTA — How to actually make the ad

> Step-by-step production guide for [`ad-script.md`](ad-script.md).
> The script says *what* the film is. This says *what you click, in what order,
> and how you know a take is good enough to keep.*
>
> Budget: **one working day** for a first cut. About 3–4 hours of that is
> generating, the rest is post.

---

## Before you open Flow

**1. Check what you have access to.**
Google Flow lives at [labs.google/flow](https://labs.google/flow) and needs a paid
Google AI plan (Pro or Ultra at time of writing). Ultra matters for two reasons:
more generation credits, and no visible watermark burned into the frame. On the
Pro tier plan around a visible mark in a corner — either live with it, or compose
so it lands in dead black space. *(Flow's UI and tier names move fast; the
concepts below are stable even when the buttons are renamed.)*

**2. Decide the master format now, not later.**
16:9, 1080p, 24fps. Everything downstream inherits it. The 9:16 social cut is
**re-generated, not cropped** — see the script's delivery notes.

**3. Make the folder structure.** You will end up with 25–40 clips and it gets
ugly fast.

```
volta-ad/
  01-generations/     every download, named shot03_take2.mp4
  02-selects/         the one keeper per shot, renamed shot03.mp4
  03-titles/          Arabic/English title cards as PNG with alpha
  04-audio/           VO takes, hum, synth bed, the bolt hit
  05-export/          final masters
```

**4. Get the brand assets out of the code.**
The bolt is already exported for you at [`assets/bolt-mark.svg`](../assets/bolt-mark.svg)
— it is the exact geometry the site draws, so the ad and the storefront cannot
drift apart. Install **IBM Plex Sans Arabic** locally (Google Fonts, free) before
you make any title card.

Colours, memorised, because you will type them a dozen times:

| | Hex | Use |
|---|---|---|
| Neon | `#39FF14` | The only colour in the film |
| Black | `#0A0A0A` | Ground. **Not** `#000000` |
| White | `#FFFFFF` | Type, sparingly |

---

## Stage 1 — Generate the bolt first

**Do not generate in script order.** Shot 3 is the moment the neon green is
established, and Flow drifts between generations — left alone it will give you a
lime green in one clip and a mint in the next. So:

1. Generate **shot 3** until you have a green you are happy with.
2. Add that clip (or a still frame from it) as a **reference / ingredient** for
   shots 4, 5 and 7.
3. Then generate everything else.

That single reordering is the difference between eight clips and one film.

**Suggested order:** 3 → 7 → 4 → 5 → 6 → 1 → 2 → 8.

---

## Stage 2 — Flow setup

1. New project, name it `VOLTA — Power Up 30s`.
2. Pick **Text-to-Video** for shots 1–5, 7, 8. Shot 6 (hands) is the one worth
   trying **Frames-to-Video** on if the hands come out wrong — generate a clean
   still first, then animate from it.
3. Set aspect **16:9**, highest resolution offered.
4. **Turn generated audio off, or ignore it.** Veo will happily invent a
   soundtrack; you cannot get eight independently-invented soundtracks to match.
   All audio is designed in post (Stage 6). Every clip gets muted in the edit.

Flow generates in fixed clip lengths (around 8 seconds). Every shot in this film
is 2–5 seconds, so **you will trim, not extend.** Generating long and cutting in
is fine — it also gives you a choice of which second is the best second.

---

## Stage 3 — The eight prompts, ready to paste

Each block below already has the style prefix merged in. Paste the whole block.
Do not "improve" the prefix between shots — repeating it verbatim is what holds
the look together.

Under each: **what a good take looks like**, so you stop rolling when you have it.

---

### Shot 3 — the bolt ignites · 4s · *generate this one first*

```
High-contrast cinematic product film. Matte black background (#0A0A0A). Dramatic
studio lighting with a single neon-green (#39FF14) rim light as the only colour
accent. Deep blacks, punchy whites, generous negative space. Modern, precise,
cyber-minimal. No warm tones, no sand or amber, no secondary neon colours, no
cluttered background, no on-screen text.

In total darkness a single neon-green spark ignites at centre frame and resolves
into a sharp lightning-bolt of light, casting a hard green rim across an unseen
surface. The bolt is symmetrical, clean-edged, and is the only light source.
Slight lens bloom. Camera holds steady as the light stabilises.
```

✅ **Keep it if:** the bolt is symmetrical and clean-edged, the green is vivid
rather than pastel, and the background stays black rather than lifting to grey.
❌ **Bin it if:** the bolt is a jagged weather-cartoon zigzag, there are multiple
bolts, or a second colour (blue, orange) creeps into the bloom.

> Expect 3–5 attempts. This is the shot worth spending credits on.

---

### Shot 7 — the brand mark · 4s

```
[same style prefix]

A symmetric neon-green lightning-bolt mark glows at centre frame in deep black,
its light blooming softly outward and then settling. The surrounding darkness is
completely clean. Subtle green light falloff on an invisible surface below.
```

✅ Centred, stable, nothing else in frame — this clip is a **background for the
logo lockup**, so busy is bad.
❌ Any drifting camera; the wordmark you add in post will drift with it.

> Shortcut: if Flow keeps giving you an asymmetric bolt, generate a plain
> "soft neon-green glow blooming in black" and composite `bolt-mark.svg` over it
> in the editor. The real logo beats a generated approximation of the real logo,
> every time.

---

### Shot 4 — the accessories orbit · 5s

```
[same style prefix]

A slow orbit around a matte black wireless charging pad and a compact power bank
resting on a black surface, lit from behind by a neon-green rim light that traces
their edges. Premium matte finish, soft micro-texture visible. Products isolated
in black negative space, nothing else in frame.
```

✅ Rim light traces the *edges*; objects read as premium matte, not glossy plastic.
❌ Anything that looks like a branded product, any visible logo, any phone.

---

### Shot 5 — the charge pulse · 5s

```
[same style prefix]

Macro shot of a neon-green pulse of light travelling fast along a braided cable
from left to right, trailing a soft glow. The cable is matte black against a black
background. The pulse accelerates as it moves. High shutter speed, crisp motion.
```

✅ One clean pulse with a readable direction of travel — the `٤٥ دقيقة` card
lands on its arrival, so you need a definite arrival.
❌ Multiple pulses, or a pulse that fizzles mid-frame.

> **RTL note:** the pulse travels left→right. In the Arabic cut that reads
> backwards against the language. If you are perfectionist about it, mirror the
> clip horizontally for the Arabic master — it costs one checkbox in the editor
> and no extra credits.

---

### Shot 6 — the hands · 4s

```
[same style prefix]

A pair of hands lifts a matte black anonymous device from a charging pad in a
dark room. The screen is bright and even, lighting the hands from below. Only the
hands and the glow are visible; the device body stays in silhouette. Warm human
gesture, cold colour palette.
```

✅ The device stays a **silhouette**. Hands look like hands.
❌ Six fingers; a recognisable handset shape; a visible camera array. This is the
shot most likely to produce something you legally cannot use — check it frame by
frame before you keep it.

> Hardest shot in the film. Budget the most attempts here, and if it will not
> come good, cut it and hold shot 4 longer. Losing it costs the film less than a
> bad take does.

---

### Shot 1 — the dying screen · 3s

```
[same style prefix]

Extreme macro of a single glowing screen corner in total darkness, the only light
in frame. The glow is weak and failing, dimming slowly. Dust particles drift
through the shaft of light. Camera pushes in very slowly. Shallow depth of field.
The device itself is not visible — only the light it casts.
```

✅ You can feel the light failing within the clip. Dust catches the beam.
❌ The device becoming identifiable as the camera pushes in.

---

### Shot 2 — to black · 2s

```
[same style prefix]

The last glow fades to complete black over two seconds. A faint wisp of light
lingers on a metal edge, then vanishes. Absolute darkness fills the frame. Silent,
still, no movement.
```

> **Save your credits.** This is a fade to black. If shot 1 gave you a good take,
> just fade shot 1 out over 2 seconds in the editor and skip this generation
> entirely. Only generate it if you specifically want the metal-edge wisp.

---

### Shot 8 — the CTA card · 3s

```
[same style prefix]

Pure matte black frame with a single soft neon-green glow low in the composition,
fading gently. Empty, calm, still. No objects, no movement.
```

> **Save your credits here too.** A black frame with a soft radial green gradient
> low in frame is a two-minute job in any editor, and you get exact control over
> where the type sits. Generate it only if you want organic light movement.

---

## Stage 4 — Selecting takes

For each shot, watch every take **muted, at full screen**, and ask three
questions in this order:

1. **Is there a real phone in it?** If yes, delete it now, before you get
   attached. This is the one failure that cannot be fixed in post.
2. **Is the green the same green as shot 3?** Hold them side by side.
3. **Is the black actually black?** Flow often lifts blacks to charcoal. Small
   lifts are fixable with a curves adjustment in post; a grey wash is not.

Rename the winner `shot03.mp4` and move it to `02-selects/`. One file per shot,
no "maybe" folder — a maybe folder is how you end up recutting at 2am.

---

## Stage 5 — Title cards (all type is added here, none is generated)

Flow cannot set Arabic. It produces letterforms that look like Arabic and are
not, which in a submission about a Kuwaiti brand is the worst possible error. So
every piece of type is made separately and laid over the video.

**The reliable way to get correctly shaped Arabic:** set it in something that
does real text shaping — Figma, Illustrator, Photoshop, or a browser page — then
export **PNG with transparency** at 1920×1080.

Cards you need:

| File | Content | Style |
|---|---|---|
| `t1-battery.png` | `١٪` | Small, bottom-left, white, 60% opacity |
| `t5-charge.png` | `٤٥ دقيقة` / `45 min` | Large, centred, white |
| `t6-delivery.png` | `توصيل خلال يومين` / `Delivered in 2 days` | Medium, lower third, white |
| `t7-brand.png` | Bolt + `VOLTA` + `اشحن طاقتك` / `Power Up` | Bolt neon, wordmark white, slogan smaller |
| `t8-cta.png` | `volta.com.kw` + `شحن مجاني · ضمان سنة` | URL white, claims small and dimmer |

Rules for all of them: **IBM Plex Sans Arabic**, tight tracking, white type
(neon is a *fill* colour here, not a text colour — it is the site's rule and it
holds on video), and generous margins. If type touches the frame edge, it is too
big.

Make the Arabic set and the English set as separate files. You are delivering two
cuts, not one cut with bilingual clutter.

---

## Stage 6 — Assembly

Any editor works. **DaVinci Resolve** is free and colour-grades properly;
CapCut is faster if you have never edited before. Timeline: 1920×1080, 24fps.

Lay the picture first, exactly to the script's timings:

| Sec | Clip | Overlay |
|---|---|---|
| 0:00–0:03 | shot 1 | `t1-battery` fades in at 0:01 |
| 0:03–0:05 | shot 2 (or shot 1 fading out) | — |
| 0:05–0:09 | shot 3 | — |
| 0:09–0:14 | shot 4 | — |
| 0:14–0:19 | shot 5 | `t5-charge` snaps in when the pulse arrives |
| 0:19–0:23 | shot 6 | `t6-delivery` |
| 0:23–0:27 | shot 7 | `t7-brand` |
| 0:27–0:30 | shot 8 | `t8-cta` |

**Cuts, not dissolves.** One exception: 0:03–0:05 is a fade, because the script
wants the light to die rather than be cut away from.

Then grade: match every clip's green to shot 3, and pull blacks down to `#0A0A0A`
without crushing them to pure black. Check on a phone screen as well as a laptop
— the film is 90% black and dark grades lie on bright monitors.

---

## Stage 7 — Audio

Mute every generated clip. Build four layers:

| Layer | Where | What |
|---|---|---|
| Hum | 0:00–0:05 | Faint electrical hum, dying with the light |
| **The hit** | 0:05 | One clean transient on the bolt. Loudest moment in the film — everything after sits under it |
| Bed | 0:05–0:23 | Low pulsing synth, tempo rising subtly. Restrained |
| Resolve | 0:23–0:30 | Single sustained tone under the logo, silence on the CTA |

**Voice-over**, four lines, 14 words in Arabic:

| At | Arabic | English |
|---|---|---|
| 0:05 | «كل شي وقف.» | "Everything stopped." |
| 0:09 | «ما تحتاج تنتظر.» | "You don't have to wait." |
| 0:14 | «شحن كامل خلال ٤٥ دقيقة.» | "Full charge in 45 minutes." |
| 0:19 | «يوصلك خلال يومين.» | "At your door in two days." |
| 0:23 | «فولتا.» | "VOLTA." |
| 0:27 | «اشحن طاقتك.» | "Power up." |

Kuwaiti dialect, close-mic, calm. **Not an announcer** — the brand voice rules
out shouty. Record it on a phone in a quiet room with a coat over your head if
you have no booth; that genuinely sounds better than a treated room without one.
If you use a synthetic voice, pick a Gulf Arabic voice, not Modern Standard — MSA
in a Kuwaiti retail ad sounds like a news bulletin.

Mix so the VO sits clearly above the bed, and leave the last second silent.

---

## Stage 8 — The 15-second cutdown

Do not re-edit from scratch. Duplicate the 30s timeline and cut it down:

| Sec | From |
|---|---|
| 0:00–0:03 | shot 1 · `١٪` |
| 0:03–0:04 | shot 2 |
| 0:04–0:07 | shot 3 |
| 0:07–0:11 | shot 5 · `٤٥ دقيقة` |
| 0:11–0:14 | shot 7 · brand lockup |
| 0:14–0:15 | shot 8 · `volta.com.kw` |

One VO line only: «ما تحتاج تنتظر.» / "You don't have to wait."

For the 9:16 version, **re-generate shots 4 and 6 in vertical**. They are composed
horizontally and cropping eats the negative space, which is most of the identity.
The other shots are centred and crop acceptably.

---

## Stage 9 — Export

| Deliverable | Format |
|---|---|
| Master | 1920×1080, H.264, 24fps, ~20 Mbps, AAC 320kbps |
| Social 9:16 | 1080×1920, same codec |
| Cutdown | Both ratios, 15s |

Name them `volta-30s-ar-16x9.mp4` and so on. You will be handing these in
alongside the site; ambiguous filenames cost marks.

---

## Sign-off checklist

Run this before you call it done. Every line is a real failure mode.

- [ ] **No recognisable third-party phone in any frame.** Scrub frame by frame
      through shots 1 and 6. This is the only unfixable error.
- [ ] Green reads as `#39FF14` across all eight clips — no lime/mint drift
- [ ] Black is `#0A0A0A`, not crushed to `#000` and not lifted to grey
- [ ] Every Arabic word correctly shaped and joined, right-to-left
- [ ] Numerals consistent — Arabic-Indic *or* Western within one cut, never both
- [ ] No generated lettering anywhere in frame
- [ ] Claims match the catalogue: free delivery, two days, one-year warranty,
      45-minute charge (the Surge 65 spec sheet is where that last one lives)
- [ ] No prohibited copy: no "best in the market", no "revolutionary", no
      corporate jargon
- [ ] Bolt is the symmetric two-stroke mark, not a weather zigzag
- [ ] Watched once with sound off — the brand is still identifiable
- [ ] Watched once on a phone at low brightness — the dark grade survives

---

## When Flow fights you

| Symptom | Fix |
|---|---|
| Green drifts between clips | You skipped the ingredient step. Re-generate with shot 3 as reference |
| Blacks come out grey | Add `deep crushed blacks, high contrast, underexposed background` to the prompt |
| Text appears in frame | The prefix already says no on-screen text; add `no text, no letters, no numbers, no watermarks, no UI` |
| A real-looking phone appears | Add `no phone, no smartphone, no consumer electronics logos, device in silhouette only` |
| Camera drifts on shots 7–8 | Add `locked-off camera, tripod shot, no camera movement` |
| Too warm / orange bloom | Add `cool colour temperature, no warm light, no orange, no amber, no tungsten` |
| Clip too busy | Add `single subject, empty background, extreme negative space` |

---

## Rough budget

| Shot | Attempts to expect |
|---|---|
| 3 (bolt) | 3–5 — worth the spend |
| 6 (hands) | 4–8 — hardest |
| 4, 5 | 2–3 each |
| 1 | 2–3 |
| 7 | 2–3 |
| 2, 8 | 0 — build them in the editor |

**~20 generations for the 30s master**, plus 4–6 more for the vertical re-shoots.
Check your plan's credit allowance against that before you start, and generate
shot 3 first so that if you do run out, you ran out with the important shot
already in the bag.
