const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function buildWhiteCardIcons() {
  const userLogoPath = "C:/Users/kavak/.gemini/antigravity/brain/a70ad6e0-f44e-4b0f-b178-ef6830d68a80/media__1784562080110.png";
  console.log('Building white card PWA icons from:', userLogoPath);

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
            background: #ffffff;
            width: 512px;
            height: 512px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          canvas {
            width: 512px;
            height: 512px;
          }
        </style>
      </head>
      <body>
        <canvas id="canvas" width="512" height="512"></canvas>
        <script>
          const img = new Image();
          img.src = "${imgSrc}";
          img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, 0, 0);

            const imgData = tempCtx.getImageData(0, 0, img.width, img.height);
            const data = imgData.data;

            let minX = img.width, minY = img.height, maxX = 0, maxY = 0;

            for (let y = 0; y < img.height; y++) {
              for (let x = 0; x < img.width; x++) {
                const idx = (y * img.width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                if (!(r > 240 && g > 240 && b > 240)) {
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                }
              }
            }

            const cropW = maxX - minX + 1;
            const cropH = maxY - minY + 1;

            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, 512, 512);

            // Scale blue logo to fill 72% of 512px (368px) centered
            const maxDim = 368;
            const scale = Math.min(maxDim / cropW, maxDim / cropH);
            const drawW = cropW * scale;
            const drawH = cropH * scale;
            const drawX = (512 - drawW) / 2;
            const drawY = (512 - drawH) / 2;

            ctx.drawImage(tempCanvas, minX, minY, cropW, cropH, drawX, drawY, drawW, drawH);
            window.renderedDataUrl = canvas.toDataURL('image/png');
          };
        </script>
      </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForFunction('window.renderedDataUrl !== undefined');

  const dataUrl = await page.evaluate(() => window.renderedDataUrl);
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
  const pngBuffer = Buffer.from(base64Data, 'base64');

  const publicDir = path.join(__dirname, '../public');
  const appDir = path.join(__dirname, '../src/app');

  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'icon.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), pngBuffer);

  fs.writeFileSync(path.join(appDir, 'icon.png'), pngBuffer);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), pngBuffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), pngBuffer);

  await browser.close();
  console.log('SUCCESS: PWA / Taskbar white-background centered logo icons generated!');
}

buildWhiteCardIcons().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
