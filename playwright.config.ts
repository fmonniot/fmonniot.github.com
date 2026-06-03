import { defineConfig } from '@playwright/test';
import { execFileSync } from 'node:child_process';

/**
 * Viewport matrix exercised by every test/screenshot.
 * deviceScaleFactor is pinned to 1 so screenshots map 1:1 to CSS pixels,
 * which keeps baselines small and diffs predictable.
 */
export const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'phone', width: 390, height: 844 },
] as const;

// Ask the OS for a free ephemeral port by binding to :0 in a short-lived child
// (synchronous: Playwright loads this config via require(), which forbids
// top-level await, so a Promise-based lookup is not an option here).
function reserveFreePort(): number {
  const probe =
    "const s=require('net').createServer();" +
    "s.listen(0,'127.0.0.1',()=>{process.stdout.write(String(s.address().port));s.close()});";
  return Number(execFileSync(process.execPath, ['-e', probe], { encoding: 'utf8' }).trim());
}

// Run Jekyll on a random free port so the suite never collides with a
// `jekyll serve` you already have on :4000. Workers re-import this config in
// their own process, so the chosen port is stashed in the environment (set
// before workers spawn, hence inherited) to keep every process in agreement.
const port = Number(process.env.JEKYLL_TEST_PORT) || reserveFreePort();
process.env.JEKYLL_TEST_PORT = String(port);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL,
  },

  // Tolerate sub-pixel anti-aliasing differences while still catching real changes.
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },

  projects: viewports.map((v) => ({
    name: v.name,
    use: {
      viewport: { width: v.width, height: v.height },
      deviceScaleFactor: 1,
    },
  })),

  // Jekyll is always started fresh on the random port above — never reuse an
  // existing server, so an unrelated `jekyll serve` is never tested by accident.
  webServer: {
    command: `mise exec ruby@3.3 -- bundle exec jekyll serve --port ${port} --no-watch --config _config.yml,_config-test.yml`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
