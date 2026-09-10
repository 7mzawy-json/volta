import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Each language also pins a THEME, so a single pass scans both palettes rather
// than scanning whichever one happens to be the default twice. The pairing is
// arbitrary — what matters is that neither palette goes unscanned. Dark is the
// shop's default, so it goes with the default language.
const languages = {
  ar: {
    switchLabel: null,
    direction: 'rtl',
    theme: 'dark',
    addToCart: 'أضف إلى السلة',
    cartDialog: 'سلة التسوق',
    close: 'إغلاق',
    fullName: 'الاسم الكامل',
    governorate: 'المحافظة',
    city: 'المدينة / المنطقة',
    block: 'قطعة',
    street: 'شارع',
    building: 'منزل / مبنى',
    phone: 'رقم الهاتف',
    placeOrder: 'تأكيد الطلب',
    profileTitle: 'حسابي',
    deleteAccount: 'احذف حسابي'
  },
  en: {
    switchLabel: 'English',
    direction: 'ltr',
    theme: 'light',
    addToCart: 'Add to Cart',
    cartDialog: 'Your Cart',
    close: 'Close',
    fullName: 'Full Name',
    governorate: 'Governorate',
    city: 'City / Area',
    block: 'Block',
    street: 'Street',
    building: 'House / building',
    phone: 'Phone Number',
    placeOrder: 'Place Order',
    profileTitle: 'My account',
    deleteAccount: 'Delete my account'
  }
};

function describeViolations(violations) {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => ({
      target: node.target,
      checks: node.any.map((check) => check.data || check.message)
    }))
  }));
}

async function scan(page, testInfo, label, language) {
  await page.locator('main').waitFor({ state: 'visible' });
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
  await page.locator('main').evaluate(async (main) => {
    const pageTransition = main.parentElement;
    const finiteAnimations = pageTransition
      ? pageTransition.getAnimations({ subtree: true })
        .filter((animation) => animation.effect.getTiming().iterations !== Infinity)
      : [];
    await Promise.all(finiteAnimations.map((animation) => animation.finished.catch(() => undefined)));
  });

  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.locator('html')).toHaveAttribute('dir', languages[language].direction);
  // Asserted, not assumed: a scan that silently fell back to the other theme
  // would report a clean palette twice and cover neither.
  const theme = await page.locator('html').getAttribute('data-theme');
  expect(theme, `${label} should be in the ${languages[language].theme} palette`)
    .toBe(languages[language].theme === 'dark' ? 'dark' : null);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  await testInfo.attach(`${label}-axe.json`, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json'
  });
  expect(describeViolations(results.violations), `${label} has axe violations`).toEqual([]);
}

// Wishlist and compare are read from storage at boot, so seeding has to happen
// before any page script runs. Without this the suite scanned three empty
// states: an empty wishlist, an empty comparison page, and every route with the
// compare tray absent.
const SEEDED_COMPARE = ['iphone-17-pro-max', 'iphone-17-pro'];
const SEEDED_WISHLIST = ['iphone-17-pro-max'];

async function seedBrowsingState(page, theme) {
  await page.addInitScript(
    ([compare, wishlist, chosenTheme]) => {
      localStorage.setItem('volta-compare', JSON.stringify(compare));
      localStorage.setItem('volta-wishlist', JSON.stringify(wishlist));
      // Written before any page script runs, so public/boot.js reads it and the
      // first paint is already in the theme under test.
      if (chosenTheme) localStorage.setItem('volta-theme', chosenTheme);
    },
    [SEEDED_COMPARE, SEEDED_WISHLIST, theme]
  );
}

async function openInLanguage(page, language) {
  await seedBrowsingState(page, languages[language].theme);
  await page.goto('/');
  if (languages[language].switchLabel) {
    await page.getByRole('button', { name: languages[language].switchLabel, exact: true }).click();
  }
}

