# Deploying VOLTA

Four services, in an order that avoids waiting on things that do not exist yet.

- **MongoDB Atlas** — the database
- **Stripe** — payments, in test mode
- **Render** — the API (`server/`)
- **Vercel** — the storefront

**Do not paste any secret key into a chat, an issue, or a commit.** Every one of them
goes straight from the provider's dashboard into Render's or Vercel's environment settings.
`server/.env` is gitignored and `render.yaml` marks every credential `sync: false`, which is
what makes it safe to commit that file at all.

---

## The two circular dependencies, and how this order breaks them

Read this first; it is the only genuinely awkward part.

1. **Vercel needs Render's URL** (to proxy `/api`), and **Render needs Vercel's URL**
   (for `SITE_ORIGIN`, used by CORS and by the addresses Stripe returns shoppers to).
2. **Stripe's webhook needs Render's URL**, and **Render needs Stripe's webhook secret**,
   which only exists once the webhook does.

Both are broken by *choosing the names up front* so the URLs are predictable:

| Service | Name to claim | Resulting URL |
|---|---|---|
| Render | `volta-api` | `https://volta-api-6hbb.onrender.com` |

> Render appends a random suffix when the name you ask for is taken, which is
> what happened here — the service is `volta-api-6hbb`, not `volta-api`. Check
> the URL it actually gives you and make sure `vercel.json` matches it, because
> nothing warns you: the proxy simply returns 404 for every API call.
| Vercel | `volta` | `https://volta.vercel.app` |

`vercel.json` already points at `volta-api-6hbb.onrender.com`. If either name is taken, pick
another and **change it in the two places noted in steps 4 and 5** — nothing else depends on
them.

Loop 2 still needs one return visit: Stripe's webhook secret is added to Render in step 6,
after the endpoint exists. The API boots fine without it; only the webhook route refuses
requests, which is the correct failure.

---

## 1. MongoDB Atlas — the database

1. Create a free account at <https://www.mongodb.com/cloud/atlas>, then a **free M0 cluster**.
   Any region; the nearest one to Kuwait keeps latency low.
2. **Database Access** → *Add New Database User*. Username and password, "Read and write to
   any database". Save the password somewhere safe — Atlas will not show it again.
3. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`).

   > This one catches people out. Render's free tier has no fixed outbound IP, so an
   > allow-list of specific addresses will fail intermittently and look like a database
   > outage. Allowing anywhere is normal for this tier; the database is still protected by
   > the username and password.

4. **Connect** → *Drivers* → copy the connection string. It looks like:

   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

5. Fix two things in it before using it:
   - Replace `<password>` with the real password. **If it contains `@ : / ? # [ ] %`, percent-encode
     those characters** — an unencoded `@` splits the URL in the wrong place and the driver
     reports a confusing host error.
   - Insert the database name before the `?`, so it reads `.../volta?retryWrites=...`.
     Without it everything lands in a database called `test`.

Keep the finished string for step 4.

---

## 2. Stripe — keys now, webhook later

1. Create an account at <https://dashboard.stripe.com>. **Stay in Test mode** — the toggle is
   at the top right and should say *Test mode* throughout.
2. **Developers → API keys** → copy the **Secret key**. It starts `sk_test_`.

   > If it starts `sk_live_` you are about to take real money. Switch to Test mode and copy
   > again.

3. That is all for now. The webhook needs the API's URL, so it is step 6.

You do **not** need the publishable key: the shopper is redirected to Stripe's own hosted
Checkout page, so no card details are ever handled by this site's code.

---

## 3. Push the repository

Already done if you are reading this from the repo, but for completeness:

```bash
git push origin main
```

Both Render and Vercel deploy from GitHub, so anything not pushed will not be deployed.

---

## 4. Render — the API

1. Sign in at <https://render.com> with GitHub and give it access to the `volta` repository.
2. **New → Blueprint**, pick the repository. Render reads [`render.yaml`](../render.yaml) and
   proposes a web service called **`volta-api`**.

   > Blueprint rather than a manual web service: the YAML already sets the root directory,
   > the build and start commands, the health check path and the full list of environment
   > variables. Doing it by hand is four more chances to mistype something.

   If the name `volta-api` is unavailable, rename it here **and** update the `destination`
   host in [`vercel.json`](../vercel.json).

