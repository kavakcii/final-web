async function debugTefasDetail() {
  try {
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': 'https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=MAC',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    // 1. Asset Allocation (Pie Chart)
    const pieResponse = await fetch('https://www.tefas.gov.tr/api/DB/BindPieChartDataSource', {
        method: 'POST',
        headers: headers,
        body: new URLSearchParams({
            "fontip": "YAT",
            "fonturkod": "",
            "fongrup": "",
            "kurucukod": "",
            "fonkod": "MAC", // Marmara Capital
            "bastarih": "2024-01-01",
            "bittarih": "2024-01-01",
            "islemdurum": ""
        }).toString()
    });
    const pieData = await pieResponse.json();
    console.log("Asset Allocation (MAC):", JSON.stringify(pieData, null, 2));

    // 2. Daily Return / Price (Main Info)
    // Trying BindMainPageIndicators or BindHistoryInfo
    const historyResponse = await fetch('https://www.tefas.gov.tr/api/DB/BindHistoryInfo', {
        method: 'POST',
        headers: headers,
        body: new URLSearchParams({
            "fontip": "YAT",
            "fonturkod": "",
            "fongrup": "",
            "kurucukod": "",
            "fonkod": "MAC",
            "bastarih": "2025-01-01", // Recent date
            "bittarih": "2025-02-10",
            "islemdurum": ""
        }).toString()
    });
    const historyData = await historyResponse.json();
    console.log("History Data Length:", historyData.data.length);
    console.log("Latest History Sample:", JSON.stringify(historyData.data[historyData.data.length - 1], null, 2));

  } catch (error) {
    console.error("Error:", error.message);
  }
}

debugTefasDetail();