async function completeCheckout(page, labels) {
  await page.getByRole('textbox', { name: labels.fullName, exact: true }).fill('Noura Al-Sabah');
  await page.getByRole('combobox', { name: labels.governorate, exact: true }).selectOption('capital');
  await page.getByRole('textbox', { name: labels.city, exact: true }).fill('Salmiya');
  await page.getByRole('textbox', { name: labels.block, exact: true }).fill('3');
  await page.getByRole('textbox', { name: labels.street, exact: true }).fill('40');
  await page.getByRole('textbox', { name: labels.building, exact: true }).fill('12A');
  await page.getByRole('textbox', { name: labels.phone, exact: true }).fill('55551234');
  await page.getByText('Apple Pay', { exact: true }).click();
  await page.getByRole('button', { name: labels.placeOrder, exact: true }).click();
  await expect(page).toHaveURL(/\/confirmation$/);
}

for (const [language, labels] of Object.entries(languages)) {
  test(`${language} customer flow has no automated WCAG A/AA violations`, async ({ page }, testInfo) => {
    await openInLanguage(page, language);
    await scan(page, testInfo, 'home', language);

    for (const [label, path] of [
      ['products', '/products'],
      ['wishlist', '/wishlist'],
      ['compare', '/compare'],
      ['not-found', '/definitely-missing']
    ]) {
      await test.step(label, async () => {
        await page.goto(path);
        await scan(page, testInfo, label, language);
      });
    }

    await page.goto('/products/iphone-17-pro-max');
    await scan(page, testInfo, 'product', language);
    await page.getByRole('button', { name: labels.addToCart, exact: true }).first().click();
    await expect(page.getByRole('dialog', { name: labels.cartDialog, exact: true })).toBeVisible();
    await scan(page, testInfo, 'open-cart-drawer', language);
    await page.getByRole('button', { name: labels.close, exact: true }).click();

    await page.goto('/cart');
    await scan(page, testInfo, 'cart', language);
    await page.goto('/checkout');
    await scan(page, testInfo, 'checkout', language);
    await completeCheckout(page, labels);
    await scan(page, testInfo, 'confirmation', language);
  });
}

// Backlog item 6 — the comparison table is wider than a phone screen, so it has
// to say so. A scrollbar is not a signal that a fourth column exists.
//
// Runs at every configured viewport: the pager is supposed to appear only when
// the table actually overflows, and asserting "present" at 375 and "absent when
// it fits" is the whole contract.
test('mobile comparison offers orientation and a differences filter', async ({ page }, testInfo) => {
  await seedBrowsingState(page);
  await page.goto('/compare');

  const scroller = page.getByRole('group', { name: /مقارنة|Compare/ });
  await expect(scroller).toBeVisible();

  // Focusable, because a region you can only reach by scrolling must be
  // reachable from the keyboard too (WCAG 2.1.1).
  await expect(scroller).toHaveAttribute('tabindex', '0');

  // Pinned rather than discovered: at 375 the table MUST overflow (that is the
  // condition item 6 exists for) and at 1280 two columns MUST fit, so the
  // affordances stay absent. An if/else on a measured value would quietly pass
  // whichever branch it happened to take.
  const overflows = await scroller.evaluate((el) => el.scrollWidth - el.clientWidth > 4);
  expect(overflows).toBe(testInfo.project.name === 'mobile-375');
  const snap = await scroller.evaluate((el) => getComputedStyle(el).scrollSnapType);
  expect(snap).toContain('mandatory');

  const next = page.getByRole('button', { name: 'الهاتف التالي', exact: true });
  const prev = page.getByRole('button', { name: 'الهاتف السابق', exact: true });

  if (overflows) {
    await expect(next).toBeVisible();
    // Nothing precedes the first column.
    await expect(prev).toBeDisabled();

    const columnBefore = await scroller.evaluate((el) => el.scrollLeft);
    await next.click();
    await expect(prev).toBeEnabled();
    const columnAfter = await scroller.evaluate((el) => el.scrollLeft);
    // Direction-agnostic: RTL scrollLeft is negative, so compare distance moved.
    expect(Math.abs(columnAfter - columnBefore)).toBeGreaterThan(20);
  } else {
    await expect(next).toHaveCount(0);
  }

  // The two seeded phones are both Apple, so brand, camera and refresh rate are
  // identical and the switch has something real to remove.
  const rows = page.locator('tbody tr');
  const total = await rows.count();
  await page.getByText('الاختلافات فقط', { exact: true }).click();
  const remaining = await rows.count();
  expect(remaining).toBeGreaterThan(0);
  expect(remaining).toBeLessThan(total);

  await testInfo.attach('compare-orientation.json', {
    body: JSON.stringify({ overflows, snap, total, remaining }, null, 2),
    contentType: 'application/json'
  });
});

