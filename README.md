My personal website, visible at http://francois.monniot.eu

Tips
=====
To start a new post in Textmate:

    rake new title='My Title'

Launching the server localy in dev mode (some links appear in the nav drawer):

    jekyll serve --config=_config.yml,_config-dev.yml


`wkhtmltopdf` can complains about a `ProtocolUnknownError` when generating a pdf locally (`rake resume`).
For now the solution (hack) is to go to the generated html file and remove the few
relative links. As of writing this tip, they are all in the `head`.
