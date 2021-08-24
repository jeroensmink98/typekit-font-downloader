// Import modules
const https = require('https');
const fs = require('fs');
const cssJson = require('cssjson');
const cssjson = require('cssjson');
const { v4: uuidv4 } = require('uuid');

const FONTS_FOLDER = '/fonts'
const STYLE_URL = 'https://use.typekit.net/cdd8oev.css';

const FORMAT_USER_AGENTS = {
    woff: 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0',
    woff2: 'Mozilla/5.0 (Windows NT 6.3; rv:39.0) Gecko/20100101 Firefox/39.0',
    ttf: 'Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/538.1 (KHTML, like Gecko) Safari/538.1 Daum/4.1'
};

// Set font formatting
const FORMAT_EXTENSIONS = {
    'truetype': 'ttf',
    'opentype': 'otf',
    'embedded-opentype': 'eot',
};

const CSS_OBJ = {}

// URL of the font you want to scrape

const downloadedFonts = {};
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';



function createFile(filename, data) {
    fs.writeFileSync(filename, data, function (err) {
        if (err) throw err;
    })
}



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
        createFile(`css/${fontFamily}.css`, content)
    })
});

// Retrieve fonts
for (const format in FORMAT_USER_AGENTS) {
    const headers = { 'User-Agent': FORMAT_USER_AGENTS[format] };
    https.get(STYLE_URL, { headers }, (response) => {
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


                for (const fontUrlAndFormat of fontUrlAndFormats) {
                    const fontUrl = fontUrlAndFormat.match(/url\("([^"]+)"\)/)[1];

                    const fontFormat = fontUrlAndFormat.match(/format\("([^"]+)"\)/)[1].toLowerCase();
                    const extension = FORMAT_EXTENSIONS[fontFormat] || fontFormat;

                    const filename = `${fontFamily}_${fontWeight}_${fontStyle}.${extension}`;

                    if (!downloadedFonts[filename]) {
                        https.get(fontUrl, (response) => {
                            console.log(`Downloaded "${fontFamily}" font family for "${fontFormat}" format in ${fontWeight} weight and ${fontStyle} style.`);
                            response.pipe(fs.createWriteStream(`fonts/${filename}`));
                        });
                    }
                }
            }
        });
    });
}


async function retrieve_font_css_definition() {
    return new Promise(resolve => {
        // Set HTTP Headers

        // Make HTTP Request
        https.get(STYLE_URL, (response) => {
            // Error handeling
            if (response.statusCode !== 200) {
                throw new Error(`Request failed. Status Code: ${response.statusCode}.`);
            }

            // Content is the body of the HTTP response
            let content = '';
            response.on('data', (chunk) => {
                content += chunk;
            });

            // When the HTTP connection is closed we continue our journey
            response.on('end', () => {
                resolve(content)
            })
        })
    })

}


retrieve_font_css_definition().then((body) => {
    // The body of the http request consists of a body
    // with object, these object contain urls
    for (const fontFaceRule of body.match(/@font-face {[^}]+}/g)) {
        // Fontface properties
        const fontFamily = fontFaceRule.match(/font-family:\s*"([^"]+)"/)[1];
        const fontWeight = fontFaceRule.match(/font-weight:\s*([^;]+);/)[1];
        const fontStyle = fontFaceRule.match(/font-style:\s*([^;]+);/)[1];
        const fontUrlAndFormats = fontFaceRule.match(/url\("([^"]+)"\)\s+format\("([^"]+)"\)/g);

        // Parse the content of the HTTP body (our .CSS) to JSON
        font = cssjson.toJSON(fontFaceRule);

        // We have to create a filename for the font entry
        font_filename = `url("../fonts/${fontFamily}_${fontWeight}_${fontStyle}.woff") format("woff"),url("${fontFamily}_${fontWeight}_${fontStyle}.woff2") format("woff2"),url("${fontFamily}_${fontWeight}_${fontStyle}.otf") format("opentype")`

        // Overide the src value in our JSON object
        font.children['@font-face']['attributes']['src'] = font_filename;

        // Parse our JSON Object to a string
        cssString = cssjson.toCSS(font)

        // Inside the loop we can append the content of the font object to our css file
        fs.appendFile('css/font_definition.css', cssString, function (err) {
            if (err) throw (err)
            console.log('append content');
        })
    }

})









