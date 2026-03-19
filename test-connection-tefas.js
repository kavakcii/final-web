const https = require('https');

const options = {
    hostname: 'www.tefas.gov.tr',
    path: '/',
    method: 'GET',
    rejectUnauthorized: false,
    ciphers: 'DEFAULT@SECLEVEL=1',
    secureOptions: require('constants').SSL_OP_LEGACY_SERVER_CONNECT
};

const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
