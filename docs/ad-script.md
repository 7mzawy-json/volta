# VOLTA — Google Flow Ad Script

> 30-second brand film, with a 15-second cutdown.
> Written for **Google Flow** (Veo): each shot is a self-contained prompt, because
> Flow generates clip by clip and then stitches.
> Structure follows the brief: **Hook → Product → Benefit → Brand → CTA**.
>
> Sources of truth: voice and prohibited terms from
> [`brand-guidelines.md` §4](brand-guidelines.md), visual language from its
> *AI Image Generation* section. Arabic is the primary cut; English is the
> secondary, matching the shop.

---

## The idea

**One line: the light goes out, and VOLTA brings it back.**

The film opens on the universal small panic — a device dying — and resolves it
with the bolt. It is built around the existing slogan **اشحن طاقتك / Power Up**,
so the ad ends where the brand already lives rather than inventing a new tagline
for thirty seconds.

The whole film is black with a single neon-green light source. That is not a
style choice for its own sake: it is the identity's core rule (one signal colour
on black), and it means the brand is recognisable in the ad even with the sound
off and the logo not yet on screen.

## Two hard constraints

**1. No real, branded phones appear.** The guidelines forbid generated product
imagery, and a generated "iPhone" that is subtly wrong is worse than not showing
one — it looks like a counterfeit and it is legally careless. So:

- Any phone on screen is an **anonymous dark slab**, shot as silhouette, extreme
  macro, or screen-only. Never a recognisable body, camera array or logo.
- The hero products are **VOLTA's own accessories** — the charging pad, power
  bank, buds case, headphones. Those are fictional and ours to depict, so
  generated imagery of them is legitimate. It also puts the accessories line, the
  part of the catalogue the brand actually owns, at the centre of the brand film.

**2. Prohibited copy stays out.** No "best in the market", no "revolutionary", no
warm/cosy language, no corporate jargon (§4).

**Every claim in the film is one the catalogue actually makes** — free delivery,
two days inside the city, one-year warranty. The 45-minute charge was the one
exception when this was drafted: it existed as a tone example in the guidelines
but no product stated it. Rather than let an ad assert something the shop does
not, the figure was added to the **Surge 65** spec sheet, where a 65W charger can
support it. Ad and catalogue now say the same thing in one place.

---

## The 30-second script

| # | Sec | Beat | On screen (AR / EN) | Voice-over (AR / EN) |
|---|-----|------|--------------------|----------------------|
| 1 | 0–3 | **Hook** | `١٪` | — *(silence)* |
| 2 | 3–5 | Hook | — | — *(the light dies; total black)* |
| 3 | 5–9 | **Product** | — | «كل شي وقف.» / "Everything stopped." |
| 4 | 9–14 | Product | — | «ما تحتاج تنتظر.» / "You don't have to wait." |
| 5 | 14–19 | **Benefit** | `٤٥ دقيقة` / `45 min` | «شحن كامل خلال ٤٥ دقيقة.» / "Full charge in 45 minutes." |
| 6 | 19–23 | Benefit | `توصيل خلال يومين` / `Delivered in 2 days` | «يوصلك خلال يومين.» / "At your door in two days." |
| 7 | 23–27 | **Brand** | VOLTA ⚡ · `اشحن طاقتك` / `Power Up` | «فولتا.» / "VOLTA." |
| 8 | 27–30 | **CTA** | `volta.com.kw` · `شحن مجاني · ضمان سنة` / `Free delivery · 1-year warranty` | «اشحن طاقتك.» / "Power up." |

**Total spoken words:** 14 in Arabic. That is deliberate — §4 asks for short
sentences and one idea per line, and a thirty-second film that talks continuously
is not "clean".

---

## Flow prompts, shot by shot

Paste each block as one Flow prompt. The **style prefix** goes in front of every
one — Flow generates each clip independently, and repeating the prefix is what
keeps eight clips looking like one film.

### Style prefix (prepend to every shot)

```
High-contrast cinematic product film. Matte black background (#0A0A0A).
Dramatic studio lighting with a single neon-green (#39FF14) rim light as the only
colour accent. Deep blacks, punchy whites, generous negative space. Modern,
precise, cyber-minimal. No warm tones, no sand or amber, no secondary neon
colours, no cluttered background, no on-screen text.
```

> Keep "no on-screen text" in the prompt. Generated lettering comes out malformed
> and often misspells Arabic badly. **All type is added in post**, in IBM Plex
> Sans Arabic, over the finished clip.

---

**Shot 1 — Hook · 0–3s**
```
Extreme macro of a single glowing screen corner in total darkness, the only light
in frame. The glow is weak and failing, dimming slowly. Dust particles drift
through the shaft of light. Camera pushes in very slowly. Shallow depth of field.
The device itself is not visible — only the light it casts.
```
*Camera:* slow push in · *Post:* `١٪` fades in bottom-left, small, IBM Plex Sans Arabic

