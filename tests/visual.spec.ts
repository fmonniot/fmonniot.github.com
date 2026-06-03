import { test, expect } from '@playwright/test';
import { routes } from './routes';

// One test per route; Playwright runs each across every viewport project and
// stores a separate baseline per (route, viewport, platform).
for (const route of routes) {
  test(`${route.name} matches baseline`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: 'networkidle' });
    // Avoid flaky text rendering before web fonts have swapped in.
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${route.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });
}
