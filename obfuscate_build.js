const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const rootDir = __dirname;
const jsDir = path.join(rootDir, 'js');

if (!fs.existsSync(jsDir)) {
    fs.mkdirSync(jsDir, { recursive: true });
}

function processFile(htmlFileName, jsFileName) {
    const htmlPath = path.join(rootDir, htmlFileName);
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Regex to match script type="module" block
    const scriptRegex = /<script type="module">([\s\S]*?)<\/script>/i;
    const match = htmlContent.match(scriptRegex);

    if (!match) {
        console.log(`No inline module script found in ${htmlFileName}`);
        return;
    }

    const rawJsCode = match[1];

    console.log(`Obfuscating JavaScript for ${htmlFileName}...`);

    // Obfuscate JavaScript code
    const obfuscationResult = JavaScriptObfuscator.obfuscate(rawJsCode, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.8,
        splitStrings: true,
        renameGlobals: false, // Ensure imports/exports & DOM event handles work
        target: 'browser'
    });

    const obfuscatedJsCode = obfuscationResult.getObfuscatedCode();

    const jsOutPath = path.join(jsDir, jsFileName);
    fs.writeFileSync(jsOutPath, obfuscatedJsCode, 'utf8');
    console.log(`Saved obfuscated JS to js/${jsFileName} (${(obfuscatedJsCode.length / 1024).toFixed(1)} KB)`);

    // Update HTML file to reference external obfuscated script
    const newHtmlContent = htmlContent.replace(
        scriptRegex,
        `<script type="module" src="js/${jsFileName}"></script>`
    );

    fs.writeFileSync(htmlPath, newHtmlContent, 'utf8');
    console.log(`Updated ${htmlFileName} to reference js/${jsFileName}`);
}

processFile('index.html', 'index.min.js');
processFile('admin.html', 'admin.min.js');
processFile('register.html', 'register.min.js');

console.log('🎉 All JavaScript files successfully obfuscated and secured!');
