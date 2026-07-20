const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function buildUserLogoIcons() {
  const userLogoPath = "C:/Users/kavak/.gemini/antigravity/brain/a70ad6e0-f44e-4b0f-b178-ef6830d68a80/media__1784562080110.png";
  console.log('Loading user uploaded ribbon F logo from:', userLogoPath);

  const imgBase64 = fs.readFileSync(userLogoPath).toString('base64');
  const imgSrc = `data:image/png;base64,${imgBase64}`;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

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
          img {
            max-width: 440px;
            max-height: 440px;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <img src="${imgSrc}" />
      </body>
    </html>
  `;

  await page.setContent(html);
  await page.setViewport({ width: 512, height: 512 });

  const pngBuffer = await page.screenshot({ type: 'png', omitBackground: true });

  const publicDir = path.join(__dirname, '../public');
  const appDir = path.join(__dirname, '../src/app');

  fs.writeFileSync(path.join(publicDir, 'logo.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'icon.png'), pngBuffer);
  fs.writeFileSync(path.join(appDir, 'icon.png'), pngBuffer);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), pngBuffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), pngBuffer);

  await browser.close();
  console.log('SUCCESS: All icon files updated with the EXACT user-uploaded ribbon F logo!');
}

buildUserLogoIcons().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
