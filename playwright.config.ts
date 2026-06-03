import { defineConfig } from '@playwright/test';

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

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://127.0.0.1:4000',
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

  // Jekyll is started automatically; an already-running server is reused locally.
  webServer: {
    command:
      'mise exec ruby@3.3 -- bundle exec jekyll serve --port 4000 --no-watch --config _config.yml,_config-test.yml',
    url: 'http://127.0.0.1:4000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
