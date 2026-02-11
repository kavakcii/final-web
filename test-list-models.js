const https = require('https');

const key = "AIzaSyA0vVOu9ke1GvzHFfSUNiEFl-tZ36Xmd8k";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