3. Render prompts for each `sync: false` variable. Fill them in:

   | Variable | Value |
   |---|---|
   | `MONGODB_URI` | the Atlas string from step 1 |
   | `SITE_ORIGIN` | `https://volta.vercel.app` — the URL you will claim in step 5 |
   | `EXTRA_ORIGINS` | leave empty |
   | `STRIPE_SECRET_KEY` | the `sk_test_…` key from step 2 |
   | `STRIPE_WEBHOOK_SECRET` | leave empty for now; step 6 fills it |

   `JWT_SECRET` is generated by Render itself (`generateValue: true` in the blueprint), so it
   is not one of the prompts and you never have to invent one. Changing it later logs everyone
   out, which is the intended emergency behaviour.

4. Deploy. When it finishes, check the health endpoint:

   ```bash
   curl https://volta-api-6hbb.onrender.com/api/health
   ```

   Expect `{"ok":true,"service":"volta-api","payments":true}`. `payments:false` means the
   Stripe key did not save.

   > **The free tier sleeps after about fifteen minutes idle.** The first request after that
   > takes roughly fifty seconds while the container wakes. That is not a bug and it is worth
   > knowing before you demo — open the site a minute before you present.

---

## 5. Vercel — the storefront

1. Sign in at <https://vercel.com> with GitHub, **Add New → Project**, import `volta`.
2. Settings that matter:
   - **Project name**: `volta` (this is what makes the URL `volta.vercel.app`)
   - **Root Directory**: leave at the repository root — *not* `server`
   - **Framework Preset**: Vite. Build command and output directory come from
     [`vercel.json`](../vercel.json); leave them alone.
### What the two rewrites in `vercel.json` are for

`vercel.json` carries no comments. Vercel validates it strictly and rejects any
property it does not recognise — including the `"//"` key that some tooling accepts
as a comment — so the reasoning lives here instead.

**`/api/:path*` → the Render service.** The browser only ever talks to the Vercel
origin, never to Render directly. That is deliberate: a same-origin proxy keeps the
session cookie **first-party**, so it needs neither `SameSite=None` nor CORS, and
browsers are actively phasing third-party cookies out. It is also why the API sets
the cookie `SameSite=Lax`. The destination host must match the service Render
actually created — see the suffix warning above.

**`/(.*)` → `/index.html`.** The SPA fallback. Vercel checks the filesystem *before*
applying rewrites, so the 46 prerendered route files still serve themselves and their
own Open Graph tags; this only catches paths that match no file, and lets React
Router render the storefront's own 404 page.

