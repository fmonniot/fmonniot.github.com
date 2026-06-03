/** Representative pages covering each layout the site uses. */
export const routes = [
  { name: 'home', path: '/' },
  { name: 'writing', path: '/writing/' },
  { name: 'resume', path: '/resume/' },
  // A compact "kitchen sink" fixture exercising every styled post element,
  // served only under the test config (see _config-test.yml). Replaces a full
  // real article so baselines stay small while coverage stays complete.
  { name: 'styleguide', path: '/test/styleguide/' },
] as const;
