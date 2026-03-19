const https = require('https');
https.get('https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/Common/Data.aspx/Temettu', (res) => {
    let rawData = '';
    res.on('data', (chunk) => rawData += chunk);
    res.on('end', () => console.log(rawData.substring(0, 500)));
});
