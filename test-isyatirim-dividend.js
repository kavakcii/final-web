const symbol = 'THYAO';
const options = {
  method: 'GET',
  headers: {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
};

fetch(`https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/Common/Data.aspx/TemettuVerimi?hisse=${symbol}`, options)
  .then(res => res.json())
  .then(json => {
    console.log("IS YATIRIM JSON:", JSON.stringify(json).substring(0, 500));
  })
  .catch(err => console.error("Error:", err));
