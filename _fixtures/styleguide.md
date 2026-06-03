---
layout: post
title: "Styleguide: every prose element on one page"
date: 2020-01-01 12:00:00 +0000
kicker: Fixture · Visual Regression · Kitchen Sink
description: A compact fixture that exercises every styled element of the post layout — headings, lists, blockquotes, inline code, plain and captioned code fences, links, and deliberately long URLs — so visual baselines stay small while coverage stays complete.
---

<div class="toc" markdown="1">
<p class="toc-h">Contents</p>

1. TOC
{:toc}

</div>

## Body text, links and inline code

This paragraph mixes the elements that appear inside running prose: a regular
[inline link](https://francois.monniot.eu), some `inline code`, **bold text**
and *italic text*. It exists so the baseline captures link colour, the inline
code chip, and the body font, line-height and measure together.

A deliberately long, unbreakable URL guards the regression we fixed — it must
wrap instead of widening the page on narrow viewports:
https://documentation.example.org/very/long/path/segment/that/should/wrap/instead/of/overflowing/the/content/column.html

### Unordered and ordered lists

- First item in an unordered list, with a custom dash marker.
- Second item containing `inline code` and an [inline link](https://example.com).
- Third item that runs long enough to wrap onto a second line so line-height and the hanging indent are both visible in the baseline.

1. First step of an ordered list (numbered via a CSS counter).
2. Second step, also long enough to wrap so the counter alignment against multi-line text is captured.
3. Third step.

### Blockquote

> A blockquote rendered in the serif italic pull-quote style. It should sit in
> the accent colour with a left rule, distinct from body text.

## Code blocks

A plain fenced block (no caption). The long line exercises horizontal scroll
inside the code surface without widening the page:

```sh
# A long command line that overflows the code surface and must scroll horizontally rather than stretch the page
iptables -t nat -I PREROUTING -i vmbr0 -p tcp --dport 443 -j DNAT --to-destination 10.0.0.2:443 -m comment --comment "revproxy tcp/443"
```

A captioned block — the filename caption joins to the code surface. The caption
is intentionally a long path to confirm captions wrap rather than overflow:

<figure class="codeblock" markdown="1">
<figcaption>/etc/nginx/sites-available/a-rather-long-reverse-proxy-configuration-file.conf</figcaption>
```nginx
server {
  listen 443 ssl;
  server_name example.org;
  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
  }
}
```
</figure>

### A table

Tables can appear in posts, so the baseline records their current rendering:

| Component | Port | Notes |
| --- | --- | --- |
| Reverse proxy | 443 | TLS termination |
| App server | 8080 | Behind the proxy |

## A large image

An image wider than the content column must scale down to fit rather than
overflow the page — the same failure mode as the long URL above, but for media:

![A wide landscape photograph, larger than the content column](/images/reunion.jpg)

## Closing heading

A final `h2` plus this paragraph mark the end of the fixture, so vertical
rhythm between the last block and the page footer is part of the baseline.
