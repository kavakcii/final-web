const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\kavak\\Downloads\\FinAi Logolar';
const destDir = path.join(__dirname, '..', 'public', 'logos');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

console.log(`Copying logos from "${srcDir}" to "${destDir}"...`);

if (!fs.existsSync(srcDir)) {
  console.error(`Source directory does not exist: ${srcDir}`);
  process.exit(1);
}

const files = fs.readdirSync(srcDir);
let copyCount = 0;

files.forEach(file => {
  const ext = path.extname(file).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.svg', '.webp'].includes(ext)) {
    // Clean filename: e.g. "METUR (1).png" -> "METUR", "surgy.jpeg" -> "SURGY", "logo.png" -> ignore
    let baseName = path.basename(file, ext).split(' ')[0].split('(')[0].trim().toUpperCase();
    if (baseName && baseName !== 'LOGO' && baseName !== 'TR_BADGE_WEB_GENERIC') {
      const srcPath = path.join(srcDir, file);
      // Save with original extension and also as .png for fallback
      const destPathOriginal = path.join(destDir, `${baseName}${ext}`);
      const destPathPng = path.join(destDir, `${baseName}.png`);
      
      try {
        fs.copyFileSync(srcPath, destPathOriginal);
        if (ext !== '.png') {
          fs.copyFileSync(srcPath, destPathPng);
        }
        copyCount++;
      } catch (err) {
        console.error(`Error copying ${file}:`, err);
      }
    }
  }
});

console.log(`SUCCESS: Copied ${copyCount} stock logo images into "public/logos/".`);
