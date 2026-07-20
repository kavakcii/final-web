const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function extractTransparentFLogo() {
  const userLogoPath = "C:/Users/kavak/.gemini/antigravity/brain/a70ad6e0-f44e-4b0f-b178-ef6830d68a80/media__1784562080110.png";
  console.log('Extracting transparent blue F logo from:', userLogoPath);

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
          }
        </style>
      </head>
      <body>
        <canvas id="canvas"></canvas>
        <canvas id="outCanvas" width="512" height="512"></canvas>
        <script>
          const img = new Image();
          img.src = "${imgSrc}";
          img.onload = () => {
            const canvas = document.getElementById('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, img.width, img.height);
            const data = imgData.data;

            let minX = img.width, minY = img.height, maxX = 0, maxY = 0;

            // Make white / near-white background transparent and find bounding box of blue F symbol
            for (let y = 0; y < img.height; y++) {
              for (let x = 0; x < img.width; x++) {
                const idx = (y * img.width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                // If pixel is white or near-white (background)
                if (r > 240 && g > 240 && b > 240) {
                  data[idx + 3] = 0; // Make transparent
                } else {
                  // Non-white pixel (the blue F logo symbol)
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                }
              }
            }

            ctx.putImageData(imgData, 0, 0);

            const cropW = maxX - minX + 1;
            const cropH = maxY - minY + 1;

            // Render cropped transparent blue F logo onto 512x512 canvas
            const outCanvas = document.getElementById('outCanvas');
            const outCtx = outCanvas.getContext('2d');
            outCtx.clearRect(0, 0, 512, 512);

            // Scale to fill 92% of the 512x512 frame nicely
            const scale = Math.min(470 / cropW, 470 / cropH);
            const drawW = cropW * scale;
            const drawH = cropH * scale;
            const drawX = (512 - drawW) / 2;
            const drawY = (512 - drawH) / 2;

            outCtx.drawImage(canvas, minX, minY, cropW, cropH, drawX, drawY, drawW, drawH);
            window.renderedDataUrl = outCanvas.toDataURL('image/png');
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

  fs.writeFileSync(path.join(publicDir, 'logo.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'icon.png'), pngBuffer);

  fs.writeFileSync(path.join(appDir, 'icon.png'), pngBuffer);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), pngBuffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), pngBuffer);

  await browser.close();
  console.log('SUCCESS: Extracted pure transparent blue F ribbon logo without white background!');
}

extractTransparentFLogo().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
