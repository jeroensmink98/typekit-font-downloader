#!/usr/bin/env node

import { $, chalk } from "zx";
const fs = require("fs");
const log = require("fancy-log");
const https = require('https');
const cssJson = require('cssjson');

const CSS_FOLDER = './css';
const FONTS_FOLDER = './fonts';


// Pass CLI arguments
let FONT_KIT_URL = argv.url;

if(!FONT_KIT_URL){
    console.log(chalk.red("No font URL specified"));
    process.exit(0)
}

// Reject non-https requests
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';

var   FONT_FAMILY_NAME = ''


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

// Reject non-https requests
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';

// Create and empty object that we will use to house the font objects later
const downloadedFonts = {};

// Create a new folder in the dist directory where we will house our special css files and fonts
!fs.existsSync(CSS_FOLDER) && fs.mkdirSync(CSS_FOLDER, { recursive: true });
!fs.existsSync(FONTS_FOLDER) && fs.mkdirSync(FONTS_FOLDER, { recursive: true });




function createFile(filename, data) {
    fs.writeFileSync(filename, data, function (err) {
        if (err) throw err;
    });
}

// Create new CSS File with our font definitions
async function create_definition() {
    return new Promise(resolve => {
        if(FONT_KIT_URL == ''){
            throw new Error(`Font kit url cannot be empty`);
        }
        https.get(FONT_KIT_URL, (response) => {
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
                let empty_content = ''

                // Create class name we want to add to the .css
                let css_class_str = `.tk-${fontFamily} { font-family: "${fontFamily}",serif; }`

                // First check if the definition already exists
                fileExists(`${CSS_FOLDER}/${fontFamily}-definition.css`).then(res => {
                    if (res) {
                        // File exists so we should remove it
                        try {
                            fs.unlinkSync(`${CSS_FOLDER}/${fontFamily}-definition.css`)
                            createFile(`${CSS_FOLDER}/${fontFamily}-definition.css`, empty_content);
                            //file removed
                            resolve()
                        } catch (err) {
                            console.error(err)
                        }
                    } else {
                        // File does not exists so no need to remove it
                        createFile(`${CSS_FOLDER}/${fontFamily}-definition.css`, empty_content);
                        resolve()
                    }
                })

            });
        });
    })
}

// Download the font source files
async function download_fontfiles() {
    return new Promise(resolve => {
        // Retrieve remote font source files
        for (const format in FORMAT_USER_AGENTS) {
            const headers = { 'User-Agent': FORMAT_USER_AGENTS[format] };
            https.get(FONT_KIT_URL, { headers }, (response) => {
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
                                    //log(`Downloaded "${fontFamily}" font family for "${fontFormat}" format in ${fontWeight} weight and ${fontStyle} style.`);
                                    response.pipe(fs.createWriteStream(`${FONTS_FOLDER}/${filename}`));
                                });
                            }
                        }
                    }
                    resolve(FONT_FAMILY_NAME);
                });
            });
        }
    })
}


async function http_call() {
    return new Promise(resolve => {
        // Set HTTP Headers

        // Make HTTP Request
        https.get(FONT_KIT_URL, (response) => {
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
                resolve(content);
            });
        });
    });

}

// Return a boolean that checks if a file/folder exists on the given path
async function fileExists(path) {
    return new Promise(resolve => {
        if (fs.existsSync(path)) {
            resolve(true);
        } else {
            resolve(false);
        }
    })
}

async function add_style_class(file_url, font_family){
    return new Promise(resolve => {
        let str = `.tk-${font_family} { font-family: "${font_family}",serif; }`
        fs.appendFileSync(file_url, str, function (err) {
            if (err) throw (err);
            resolve('done')
        });
    })
}

// First we create a definition file
create_definition().then(() => {

    // Now we should download the font source files
    download_fontfiles().then(() => {

        // Set the content for the definition file
        http_call().then((body) => {
            // The body of the http request consists of a body
            // with object, these object contain urls
            for (const fontFaceRule of body.match(/@font-face {[^}]+}/g)) {
                // Fontface properties
                const fontFamily = fontFaceRule.match(/font-family:\s*"([^"]+)"/)[1];
                const fontWeight = fontFaceRule.match(/font-weight:\s*([^;]+);/)[1];
                const fontStyle = fontFaceRule.match(/font-style:\s*([^;]+);/)[1];
                const fontUrlAndFormats = fontFaceRule.match(/url\("([^"]+)"\)\s+format\("([^"]+)"\)/g);
                FONT_FAMILY_NAME = fontFamily;
                // Parse the content of the HTTP body (our .CSS) to JSON
                let font = cssJson.toJSON(fontFaceRule);

                // We have to create a filename for the font entry
                let font_filename = `url(".${FONTS_FOLDER}/${fontFamily}_${fontWeight}_${fontStyle}.woff") format("woff"),url(".${FONTS_FOLDER}/${fontFamily}_${fontWeight}_${fontStyle}.woff2") format("woff2"),url(".${FONTS_FOLDER}/${fontFamily}_${fontWeight}_${fontStyle}.otf") format("opentype")`

                // Overide the src value in our JSON object
                font.children['@font-face']['attributes']['src'] = font_filename;

                // Parse our JSON Object to a string
                let cssString = cssJson.toCSS(font)

                fs.appendFileSync(`${CSS_FOLDER}/${fontFamily}-definition.css`, cssString, function (err) {
                    if (err) throw (err);
                });
            }

            // Now we should add the class definition to our css file
            add_style_class(`${CSS_FOLDER}/${FONT_FAMILY_NAME}-definition.css`,FONT_FAMILY_NAME ).then((res) => {
                log(res)
            })
        });
    })
})