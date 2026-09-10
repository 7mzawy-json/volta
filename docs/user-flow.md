# VOLTA — User Journey & User Flow

> Last updated: 2026-09-01
> Companion to [brand-guidelines.md](./brand-guidelines.md) — this doc maps the two
> course frameworks (User Journey / User Flow) onto concrete VOLTA pages and states.

## Tech Stack

- **React** (functional components + hooks) — frontend only
- **Plain CSS** — CSS Modules per component, all values pulled from
  [`assets/design-tokens.css`](../assets/design-tokens.css) as the single source of truth
- **Vanilla JavaScript** (no TypeScript)
- **react-router-dom** for the 6-page flow below (the one dependency beyond React itself)
- **No backend** — cart state lives in React Context + `localStorage`; product catalog is
  a local mock data file, not a live API; checkout is a visual/demo flow only, no real
  payment processing

---

## User Journey (رحلة المستخدم) — the emotional arc

The five stages from the course framework, each mapped to what has to be *true* at that
moment for VOLTA to feel pleasant rather than just functional.

| # | Stage | Feeling | What VOLTA does about it |
|---|-------|---------|---------------------------|
| 0 | **يكتشف — Discover** | فضول وانتباه (curiosity, attention) | Happens before the site — the Google Flow ad or a social post stops the scroll. Neon-on-black reads instantly as "premium tech," even at a glance |
| 1 | **يدخل — Enter** | أول انطباع وثقة (first impression, trust) | The Home hero: fast load, zero layout shift, one unmistakable CTA, the neon accent used once (not everywhere) so it still reads as a signal |
| 2 | **يستكشف — Explore** | سهولة الوصول (ease of access) | Products page: responsive grid, live search, category filters — always obvious how to narrow down or go back, nothing feels like a dead end |
| 3 | **يتصرف — Act** | جهد واحتكاك (effort, friction — the stage named after the problem to *minimize*) | Product → Cart → Checkout: guest checkout, persistent cart, one-tap add-to-cart with instant visible feedback (badge bounce, mini-cart slide-in, neon pulse burst) — every action gets a response, nothing feels swallowed |
| 4 | **ينجح — Succeed** | ارتياح وفرح (relief, joy) | The order page the shopper lands on from Stripe: a real payoff — the neon bolt, the order summary, and the status turning from *awaiting payment* to *paid* in front of them without a refresh. Not just a text dump of an order number, and not a page that says "confirmed" for something that was never recorded |

---

## User Flow (مسار المستخدم) — هدف، خطوات، ونتيجة

**Goal:** buy a tech accessory with the fewest possible steps and zero dead ends.
**Result:** a confirmed order and a user who'd come back.

| # | Step | Route | What's on it | Purpose |
|---|------|-------|---------------|---------|
| 1 | **الرئيسية — Home** | `/` | Hero, category strip, featured products, trust section | Orient the user, point at one clear next action |
| 2 | **المنتجات — Products** | `/products` | Grid (2/3/4-col responsive), live search, category + price filters, sort | Narrow down to something of interest, fast |
| 3 | **المنتج — Product** | `/products/:id` | Large imagery, price, specs, variant picker, Add to Cart, related products | Build enough confidence to commit |
| 4 | **السلة — Cart** | `/cart` | Line items, quantity controls, subtotal + shipping shown upfront, proceed CTA | Let them double-check with zero hidden surprises |
| 5 | **الدفع — Payment** | `/checkout` | Single page: the Kuwaiti address, the order summary, one pay button. Payment is handed to Stripe in test mode | One page, not a multi-step wizard — this is the friction-minimization step |
| 6 | **تم — Done** | `/orders/:id` | Order summary, live payment status, and the same order kept in `/orders` | The payoff — this is where Journey stage 4 (ينجح) actually lands |

> **Why `/orders/:id` and not a `/confirmation` page.** There was one, and it was a
> mistake: it belonged to demo payment methods that took a made-up card, showed a
> random order number and recorded nothing — so the "confirmation" confirmed an order
> that did not exist and could never appear in *My Orders*. Stripe returns the shopper
> to their real order instead, which is the same page they can open again a month
> later.

### How the two frameworks line up

```
Discover (pre-site: the ad)
   ↓
Enter      → Home (/)
   ↓
Explore    → Products (/products) → Product (/products/:id)
   ↓
Act        → Cart (/cart) → Payment (/checkout) → Stripe
   ↓
Succeed    → Done (/orders/:id, kept in /orders)
```

Six pages, five feelings, one goal. Every step exists either to move the user toward
the goal or to remove a reason they'd abandon it — nothing on this list is decorative.

---

## Friction Checklist (applied at every step)

- No forced account creation anywhere in the flow — guest checkout throughout
- Cart persists across page navigation (localStorage) — never starts over
- Exactly one primary CTA visible per screen (per §7 of brand-guidelines.md)
- Every user action (add to cart, favorite, filter, search) gets *visible* feedback
  within 200ms — no silent state changes
- Checkout is one page, not a multi-step wizard
- Back/forward and the nav are always available — no trapped states
