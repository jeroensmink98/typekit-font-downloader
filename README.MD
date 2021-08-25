# Typekit font downloader
An open-source tool to download Typekit fonts to your local machine.

# Introduction
With this tool you can download any Typekit font to your local machine. Support for `woff` `woff2` and `opentype` format. 

Give a URL of the typekit fonts and let the script run. It will download all the files to a folder called fonts. Then based on the font definition it will create a new css file with all the url's to the local fonts. 

With this tool you can increase your performance of your website since the site does not need to retrieve the fonts anymore from a local source, instead it has all the files needed locally avaliable.

# Get started
- Install `node_modules` by running ``npm install`` from the root of the project
- Inside `app.js` set the ``FONT_KIT_URL`` variable with a valid font-kit css url.
- Execute the script by running `npm run fonts`
- The tool with create a folder ``fonts`` and a folder ``css``. The ``css`` folder contains a file with the font definition which you can include in your own project.

# Acknowlegment
This tool might be against the Terms of Service/EULA of Adobe. 