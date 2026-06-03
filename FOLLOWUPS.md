# Follow-up items

Tracked work left over from the "Spine" redesign (June 2026). Grouped by area;
roughly ordered by importance within each.

## Toolchain & build

- **Replace `wkhtmltopdf` for the résumé PDF.** `rake resume` still depends on
  `wkhtmltopdf`, which is deprecated and not installable from Homebrew core on
  recent macOS. Move `build_pdf` in [`Rakefile`](Rakefile) to a maintained
  renderer — e.g. headless Chrome (`chrome --headless --print-to-pdf`),
  Playwright, or [`weasyprint`](https://weasyprint.org/). Bonus: those honour
  modern CSS and web fonts, so the PDF will match `resume-print.html` exactly.
- ~~**Confirm the deploy pipeline still works.**~~ Done: replaced classic Pages
  build with a GitHub Actions workflow (`.github/workflows/deploy.yml`). Builds
  with Ruby 3.3 + Jekyll 4.4.1 from `Gemfile.lock` on every push to `master`.
  Requires *Settings → Pages → Source → GitHub Actions* to be set once.
- ~~**Add a `.tool-version` / `mise.toml`.**~~ Done: `mise.toml` committed,
  pinning `ruby = "3.3"` (resolves to 3.3.11). `bundle exec jekyll` now works
  without the `mise exec` prefix once the file is trusted (`mise trust`).

## Content (placeholder copy adopted from the design)

- **Refresh the résumé/home copy.** The design's wording was adopted verbatim;
  the "Jan 2020 — Current" Samsung SmartThings role and the home "Now" section
  may be stale. Update [`_data/resume.yml`](_data/resume.yml) and
  [`index.html`](index.html).
- **Write a real dek for the GVM post.** [`_posts/2014-11-11-using-gvm.md`](_posts/2014-11-11-using-gvm.md)
  got a placeholder `description`; the design originally linked it off-site.

## Design fidelity / polish

- **Demote in-post headings.** The articles use `#`/`##` (so the body has `h1`s
  in addition to the article title). The design styles `h2`/`h3`; a `.prose h1`
  rule was added as a stopgap. Consider demoting headings to `##`/`###` for a
  cleaner hierarchy.
- **Style the table of contents.** The Proxmox post has a hand-written markdown
  TOC that renders as a plain nested list. The design has a boxed `.toc`
  component — either wrap the TOC markup in it or generate one with kramdown's
  `{:toc}`.
- **Optionally migrate code blocks to `<figure class="codeblock">`.** The current
  `<p class="code-title">` + fenced-block convention is styled to match, but the
  semantic figure/figcaption markup from the design is cleaner if you ever
  rewrite posts.

## Nice-to-haves (raised during design, not yet built)

- **Light/dark theme toggle.**
- **Self-host the web fonts** (Spectral / IBM Plex Sans / JetBrains Mono) instead
  of loading from Google Fonts, for privacy and offline/PDF rendering.
- **Strengthen email obfuscation** if scraping becomes a problem — the current
  scheme exposes `user ·at· domain` as readable text before JS rewrites it.
- **Add a `favicon.ico`.** `default.html` links `/favicon.ico`, but the file
  doesn't exist in the repo.
- **Remove the unused `images/reunion.jpg`** if nothing references it.
