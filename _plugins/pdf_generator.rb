require 'nokogiri'

module Jekyll
  class PdfGenerator < Generator
    safe true
    priority :lowest

    def generate(site)

      # Pregenerate stylesheets for importing them in PDF files
      site.static_files.each do |file|
        next unless (file.path =~ /.*(less|css)$/)
        file.write '_tmp'
      end

      site.pages.each do |page|
        next unless page.data.has_key?('pdf')

        # Generate the layout of this page
        page.render site.layouts, {"site" => {"posts" => []}}

        # PDFKit.new takes the page HTML and any options for wkhtmltopdf
        kit = PDFKit.new(page.output, 'page-size' => 'A4',
                                      'margin-top' => '0.5in',
                                      'margin-right' => '0.5in',
                                      'margin-bottom' => '0.5in',
                                      'margin-left' => '0.5in',
                                      'print-media-type' => true )

        doc = ::Nokogiri::HTML(page.output)
        doc.xpath('/html/head/link[contains(@type, "text/css")]').each do |elem|
          next unless elem['media'] =~ /print|all/
          kit.stylesheets << site.source + '/_tmp' + elem['href']
        end

        # Save the PDF to a file
        filename = page.data['pdf'] + '.pdf'
        kit.to_file(filename)

        # Registering the new pdf file
        site.static_files << StaticFile.new(site, site.source, '', filename )
      end
    end

  end
end