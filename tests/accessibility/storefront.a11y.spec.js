import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const languages = {
  ar: {
    switchLabel: null,
    direction: 'rtl',
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
    placeOrder: 'تأكيد الطلب'
  },
  en: {
    switchLabel: 'English',
    direction: 'ltr',
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
    placeOrder: 'Place Order'
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

async function openInLanguage(page, language) {
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
