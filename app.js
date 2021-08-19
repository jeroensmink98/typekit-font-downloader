// Import modules
const https = require('https');
const fs = require('fs');
const cssJson = require('cssjson');
const cssjson = require('cssjson');

const FONTS_FOLDER = '/fonts'


const FORMAT_USER_AGENTS = {
    eot: 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)',
    woff: 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0',
    woff2: 'Mozilla/5.0 (Windows NT 6.3; rv:39.0) Gecko/20100101 Firefox/39.0',
    svg: 'Mozilla/4.0 (iPad; CPU OS 4_0_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/4.1 Mobile/9A405 Safari/7534.48.3',
    ttf: 'Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/538.1 (KHTML, like Gecko) Safari/538.1 Daum/4.1'
};

// Set font formatting
const FORMAT_EXTENSIONS = {
    'truetype': 'ttf',
    'opentype': 'otf',
    'embedded-opentype': 'eot',
};

const cssObj = {
    
};

// URL of the font you want to scrape
const STYLE_URL = 'https://use.typekit.net/cdd8oev.css';
const downloadedFonts = {};
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';

// Create new CSS File
https.get(STYLE_URL, (response) => {
    if (response.statusCode !== 200) {
        throw new Error(`Request failed. Status Code: ${response.statusCode}.`);
    }

    // Content is the body of the HTTP response
    let content = '';
    response.on('data', (chunk) => {
        // append the byte stream to the content variable
        content += chunk;
    });

    // when the response is finished append the content of the variable to
    // a new file we will use later as our .css file
    response.on('end', () => {
        const fontFamily = content.match(/font-family:\s*"([^"]+)"/)[1];
        fs.writeFile(`css/${fontFamily}.css`, content, function (err) {
            if (err) throw err;
        });
    })
})



// Retrieve fonts
for (const format in FORMAT_USER_AGENTS) {
    const headers = {'User-Agent': FORMAT_USER_AGENTS[format]};
    https.get(STYLE_URL, {headers}, (response) => {
        if (response.statusCode !== 200) {
            throw new Error(`Request failed. Status Code: ${response.statusCode}.`);
        }

        // Content is the body of the HTTP response
        let content = '';
        response.on('data', (chunk) => {
            content += chunk;
        });

        response.on('end', () => {
            for (const fontFaceRule of content.match(/@font-face {[^}]+}/g)) {
                const fontFamily = fontFaceRule.match(/font-family:\s*"([^"]+)"/)[1];
                const fontWeight = fontFaceRule.match(/font-weight:\s*([^;]+);/)[1];
                const fontStyle = fontFaceRule.match(/font-style:\s*([^;]+);/)[1];
                const fontUrlAndFormats = fontFaceRule.match(/url\("([^"]+)"\)\s+format\("([^"]+)"\)/g);


                // fontFaceRule is our CSS String for each individual font entry
                // So we parse it to a JSON format
                cssObj.fonts = cssjson.toJSON(fontFaceRule);

                // Create an seperate array for the URLS of the fonts
                const urls = cssObj.fonts.children['@font-face']['attributes']['src'].split(',')

                // Here we loop over the urls array and identify the type of format used for the URL
                urls.forEach(function (url, index) {
                    if(url.includes('woff2')){
                        const url_woff2 = `${fontFamily}_${fontWeight}_${fontStyle}.woff2`;
                    }else if(url.includes('woff')){
                        const url_woff = `${fontFamily}_${fontWeight}_${fontStyle}.woff`;
                    }else if(url.includes('opentype')){
                        const url_otf = `${fontFamily}_${fontWeight}_${fontStyle}.otf`;
                    }
                });
                cssObj.fonts.children['@font-face']['attributes']['src'] = 'jemoeder'

                
                
                
                for (const fontUrlAndFormat of fontUrlAndFormats) {
                    const fontUrl = fontUrlAndFormat.match(/url\("([^"]+)"\)/)[1];
                   
                    const fontFormat = fontUrlAndFormat.match(/format\("([^"]+)"\)/)[1].toLowerCase();
                    const extension = FORMAT_EXTENSIONS[fontFormat] || fontFormat;

                    const filename = `${fontFamily}_${fontWeight}_${fontStyle}.${extension}`;

                    if (!downloadedFonts[filename]) {
                        // https.get(fontUrl, (response) => {
                        //     console.log(`Downloaded "${fontFamily}" font family for "${fontFormat}" format in ${fontWeight} weight and ${fontStyle} style.`);
                        //     console.log(`fonts/${fontFamily}_${fontWeight}_${fontStyle}.${extension}`);
                        //     response.pipe(fs.createWriteStream(`fonts/${filename}`));
                        // });
                    }
                }
            }
        });
    });
    
}

// Write new URL's to 


