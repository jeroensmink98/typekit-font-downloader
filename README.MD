# Typekit font downloader
An open-source tool to download Typekit fonts to your local machine.

# Introduction
With this tool you can download any Typekit font to your local machine. Support for `woff` `woff2` and `opentype` format. 

Give a URL of the typekit fonts and let the script run. It will download all the files to a folder called fonts. Then based on the font definition it will create a new css file with all the url's to the local fonts. 

With this tool you can increase your performance of your website since the site does not need to retrieve the fonts anymore from a local source, instead it has all the files needed locally avaliable.

# Get started
First create a new folder called `css` and a new folder `fonts` in the root of the project. Then install the node packages and run `npm run scrape` to start the download of the fonts.

# Acknowlegment
This tool might be against the Terms of Service/EULA of Adobe. 