// The account page needs a session, and this suite runs Vite alone with no API
// behind it. So the session is stubbed at the network boundary: /api/me answers
// with a signed-in shopper who has a saved address, which is enough for the page
// to render every one of its four cards.
//
// The assertion on the heading is not decoration. /profile redirects to /login
// without a session, so a scan that forgot the stub would measure the login page
// and pass — the same "green for the wrong reason" failure this file already
// carries two guards against.
const STUB_USER = {
  id: 'stub-user',
  email: 'noura@volta.test',
  name: 'Noura Al-Sabah',
  createdAt: '2026-01-15T09:00:00.000Z',
  address: {
    fullName: 'Noura Al-Sabah',
    governorate: 'capital',
    city: 'Salmiya',
    block: '3',
    street: '40',
    building: '12A',
    details: 'Floor 2',
    phone: '55551234'
  }
};

for (const [language, labels] of Object.entries(languages)) {
  test(`${language} account page is accessible and fits a phone`, async ({ page }, testInfo) => {
    await page.route('**/api/me', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: STUB_USER })
    }));
    await seedBrowsingState(page, labels.theme);
    await page.addInitScript((l) => localStorage.setItem('volta-lang', l), language);

    await page.goto('/profile');
    await expect(page.getByRole('heading', { level: 1, name: labels.profileTitle })).toBeVisible();
    // All four cards, so the scan is of the whole page and not a half-rendered one.
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(4);
    await expect(page.getByRole('button', { name: labels.deleteAccount })).toBeVisible();

    await scan(page, testInfo, 'profile', language);

    const measured = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      view: document.documentElement.clientWidth
    }));
    expect(measured.doc, 'account page wider than the viewport').toBeLessThanOrEqual(measured.view);
  });
}

// No route may scroll sideways on a phone.
//
// This exists because /compare did, and nothing caught it: axe does not check
// overflow, and the scans that would have seen it were running against an EMPTY
// comparison page. A page that slides horizontally under the thumb loses its
// heading off the edge, which is the same defect class as the mobile header
// (backlog item 1) — so it is worth a guard rather than another discovery.
const NARROW_ROUTES = [
  '/',
  '/products',
  '/products?category=phones',
  '/products/iphone-17-pro-max',
  '/wishlist',
  '/compare',
  '/cart',
  '/checkout',
  '/definitely-missing'
];

for (const language of Object.keys(languages)) {
  test(`${language} storefront never scrolls sideways at 375px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-375', 'phone-width check');

    await seedBrowsingState(page, languages[language].theme);
    await page.addInitScript((l) => localStorage.setItem('volta-lang', l), language);

    const overflowing = [];
    for (const route of NARROW_ROUTES) {
      await page.goto(route);
      await page.locator('main').waitFor({ state: 'visible' });
      const measured = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        view: document.documentElement.clientWidth
      }));
      if (measured.doc > measured.view) {
        overflowing.push(`${route} (+${measured.doc - measured.view}px)`);
      }
    }

    expect(overflowing, 'routes wider than the viewport').toEqual([]);
  });
}
