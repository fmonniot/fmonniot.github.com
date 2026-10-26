# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal website (<https://francois.monniot.eu>): a Jekyll 4 static site on GitHub Pages, fronted by Cloudflare. The `master` branch deploys on push via `.github/workflows/deploy.yml` (`jekyll build` with `JEKYLL_ENV=production`). `_site/` is gitignored; never commit build output.

## Toolchain

The system Ruby (2.6) cannot build the gems. Ruby 3.3 and Node 22 are pinned in `mise.toml` (plus `oxipng` for PNG optimisation). mise is not auto-activated, so prefix commands with `mise exec ruby@3.3 --` (Ruby) or `mise exec node@22 --` (Node). The examples below omit the prefix. `.claude/settings.json` already allows `bundle exec *` and `mise exec *`.

```sh
bundle install
bundle exec jekyll serve                  # http://localhost:4000, live reload, sourcemaps in dev
bundle exec jekyll build                  # → _site/
bundle exec rake new title="My Title"     # new post in _posts (future=N days; N>=3 lands in _drafts)
bundle exec rake resume                   # needs a built _site and Chrome/Chromium; writes docs/resume_francois_monniot.pdf
bundle exec rake pdf file="_site/x/index.html" name="out"   # generic page → PDF (note: output path is name + .pdf, relative to cwd)
```

`rake resume`/`pdf` serve `_site` through WEBrick and print with headless Chrome (`--print-to-pdf`). `wkhtmltopdf` is no longer used, even though `README.md` still mentions it, `/resume-print/` and `FOLLOWUPS.md` (none of which exist any more; the print styles now live in `resume.html`).

## Tests (visual regression only)

There are no unit tests, only Playwright screenshot tests across four viewports (desktop 1920, laptop 1440, tablet 768, phone 390).

```sh
npm install && npx playwright install chromium    # one-time
npm run test:visual                               # compare against committed baselines
npx playwright test visual.spec.ts --project=phone -g "home"   # single viewport / single route
npm run test:visual:update                        # accept intended changes + oxipng the baselines
npm run screenshots                               # eyeballing dump to screenshots/<viewport>/ (gitignored)
npm run report
```

- Each run starts its own `jekyll serve` on a random free port (`playwright.config.ts`), layering `_config-test.yml` on `_config.yml`. It never reuses a server you already have running.
- Baselines in `tests/visual.spec.ts-snapshots/` are committed and platform-specific (`-darwin` suffix). Other platforms need their own `:update`. A run compares at `maxDiffPixelRatio: 0.01`.
- Routes under test are listed in `tests/routes.ts`. Add a new page there to cover it (both specs read the list).
- `/test/styleguide/` is a fixture page (`_fixtures/styleguide.md`) that stands in for a full article and exercises every styled element. It exists only because `_config-test.yml` defines a `fixtures` collection that `_config.yml` does not, so it never ships to production or the sitemap. To cover a new styled component, add it to the fixture and rerun `:update`.

## Architecture

- **Single design file**: the whole "Spine" look (fixed dark sidebar, white content column, dark code theme) is `css/styles.scss`. `_layouts/default.html` renders the sidebar shell and `<head>`; `_layouts/post.html` is the article layout (kicker, dek, read-time byline). Pages such as `index.html`, `writing.html` and `resume.html` carry their own markup inside the default layout.
- **Fingerprinted CSS** (`_plugins/fingerprint.rb`): a `:site, :post_read` hook hashes `css/styles.scss` and renames the compiled page's `basename` to `styles-<hash>`, then sets `site.css_path`. Layouts must link `{{ site.css_path }}`, never a hardcoded `/css/styles.css`. This exists because Cloudflare caches CSS for 4h under a fixed name, which previously left a redesign rendering unstyled. The plugin renames `basename` rather than setting a `permalink` on purpose, so the SCSS sourcemap page isn't given the same URL and doesn't overwrite the CSS. Keep it that way.
- **Data-driven chrome**: the sidebar identity (`profile:`) lives in `_config.yml`. The sidebar nav lives in `_data/nav.yml`. A page's active state comes from its `nav:` front-matter key, or from `page.url`. Dated pages (posts) map to `/writing/`. The résumé is rendered from `_data/resume.yml` by `resume.html`, and its on-screen and print styling share the same page.
- **Email anti-scraping**: the email is split into `email_user` and `email_domain` in `_config.yml` and reassembled by a script in `default.html`.
- **Post front matter** used by the layout: `layout`, `title`, `date`, `kicker`, `description`. Captioned code blocks use `<figure class="codeblock" markdown="1"><figcaption>…</figcaption>` around a fenced block.
- `_config.yml` has `future: true` and `permalink: pretty`. `exclude:` lists the non-site tooling (tests, scripts, Rakefile, package files). Add any new tooling file or directory there, or Jekyll will publish it.
- `_drafts/` holds old unpublished posts. `docs/` holds the generated résumé PDF, which is committed.
