const https = require('https');
const axios = require('axios');
(async () => {
    try {
        const res = await axios.get('https://www.kap.org.tr/tr/api/bistSirketler');
        console.log("KAP API Success:", res.data.length);
    } catch (e) { console.error("KAP:", e.message) }
    
    try {
        const res = await axios.get('https://www.kap.org.tr/tr/api/memberDetail');
        console.log("KAP Member Detail:", res.data.length);
    } catch (e) { console.error("KAP2:", e.message) }
})();
