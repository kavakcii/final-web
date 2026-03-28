const fs = require('fs');
async function run() {
    const res = await fetch('https://www.kap.org.tr/tr/api/memberDetail');
    // or https://www.kap.org.tr/tr/bist-sirketler
    const html = await (await fetch('https://www.kap.org.tr/tr/bist-sirketler')).text();
    const strMatch = html.match(/\[.*?\]/g);
    fs.writeFileSync('kap-test.html', html);
    console.log("Saved. Len:", html.length);
}
run();
