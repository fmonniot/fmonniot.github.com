import { test } from '@playwright/test';
import path from 'node:path';
import { routes } from './routes';

// Not a regression test: this just dumps clean, browsable PNGs to
// screenshots/<viewport>/<route>.png for eyeballing changes during a redesign.
for (const route of routes) {
  test(`capture ${route.name}`, async ({ page }, testInfo) => {
    await page.goto(route.path, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: path.join('screenshots', testInfo.project.name, `${route.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });
  });
}
