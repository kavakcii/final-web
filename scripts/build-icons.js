const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function buildIcons() {
  console.log('Generating high-res PNG icons from logo.svg...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const svgContent = fs.readFileSync(path.join(__dirname, '../public/logo.svg'), 'utf8');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: transparent;
            width: 512px;
            height: 512px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          svg {
            width: 460px;
            height: 460px;
          }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;

  await page.setContent(html);
  await page.setViewport({ width: 512, height: 512 });

  const pngBuffer = await page.screenshot({ type: 'png', omitBackground: true });

  const publicDir = path.join(__dirname, '../public');
  const appDir = path.join(__dirname, '../src/app');

  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'logo.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngBuffer);
  fs.writeFileSync(path.join(appDir, 'icon.png'), pngBuffer);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), pngBuffer);

  await browser.close();
  console.log('SUCCESS: All PNG icons generated and saved!');
}

buildIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
