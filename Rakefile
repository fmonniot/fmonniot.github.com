
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

desc 'generate pdf from html file, args: file, name'
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
  puts "generate pdfs resume_francois_monniot.pdf"
  build_pdf("_site/resume/index.html","docs/resume_francois_monniot.pdf")
end

def build_pdf(input_name, output_name)
  require 'webrick'

  chrome = find_chrome
  abort "Chrome not found — install Google Chrome or Chromium" unless chrome

  server_socket = TCPServer.new('127.0.0.1', 0)
  port = server_socket.addr[1]
  server_socket.close

  server = WEBrick::HTTPServer.new(
    Port: port,
    DocumentRoot: '_site',
    Logger: WEBrick::Log.new(File::NULL),
    AccessLog: []
  )
  thread = Thread.new { server.start }
  sleep 0.3

  url_path = '/' + input_name.sub(%r{\A_site/}, '').sub(/index\.html\z/, '')
  url = "http://localhost:#{port}#{url_path}"
  output_abs = File.expand_path(output_name)

  system(chrome,
    '--headless',
    '--disable-gpu',
    "--print-to-pdf=#{output_abs}",
    '--no-pdf-header-footer',
    '--virtual-time-budget=5000',
    url)
ensure
  server&.shutdown
  thread&.join
end

def find_chrome
  [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    'google-chrome',
    'chromium',
    'chromium-browser',
  ].find do |path|
    if path.start_with?('/')
      File.executable?(path)
    else
      system("which #{path.shellescape} > /dev/null 2>&1")
    end
  end
end
