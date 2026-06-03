# Follow-up items

Tracked work left over from the "Spine" redesign (June 2026). Grouped by area;
roughly ordered by importance within each.

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

- **Self-host the web fonts** (Spectral / IBM Plex Sans / JetBrains Mono) instead
  of loading from Google Fonts, for privacy and offline/PDF rendering.
- **Strengthen email obfuscation** if scraping becomes a problem — the current
  scheme exposes `user ·at· domain` as readable text before JS rewrites it.
- **Add a `favicon.ico`.** `default.html` links `/favicon.ico`, but the file
  doesn't exist in the repo.
- **Remove the unused `images/reunion.jpg`** if nothing references it.