3. **Environment Variables** → add one:

   | Variable | Value |
   |---|---|
   | `VITE_SITE_ORIGIN` | `https://volta.vercel.app` |

   This is what the build bakes into every page's `og:url` and canonical link. Without it the
   build still succeeds, prints a warning, and link previews fall back to a relative `/` —
   see [`README.md`](../README.md#deploying).

   Do **not** set `VITE_BASE`. It is only for GitHub Pages, which serves from a subpath;
   Vercel serves from the root and the default of `/` is correct.

4. Deploy, then check three things:

   ```bash
   curl -s https://volta.vercel.app/api/health          # the proxy reaches Render
   curl -s https://volta.vercel.app/products/iphone-17-pro-max | grep og:url
   ```

   The first proves `/api` is being rewritten to Render. The second should show an absolute
   `og:url` on your own domain — if it shows `/`, `VITE_SITE_ORIGIN` was not set at build
   time, so set it and redeploy.

5. If you renamed the Vercel project, go back to Render and update `SITE_ORIGIN` to match.
   Sign-in will fail with a CORS error until those two agree.

---

## 6. Stripe — the webhook

Now that the API has a URL, close the second loop.

1. **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL**: `https://volta-api-6hbb.onrender.com/api/webhooks/stripe`

   > Point it at **Render directly**, not at the Vercel domain. Stripe talks server to
   > server; there is no reason to send it through the front end's proxy.

3. **Select events** — exactly two:
   - `checkout.session.completed`
   - `checkout.session.expired`
4. Create it, then reveal the **Signing secret**. It starts `whsec_`.
5. Back in Render → your service → **Environment** → set `STRIPE_WEBHOOK_SECRET` to that
   value and save. Render redeploys automatically.

   Until this is set the webhook route rejects every request. That is deliberate: without the
   secret the endpoint cannot tell Stripe apart from anyone else on the internet, and a
   webhook that trusts unsigned input is an open "mark my order paid" button.

---

## 7. Prove it works

1. Open <https://volta.vercel.app>, create an account, add something to the basket, go to
   checkout, fill in the address, choose **Stripe**, press **Pay with Stripe**.
2. On Stripe's page use a test card:

   | Field | Value |
   |---|---|
   | Number | `4242 4242 4242 4242` |
   | Expiry | any future date |
   | CVC | any three digits |
   | Postcode | any |

3. You land back on the order page showing **awaiting payment**, and it flips to **paid** on
   its own within a few seconds — no refresh. That transition is the webhook arriving.
4. Check it end to end: **Stripe → Developers → Webhooks → your endpoint** shows the delivery
   with a `200`. If it shows `400`, the signing secret does not match; re-copy it into Render.

Other things worth trying, since they are the parts the coursework asks about:

- Sign out, and confirm the review form disappears while everyone's reviews stay readable.
- Sign in as a second person and confirm you can edit and delete only your own review.
- With that second account, open the browser console on a product page and try to change the
  other person's review directly. It should answer `403`:

  ```js
  const list = await fetch('/api/products/iphone-17-pro-max/reviews').then(r => r.json());
  const notMine = list.reviews.find(r => !r.mine);
  await fetch(`/api/reviews/${notMine.id}`, {
    method: 'DELETE', credentials: 'include'
  }).then(r => r.status);   // 403
  ```

---

## The other two deployments

This repository still deploys to **Netlify** (by hand, from a zip) and to **GitHub Pages**
(automatically, via [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml)).

Neither has an API. The storefront, catalogue, comparison, cart and currency switcher all
work there; **sign-in, reviews and payment do not**, because `/api` resolves to nothing.

Pick one of three:

- **Make Vercel canonical** and stop the others — delete the workflow file, and delete the
  Netlify site. Simplest, and stops three URLs drifting apart.
- **Keep Pages as a static shop window** and accept that accounts do not work there. If you
  do, say so on the page rather than leaving people at a broken login.
- **Point Pages at the same API** by adding a `/api` proxy — GitHub Pages cannot do this. It
  serves static files only. It would need Cloudflare in front, which is more moving parts
  than this is worth.

---

## When something is wrong

| Symptom | Cause |
|---|---|
| Login hangs, then "could not reach the server" | Render is asleep. Wait ~50s and retry. |
| Login fails with a CORS error in the console | `SITE_ORIGIN` on Render does not match the Vercel URL exactly — check for a trailing slash or `http` vs `https`. |
| `payments:false` at `/api/health` | `STRIPE_SECRET_KEY` is missing or misnamed on Render. |
| Checkout returns 503 | Same as above. |
| Order stays "awaiting payment" forever | The webhook is not arriving. Check the delivery log in Stripe; a `400` means the signing secret is wrong, no attempt at all means the endpoint URL is wrong. |
| Link previews show `/` instead of a real URL | `VITE_SITE_ORIGIN` was not set when Vercel built. Set it and redeploy. |
| Database errors mentioning a host that does not resolve | The Atlas password contains a character that needs percent-encoding. |

## Running it all locally instead

No accounts needed for everything except payment:

```bash
cd server && npm install && npm run dev:memory   # API + throwaway in-process MongoDB
npm run dev                                       # storefront on :5173
```

`dev:memory` is a separate entry point on purpose — a production server that quietly starts
its own empty database when `MONGODB_URI` is missing would look healthy while losing every
write. Checkout returns 503 until `STRIPE_SECRET_KEY` is set in `server/.env`; everything
else works, and the data disappears when you stop the process.
