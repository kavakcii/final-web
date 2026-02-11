const https = require('https');

const key = "AIzaSyA0vVOu9ke1GvzHFfSUNiEFl-tZ36Xmd8k";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
        const json = JSON.parse(data);
        if (json.models) {
            console.log("Available Gemini Models:");
            json.models.forEach(m => {
                if (m.name.includes('gemini')) {
                    console.log(m.name);
                }
            });
        } else {
            console.log("No models found or error:", json);
        }
    } catch (e) {
        console.error("Parse error:", e);
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
