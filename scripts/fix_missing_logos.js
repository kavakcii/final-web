const fs = require('fs');
const path = require('path');

const logosDir = path.join(__dirname, '..', 'public', 'logos');
if (!fs.existsSync(logosDir)) {
  console.error("Logos directory does not exist.");
  process.exit(1);
}

const files = fs.readdirSync(logosDir);
console.log(`Found ${files.length} files in public/logos.`);

// KRON <-> KRONT, EREGL <-> ISDMR vb. bilinen sembol varyasyonları için kopyalama ve alias oluşturma
const aliases = [
  ["KRON", "KRONT"],
  ["AGRO", "AGROT"],
  ["KRDMA", "KRDMD"],
  ["KRDMB", "KRDMD"],
  ["ISATR", "ISCTR"],
  ["ISBTR", "ISCTR"],
  ["YIGITAKU", "YIGIT"],
  ["RUZYE-ALMAD", "ALMAD"],
  ["SEGMN", "SEKMN"],
  ["TCKRC", "TCKRC"],
  ["SMRVA-ICON", "SMRVA"]
];

aliases.forEach(([srcSym, targetSym]) => {
  const exts = ['.png', '.jpeg', '.jpg', '.svg', '.webp'];
  exts.forEach(ext => {
    const srcFile = path.join(logosDir, `${srcSym}${ext}`);
    const targetFile = path.join(logosDir, `${targetSym}${ext}`);
    
    if (fs.existsSync(srcFile) && !fs.existsSync(targetFile)) {
      try {
        fs.copyFileSync(srcFile, targetFile);
        console.log(`Alias created: ${srcSym}${ext} -> ${targetSym}${ext}`);
      } catch (e) {}
    }
    
    // Reverse check
    if (fs.existsSync(targetFile) && !fs.existsSync(srcFile)) {
      try {
        fs.copyFileSync(targetFile, srcFile);
        console.log(`Alias created: ${targetSym}${ext} -> ${srcSym}${ext}`);
      } catch (e) {}
    }
  });
});

console.log("Symbol alias fix complete.");
