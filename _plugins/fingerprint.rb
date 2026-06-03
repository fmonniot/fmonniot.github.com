# Fingerprints the compiled stylesheet so its filename changes whenever the
# source changes. The site is fronted by Cloudflare, which caches CSS for hours
# under a fixed filename — that's how a redesign can ship correct HTML while the
# old (or missing) stylesheet lingers at the edge, rendering pages unstyled.
# A content-derived filename means a new build is a new URL, so there is nothing
# stale to serve.
#
# We hash the SCSS source and rename the compiled page's basename to
# styles-<hash>, then expose `site.css_path` for layouts to link. Editing
# css/styles.scss changes the hash, hence the filename.
#
# We rename `basename` rather than setting a `permalink`: jekyll-sass-converter
# builds the companion SourceMapPage from the css page's *basename* and shares
# its `data` hash, so a permalink would leak onto the source map and make both
# files resolve to the same URL (the map would overwrite the CSS). Renaming the
# basename instead keeps styles.css, styles.css.map, and the sourceMappingURL
# comment consistently fingerprinted.

require "digest"

STYLESHEET_SOURCE = "css/styles.scss".freeze

Jekyll::Hooks.register :site, :post_read do |site|
  source_path = File.join(site.source, STYLESHEET_SOURCE)
  next unless File.exist?(source_path)

  digest = Digest::MD5.file(source_path).hexdigest[0, 12]

  page = site.pages.find { |p| p.path == STYLESHEET_SOURCE }
  page.basename = "styles-#{digest}" if page

  site.config["css_path"] = "/css/styles-#{digest}.css"
end
