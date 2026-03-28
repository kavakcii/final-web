export const KAP_MEMBER_MAP: Record<string, string> = {
    // Kesin Garantili Liste (Kullanıcı Veritabanı)
    PETKM: '1053-petkim-petrokimya-holding-a-s',
    DOAS: '1391-dogus-otomotiv-servis-ve-ticaret-a-s',
    THYAO: '1107-turk-hava-yollari-a-o',
    TUPRS: '1105-tupras-turkiye-petrol-rafinerileri-a-s',
    KCHOL: '1005-koc-holding-a-s',
    GARAN: '2422-turkiye-garanti-bankasi-a-s',
    AKBNK: '2413-akbank-t-a-s',
    ISCTR: '2425-turkiye-is-bankasi-a-s',
    YKBNK: '2429-yapi-ve-kredi-bankasi-a-s',
    SAHOL: '976-haci-omer-sabanci-holding-a-s',
    SISE: '1087-turkiye-sise-ve-cam-fabrikalari-a-s',
    EREGL: '944-eregli-demir-ve-celik-fabrikalari-t-a-s',
    ASELS: '866-aselsan-elektronik-sanayi-ve-ticaret-a-s',
    BIMAS: '1406-bim-birlesik-magazalar-a-s',
    TCELL: '1103-turkcell-iletisim-hizmetleri-a-s',
    FROTO: '956-ford-otomotiv-sanayi-a-s',
    TOASO: '1096-tofas-turk-otomobil-fabrikasi-a-s',
    ARCLK: '863-arcelik-a-s',
    ULKER: '859-ulker-biskuvi-sanayi-a-s',
    DOHOL: '919-dogan-sirketler-grubu-holding-a-s',
    EKGYO: '1531-emlak-konut-gayrimenkul-yatirim-ortakligi-a-s',
    PGSUS: '1710-pegasus-hava-tasimaciligi-a-s',
    OYAKC: '1019-oyak-cimento-fabrikalari-a-s',
    VESTL: '1122-vestel-elektronik-sanayi-ve-ticaret-a-s',
    MGROS: '1494-migros-ticaret-a-s',
    TAVHL: '1452-tav-havalimanlari-holding-a-s',
    KONTR: '5206-kontrolmatik-teknoloji-enerji-ve-muhendislik-a-s',
    VAKBN: '2428-turkiye-vakiflar-bankasi-t-a-o',
    HALKB: '2423-turkiye-halk-bankasi-a-s',
    HEKTS: '978-hektas-ticaret-t-a-s',
    SASA: '1068-sasa-polyester-sanayi-a-s',
    TTKOM: '1473-turk-telekomunikasyon-a-s',
    ENJSA: '3494-enerjisa-enerji-a-s',
    ASTOR: '4680-astor-enerji-a-s',
    ALFAS: '5675-alfa-solar-enerji-sanayi-ve-ticaret-a-s',
    CWENE: '5033-cw-enerji-muhendislik-ticaret-ve-sanayi-a-s',
    EUREN: '5612-europen-endustri-insaat-sanayi-ve-ticaret-a-s',
    GUBRF: '974-gubre-fabrikalari-t-a-s',
    ODAS: '1887-odas-elektrik-uretim-sanayi-ticaret-a-s',
    KRDMD: '994-kardemir-karabuk-demir-celik-sanayi-ve-ticaret-a-s',
    OTKAR: '1046-otokar-otomotiv-ve-savunma-sanayi-a-s',
    KOZAL: '1394-koza-altin-isletmeleri-a-s',
    TKFEN: '1470-tekfen-holding-a-s',
    TSPOR: '1400-trabzonspor-sportif-yatirim-ve-futbol-isletmeciligi-ticaret-a-s',
    ISMEN: '1533-is-yatirim-menkul-degerler-a-s',
    SKBNK: '2418-sekerbank-t-a-s',
    ISGYO: '987-is-gayrimenkul-yatirim-ortakligi-a-s'
};

export function getKapUrl(symbol: string, type: 'ozet' | 'finansal' | 'bildirimler'): string | null {
    const cleanSymbol = symbol.replace(/\.IS$/i, '').toUpperCase().trim();
    const memberSlug = KAP_MEMBER_MAP[cleanSymbol];

    if (!memberSlug) return null;
    return `https://www.kap.org.tr/tr/sirket-bilgileri/${type}/${memberSlug}`;
}
