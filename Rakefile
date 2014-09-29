
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
    filename = "#{Time.new.strftime('%Y-%m-%d')}-#{slug}.md"
  else
    stamp = Chronic.parse("in #{future} days").strftime('%Y-%m-%d')
    filename = "#{stamp}-#{slug}.md"
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

desc 'generate pdf from html file. args: file, name'
task :pdf do
  if ENV['file'].nil? || ENV['name'].nil?
    puts 'Usage: rake pdf file="_site/cv/index.html" name="cv_francois_monniot"'
    next
  end

  input_name = ENV['file']
  output_name = ENV['name'] + '.pdf'
  puts "generate pdf (#{output_name}) for file #{input_name}"

  build_pdf(input_name, output_name)
end

desc 'generate resume pdf'
task :resume do
  puts "generate pdfs (resume|cv)_francois_monniot.pdf"
  build_pdf("_site/cv/index.html","docs/cv_francois_monniot.pdf")
  build_pdf("_site/resume/index.html","docs/resume_francois_monniot.pdf")
end

def build_pdf(input_name, output_name)
  require 'pdfkit'

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

  kit.stylesheets << '_site/css/pdf.css'

  # Save the PDF to a file
  kit.to_file(output_name)
end