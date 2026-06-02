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

Serve with live reload (some dev-only nav links appear via `_config-dev.yml`):

```sh
mise exec ruby@3.3 -- bundle exec jekyll serve --config=_config.yml,_config-dev.yml
```

Then open <http://localhost:4000>.

## Build

```sh
mise exec ruby@3.3 -- bundle exec jekyll build   # output goes to _site/ (gitignored)
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

**Captioned code blocks** — label a fenced block with a `code-title` paragraph
immediately above it; it renders as the design's caption strip joined to the
code. Syntax highlighting is automatic (Rouge, dark theme):

````markdown
<p class="code-title">/etc/nginx/nginx.conf</p>
```nginx
server { listen 80; }
```
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

The site is hosted on GitHub Pages. `_site/` is gitignored — publish by building
and pushing the output through your usual pipeline (GitHub Actions or a committed
build), not by committing `_site/` from a local serve.
