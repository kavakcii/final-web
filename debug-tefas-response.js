async function debugTefasResponse() {
  try {
    const url = 'https://www.tefas.gov.tr/api/DB/BindComparisonFundReturns';
    const payload = {
        "calismatipi": "2",
        "fontip": "YAT",
        "sfontur": "",
        "kurucukod": "",
        "fongrup": "",
        "bastarih": "2024-01-01",
        "bittarih": "2024-01-01",
        "fonturkod": "",
        "fonunvantip": "",
        "strperiod": "1,1,1,1,1,1,1",
        "islemdurum": ""
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': 'https://www.tefas.gov.tr/FonKarsilastirma.aspx',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: new URLSearchParams(payload).toString()
    });

    const data = await response.json();

    console.log("Total Funds:", data.data.length);
    console.log("First Fund Keys:", Object.keys(data.data[0]));
    console.log("First Fund Sample:", JSON.stringify(data.data[0], null, 2));
    
    // Find a fund with non-empty daily return if possible
    // Looking for anything that looks like daily return
    const sample = data.data[0];
    console.log("Potential Daily Return Fields:", {
        FONGETIRI: sample.FONGETIRI,
        GUNLUK: sample.GUNLUK,
        GETIRI: sample.GETIRI,
        FIYAT: sample.FIYAT
    });

  } catch (error) {
    console.error("Error:", error.message);
  }
}

debugTefasResponse();