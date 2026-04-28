export interface AssetSectorMapping {
  hisseler: string[];
  fonlar: string[];
}

export const ASSET_SECTORS: Record<string, AssetSectorMapping> = {
  "Savunma": {
    hisseler: ["ASELS", "SDTTR", "KORDS", "PAPIL", "ONCSH"],
    fonlar: ["ZSA", "FES", "TTE"]
  },
  "Bilişim ve Yazılım": {
    hisseler: ["MIATK", "ARDYZ", "REEDR", "KONTR", "ARDYZ", "HTGZT"],
    fonlar: ["TTE", "IZT", "CPU", "HTP", "YHZ"]
  },
  "Bankacılık": {
    hisseler: ["AKBNK", "ISCTR", "GARAN", "YKBNK", "HALKB", "VAKBN"],
    fonlar: ["ADP", "YAS", "TAU", "GBP"]
  },
  "Enerji Teknolojileri": {
    hisseler: ["ASTOR", "CWENE", "SAYAS", "EUPWR", "YEOTK"],
    fonlar: ["AES", "ZGNE", "KPC", "EID"]
  },
  "Enerji Üretim ve Dağıtım": {
    hisseler: ["ENJSA", "AKSA", "ODAS", "ZOREN", "GWIND"],
    fonlar: ["KPC", "AEP"]
  },
  "Ulaştırma": {
    hisseler: ["THYAO", "PGSUS", "TAVHL", "DOCO", "GSDHO"],
    fonlar: ["TUD", "YAU"]
  },
  "Otomotiv": {
    hisseler: ["FROTO", "TOASO", "DOAS", "TTRAK", "ASUZU"],
    fonlar: ["OTJ", "HOH"]
  },
  "Holding": {
    hisseler: ["KCHOL", "SAHOL", "ALARK", "DOHOL", "GSDHO"],
    fonlar: ["YAS", "TID"]
  },
  "Gıda ve İçecek": {
    hisseler: ["CCOLA", "AEFES", "TATGD", "ULUUN", "AVOD"],
    fonlar: ["GDK", "OJK"]
  },
  "Gıda Perakendeciliği": {
    hisseler: ["BIMAS", "MGROS", "SOKM"],
    fonlar: ["GDK", "TGB"]
  },
  "Ana Metal": {
    hisseler: ["EREGL", "KRDMD", "ISDMR", "KOZAL", "KOZAA"],
    fonlar: ["OTJ", "TUM"]
  },
  "Gayrimenkul": {
    hisseler: ["EKGYO", "SNGYO", "TRGYO", "ASGYO", "KZBGY"],
    fonlar: ["TDG", "GZRP"]
  },
  "İlaç ve Sağlık": {
    hisseler: ["ECILC", "GENIL", "MPARK", "TRILC", "SELGD"],
    fonlar: ["HES", "SAG"]
  },
  "Haberleşme": {
    hisseler: ["TCELL", "TTKOM"],
    fonlar: ["TUD", "YAU"]
  },
  "Cam, Seramik, Porselen": {
    hisseler: ["SISE", "KUTPO", "EGSER"],
    fonlar: ["OTJ"]
  },
  "Dayanıklı Tüketim": {
    hisseler: ["ARCLK", "VESBE", "VESTL"],
    fonlar: ["OTJ"]
  },
  "Sigorta": {
    hisseler: ["TURSG", "AKGRT", "ANSGR"],
    fonlar: ["YAS"]
  },
  "Savunma Yan Sanayi": {
    hisseler: ["KORDS", "BRISA"],
    fonlar: ["ZSA"]
  },
  "Tekstil, Giyim ve Deri": {
    hisseler: ["SASA", "HEKTS", "KORDS"],
    fonlar: ["AES"]
  },
  "Kimya ve Plastik": {
    hisseler: ["SASA", "HEKTS", "PETKM", "TKFEN"],
    fonlar: ["AES"]
  },
  "Taş, Toprak, Çimento": {
    hisseler: ["AKCNS", "OYAKC", "NUHCM", "BUCIM"],
    fonlar: ["OTJ"]
  },
  "Girişim Sermayesi Yat. Ort.": {
    hisseler: ["HUBVC", "GOZDE", "INVEO"],
    fonlar: ["ZSA"]
  }
};
