# francois.monniot.eu

My personal website — a [Jekyll](https://jekyllrb.com/) static site, live at
<https://francois.monniot.eu>.

It uses the **"Spine"** design: a fixed dark left sidebar (brand, status, nav,
contact) beside a white content column, with Spectral (serif) headings, IBM Plex
Sans (text) and JetBrains Mono (code). The look lives entirely in
[`css/styles.scss`](css/styles.scss).

## Prerequisites

The system Ruby is too old to build this site. Use a version manager — these
instructions assume [`mise`](https://mise.jdx.dev/):

```sh
brew install mise libyaml      # libyaml is needed to compile Ruby's psych
mise install ruby@3.3          # builds Ruby 3.3 (compiles from source)
```

`rake resume` (PDF export) additionally needs the `wkhtmltopdf` binary — see
[Generating the résumé PDF](#generating-the-résumé-pdf) below.

## Install

```sh
mise exec ruby@3.3 -- bundle install
```

> All commands below are prefixed with `mise exec ruby@3.3 --`. If you activate
> mise in your shell (`mise use ruby@3.3`), you can drop the prefix and just run
> `bundle exec …`.

## Local development

Serve with live reload (source maps are generated in this mode):

```sh
mise exec ruby@3.3 -- bundle exec jekyll serve
```

Then open <http://localhost:4000>.

## Build

```sh
mise exec ruby@3.3 -- bundle exec jekyll build   # output goes to _site/ (gitignored)
```

## Visual testing

[Playwright](https://playwright.dev/) drives a headless Chromium over a matrix of
four viewports — `desktop` (1920×1080), `laptop` (1440×900), `tablet` (768×1024)
and `phone` (390×844) — defined in [`playwright.config.ts`](playwright.config.ts).
The routes under test live in [`tests/routes.ts`](tests/routes.ts): the home,
writing and résumé pages, plus a **styleguide fixture** (see below) that stands
in for a full article. Each run starts its own Jekyll on a random free port (so
it never collides with a `jekyll serve` you already have on `:4000`) and shuts it
down afterwards.

One-time setup (Node is pinned in [`mise.toml`](mise.toml)):

```sh
mise install node@22
mise exec node@22 -- npm install
mise exec node@22 -- npx playwright install chromium
```

**Regression testing** — compares every page/viewport against committed
baselines and fails on any pixel difference (writing a diff image under
`test-results/`):

```sh
mise exec node@22 -- npm run test:visual          # check against baselines
mise exec node@22 -- npm run test:visual:update   # accept intended changes
mise exec node@22 -- npm run report               # open the HTML diff report
```

Baselines live in [`tests/visual.spec.ts-snapshots/`](tests/visual.spec.ts-snapshots/)
and are committed. They are platform-specific (filenames end in `-darwin`); run
`:update` once on each platform that runs the suite.

**The styleguide fixture** — rather than baseline a full 25k-px article (which
made the committed PNGs balloon and churn on every redesign), article styling is
covered by [`_fixtures/styleguide.md`](_fixtures/styleguide.md): one compact page
exercising every styled element — headings, lists, blockquote, inline code, plain
and captioned (`figure.codeblock`) code fences, links and a deliberately long URL
that guards the mobile-overflow fix. It is served at `/test/styleguide/` only
under the test config ([`_config-test.yml`](_config-test.yml), which the Playwright
`webServer` layers on top of `_config.yml` to expose `_fixtures/` as a collection).
The production build reads only `_config.yml`, so the fixture never ships to the
live site and never appears in `/writing/` or the sitemap. To add coverage for a
new component, add it to the fixture and re-run `:update`.

**Screenshots** — dumps clean, full-page PNGs to `screenshots/<viewport>/<page>.png`
for eyeballing a redesign (this directory is gitignored):

```sh
mise exec node@22 -- npm run screenshots
```

## Writing a post

```sh
mise exec ruby@3.3 -- bundle exec rake new title="My Title"
# future post (lands in _drafts until within 3 days):
mise exec ruby@3.3 -- bundle exec rake new title="My Title" future=10
```

Each post's front-matter drives the article chrome:

```yaml
---
layout: post
title: My Title
date: 2026-01-01 10:00:00 +0100
kicker: Topic · Another Topic        # small label above the title
description: One-sentence summary.    # the "dek" under the title; also <meta>
---
```

**Captioned code blocks** — wrap a fenced block in a `figure.codeblock` with a
`<figcaption>` (typically a filename or context label); it renders as the
design's caption strip joined to the code. The `markdown="1"` attribute lets
kramdown process the fence inside the HTML block. Syntax highlighting is
automatic (Rouge, dark theme):

````markdown
<figure class="codeblock" markdown="1">
<figcaption>/etc/nginx/nginx.conf</figcaption>
```nginx
server { listen 80; }
```
</figure>
````

## Generating the résumé PDF

The résumé content is **content-generated** from
[`_data/resume.yml`](_data/resume.yml) — edit it there once and both the on-site
résumé (`/resume/`) and the print page (`/resume-print/`) update.

The published PDF is rendered from the print page:

```sh
mise exec ruby@3.3 -- bundle exec rake resume   # _site/resume-print/index.html → docs/resume_francois_monniot.pdf
```

This requires the `wkhtmltopdf` binary on your `PATH`. It is deprecated and no
longer in Homebrew core; installing it is non-trivial on recent macOS. See
[FOLLOWUPS.md](FOLLOWUPS.md) for a planned replacement.

## Project layout (the content-generated bits)

| Path | What it drives |
| --- | --- |
| [`_config.yml`](_config.yml) `profile:` | Sidebar identity: name, role, status, bio, location, GitHub, split email |
| [`_data/nav.yml`](_data/nav.yml) | Sidebar navigation + numbering |
| [`_data/resume.yml`](_data/resume.yml) | Résumé content (jobs, skills, education, languages) — single source for `/resume/` and `/resume-print/` |
| [`_layouts/default.html`](_layouts/default.html) | Sidebar shell + `<head>` + email-deobfuscation script |
| [`_layouts/post.html`](_layouts/post.html) | Article layout (kicker, dek, read-time byline, prose) |
| [`css/styles.scss`](css/styles.scss) | The whole "Spine" design + dark code theme |

The email address is split across `email_user` / `email_domain` and reassembled
client-side (anti-scraping); the print page uses a plain `mailto:` so the PDF is
readable.

## Deployment

The site is hosted on GitHub Pages and deployed automatically via GitHub Actions.
Push to `master` and [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
will build with Jekyll + Ruby 3.3 and publish to Pages. `_site/` is gitignored —
never commit the build output.
