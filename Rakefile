
desc 'create new post or bit. args: type (post, bit), title, future (# of days)'
# rake new future=0 title="New post title goes here" slug="slug-override-title"
task :new do
  require 'chronic'

  title = ENV["title"] || "New Title"
  future = ENV["future"] || 0
  slug = (ENV["slug"] ? ENV["slug"].gsub(' ','-').downcase : nil) || title.gsub(' ','-').downcase

  if future.to_i < 3
    TARGET_DIR = "_posts"
  else
    TARGET_DIR = "_drafts"
  end

  if future.to_i.zero?
    filename = "#{Time.new.strftime('%Y-%m-%d')}-#{slug}.markdown"
  else
    stamp = Chronic.parse("in #{future} days").strftime('%Y-%m-%d')
    filename = "#{stamp}-#{slug}.markdown"
  end

  path = File.join(TARGET_DIR, filename)
  post = <<-HTML
---
layout: post
title: "TITLE"
date: DATE
---

HTML
  post.gsub!('TITLE', title).gsub!('DATE', Time.new.to_s)
  File.open(path, 'w') do |file|
    file.puts post
  end
  puts "new post generated in #{path}"
end

# rake pdf file="_site/cv/index.html" name="cv_francois_monniot"
task :pdf do
  require 'pdfkit'
  require 'nokogiri'

  input_name = ENV['file']
  output_name = ENV['name'] + '.pdf'

  puts "generate pdf (#{output_name}) for file #{input_name}"

  input = File.open(input_name)
  page = input.read
  input.close

  # PDFKit.new takes the page HTML and any options for wkhtmltopdf
  kit = PDFKit.new(page, 'page-size' => 'A4',
                      'margin-top' => '0.5in',
                      'margin-right' => '0.5in',
                      'margin-bottom' => '0.5in',
                      'margin-left' => '0.5in',
                      'print-media-type' => true )

  doc = ::Nokogiri::HTML(page)

  doc.xpath('//link[contains(@type, "text/css")]').each do |elem|
    p elem
    kit.stylesheets << '_site' + elem['href']
  end

  # Save the PDF to a file
  kit.to_file(output_name)
end