**Shot 2 — Hook · 3–5s**
```
The last glow fades to complete black over two seconds. A faint wisp of light
lingers on a metal edge, then vanishes. Absolute darkness fills the frame. Silent,
still, no movement.
```
*Camera:* locked off · *Post:* hold on black — the film's only full stop

**Shot 3 — Product · 5–9s**
```
In total darkness a single neon-green spark ignites at centre frame and resolves
into a sharp lightning-bolt of light, casting a hard green rim across an unseen
surface. The bolt is symmetrical, clean-edged, and is the only light source.
Slight lens bloom. Camera holds steady as the light stabilises.
```
*Camera:* static · *Note:* this is the BoltMark forming — match the symmetric
two-stroke silhouette from the identity, not a jagged weather bolt

**Shot 4 — Product · 9–14s**
```
A slow orbit around a matte black wireless charging pad and a compact power bank
resting on a black surface, lit from behind by a neon-green rim light that traces
their edges. Premium matte finish, soft micro-texture visible. Products isolated
in black negative space, nothing else in frame.
```
*Camera:* slow 30° orbit · *Note:* VOLTA's own accessories — safe to generate

**Shot 5 — Benefit · 14–19s**
```
Macro shot of a neon-green pulse of light travelling fast along a braided cable
from left to right, trailing a soft glow. The cable is matte black against a black
background. The pulse accelerates as it moves. High shutter speed, crisp motion.
```
*Camera:* tracks the pulse · *Post:* `٤٥ دقيقة` / `45 min` snaps in on the pulse's arrival

**Shot 6 — Benefit · 19–23s**
```
A pair of hands lifts a matte black anonymous device from a charging pad in a
dark room. The screen is bright and even, lighting the hands from below. Only the
hands and the glow are visible; the device body stays in silhouette. Warm human
gesture, cold colour palette.
```
*Camera:* slight handheld rise · *Post:* `توصيل خلال يومين` / `Delivered in 2 days`

**Shot 7 — Brand · 23–27s**
```
A symmetric neon-green lightning-bolt mark glows at centre frame in deep black,
its light blooming softly outward and then settling. The surrounding darkness is
completely clean. Subtle green light falloff on an invisible surface below.
```
*Camera:* static, minimal bloom pulse · *Post:* VOLTA wordmark locks up beside the
bolt; `اشحن طاقتك` / `Power Up` beneath

**Shot 8 — CTA · 27–30s**
```
Pure matte black frame with a single soft neon-green glow low in the composition,
fading gently. Empty, calm, still. No objects, no movement.
```
*Camera:* locked off · *Post:* `volta.com.kw` centred, with
`شحن مجاني · ضمان سنة` / `Free delivery · 1-year warranty` small beneath

---

## Audio

| Element | Direction |
|---|---|
| 0–5s | Near silence. A faint electrical hum that dies with the light in shot 2. |
| 5s | **The bolt hit** — one clean transient. This is the only loud moment; everything after sits under it. |
| 5–23s | Low pulsing synth, tempo rising subtly. Restrained — the brand is "glowing in small doses", not a club track. |
| 23–30s | Resolves to a single sustained tone under the logo, then silence on the CTA card. |
| VO | Male or female, Kuwaiti dialect for the Arabic cut, close-mic and calm. **Not** a hard-sell announcer — §4 rules out "shouty". |

---

## 15-second cutdown (social)

Keeps the arc; drops the second benefit and the orbit.

| # | Sec | From | On screen |
|---|-----|------|-----------|
| 1 | 0–3 | Shot 1 | `١٪` |
| 2 | 3–4 | Shot 2 | — |
| 3 | 4–7 | Shot 3 | — |
| 4 | 7–11 | Shot 5 | `٤٥ دقيقة` / `45 min` |
| 5 | 11–14 | Shot 7 | VOLTA ⚡ `اشحن طاقتك` |
| 6 | 14–15 | Shot 8 | `volta.com.kw` |

VO for the cutdown is one line only: «ما تحتاج تنتظر.» / "You don't have to wait."

---

## Delivery notes

**Aspect ratios.** Generate 16:9 as the master. For 9:16 (Reels, TikTok, Stories)
re-generate rather than crop — shots 4 and 6 are composed horizontally and lose
their negative space when cropped, and negative space is most of the identity.

**Arabic typesetting.** Flow will not set Arabic correctly. All Arabic type is
added in post with proper shaping and RTL. Numerals: the site uses Western digits
in Arabic (`45`, `٪١` shown here as Arabic-Indic for the hook only, where it reads
as a graphic element rather than data). Follow whichever the final edit is
consistent with — do not mix within one cut.

**Continuity across clips.** Flow drifts between generations. Two safeguards:
1. Repeat the style prefix verbatim on every shot.
2. Use shot 3's output as a Flow **reference/ingredient** for shots 4, 5 and 7, so
   the green stays one green rather than drifting between limes and mints across
   the film.

**What to check before signing off.** The green should read as `#39FF14` in the
final grade, black should be `#0A0A0A` and not crushed to pure `#000`, and no
frame should contain a recognisable third-party phone. If a generation produces
something that looks like a real handset, discard it — that is the one failure
that cannot be fixed in post.
