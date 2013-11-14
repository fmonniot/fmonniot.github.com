require 'nokogiri'

module Jekyll
  class PdfGenerator < Generator
    safe true
    priority :lowest

    def generate(site)
      puts "\n\n"
      css = {}

      site.static_files.each do |static|
        next unless static.path.include?('.less') || static.path.include?('.css')
        
        parser ||= ::Less::Parser.new({:paths => [File.dirname(static.path)]})  
        css[static.path] = parser.parse(File.read(static.path)).to_css
      end

      site.pages.each do |page|
        next unless page.data.has_key?('pdf')

        page.render site.layouts, {"site" => {"posts" => []}}

        doc = ::Nokogiri::HTML(page.output)


        css_node = ::Nokogiri::XML::Node.new("style", css)
        css_node['media'] = 'screen'

        doc.css('header') << css_node

        # PDFKit.new takes the HTML and any options for wkhtmltopdf
        # run `wkhtmltopdf --extended-help` for a full list of options
        kit = PDFKit.new(page.output, :page_size => 'Letter')


        # Save the PDF to a file
        file = kit.to_file('example.pdf')

        # Registering the new pdf file
        #p filename = page.name.gsub(/\.html$/, ".pdf")
        #site.static_files << StaticFile.new(site, site.source, 'pdf', page.name )
      end
    end
  end
end