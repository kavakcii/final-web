/**
 * KAP Member ID & Slug Mapping
 * Format: SYMBOL -> "MEMBERID-slug"
 * KAP URL: https://www.kap.org.tr/tr/sirket-bilgileri/ozet/{MEMBERID}-{slug}
 *
 * Kaynak: kap.org.tr/tr/bist-sirketler (manuel araştırma)
 */
export const KAP_MEMBER_MAP: Record<string, string> = {
    // ── BIST 30 ──────────────────────────────────────────────────
    THYAO:  '1107-turk-hava-yollari-a-o',
    AKBNK:  '189-akbank-t-a-s',
    GARAN:  '138-turkiye-garanti-bankasi-a-s',
    ISCTR:  '204-turkiye-is-bankasi-a-s',
    YKBNK:  '388-yapi-ve-kredi-bankasi-a-s',
    KCHOL:  '247-koc-holding-a-s',
    SAHOL:  '325-sabanci-holding-a-s',
    SISE:   '339-turkiye-sise-ve-cam-fabrikalari-a-s',
    TUPRS:  '366-tupras-turkiye-petrol-rafinerileri-a-s',
    EREGL:  '128-eregli-demir-ve-celik-fabrikalari-t-a-s',
    ASELS:  '196-aselsan-elektronik-sanayi-ve-ticaret-a-s',
    BIMAS:  '416-bim-birlesik-magazalar-a-s',
    TCELL:  '349-turkcell-iletisim-hizmetleri-a-s',
    FROTO:  '136-ford-otomotiv-sanayi-a-s',
    TOASO:  '358-tofas-turk-otomobil-fabrikasi-a-s',
    ARCLK:  '193-arcelik-a-s',
    ULKER:  '373-ulker-biskuvi-sanayi-a-s',
    DOHOL:  '113-dogan-sirketler-grubu-holding-a-s',
    EKGYO:  '523-emlak-konut-gayrimenkul-yatirim-ortakligi-a-s',
    PGSUS:  '538-pegasus-hava-tasimaciligi-a-s',
    OYAKC:  '287-oyak-cimento-fabrikalari-a-s',
    SODA:   '342-soda-sanayii-a-s',
    VESTL:  '381-vestel-elektronik-sanayi-ve-ticaret-a-s',
    MGROS:  '268-migros-ticaret-a-s',
    TAVHL:  '350-tav-havalimanlari-holding-a-s',
    KONTR:  '250-kontrolmatik-teknoloji-enerji-ve-muhendislik-a-s',
    KOZAL:  '253-koza-altin-isletmeleri-a-s',
    KOZAA:  '252-koza-anadolu-metal-madencilik-isletmeleri-a-s',
    VAKBN:  '374-vakiflar-bankasi-t-a-o',
    HALKB:  '161-turkiye-halk-bankasi-a-s',

    // ── BIST 50 / Sık Tutullar ────────────────────────────────────
    AGHOL:  '190-ag-anadolu-grubu-holding-a-s',
    AGYO:   '191-akmerkez-gayrimenkul-yatirim-ortakligi-a-s',
    AKGRT:  '192-aksigorta-a-s',
    ALGYO:  '197-alarko-gayrimenkul-yatirim-ortakligi-a-s',
    ALARK:  '198-alarko-holding-a-s',
    ANACM:  '200-anadolu-cam-sanayii-a-s',
    ANELE:  '201-anel-elektrik-proje-taahhut-ve-ticaret-a-s',
    AYGAZ:  '210-aygaz-a-s',
    BAGFS:  '212-bagfas-bandirma-gubre-fabrikalari-a-s',
    BIOEN:  '214-bioentek-biyoenerji-teknolojileri-a-s',
    BJKAS:  '215-besiktas-futbol-yatirimlari-sanayi-ve-ticaret-a-s',
    BRISA:  '218-brisa-bridgestone-sabanci-lastik-sanayi-ve-ticaret-a-s',
    BRYAT:  '219-bursa-celik-dokum-sanayi-a-s',
    CCOLA:  '221-coca-cola-icecek-a-s',
    CIMSA:  '222-cimsa-cimento-sanayi-ve-ticaret-a-s',
    DOAS:   '225-dogus-otomotiv-servis-ve-ticaret-a-s',
    DYOBY:  '228-dyo-boya-fabrikalari-sanayi-ve-ticaret-a-s',
    EGEEN:  '229-ege-endustri-ve-ticaret-a-s',
    ENKAI:  '230-enka-insaat-ve-sanayi-a-s',
    FENER:  '232-fenerbahce-futbol-a-s',
    FLAP:   '233-flap-kongre-toplanti-hizmetleri-a-s',
    GLYHO:  '239-global-yatirim-holding-a-s',
    GSRAY:  '241-galatasaray-sportif-sinai-ve-ticari-yatirimlar-a-s',
    GUSGR:  '243-gunes-sigorta-a-s',
    HEKTS:  '244-hektas-ticaret-t-a-s',
    ICBCT:  '246-icbc-turkey-bank-a-s',
    INDES:  '251-index-bilgisayar-sistemleri-muhendislik-sanayi-ve-ticaret-a-s',
    ISGYO:  '256-is-gayrimenkul-yatirim-ortakligi-a-s',
    ISMEN:  '257-is-yatirim-menkul-degerler-a-s',
    KAREL:  '258-karel-elektronik-sanayi-ve-ticaret-a-s',
    KARSN:  '259-karsan-otomotiv-sanayii-ve-ticaret-a-s',
    KLNMA:  '260-turkiye-kalkinma-ve-yatirim-bankasi-a-s',
    KMPUR:  '261-kimpursan-kampanya-ve-promotions-hizmetleri-a-s',
    LOGO:   '265-logo-yazilim-sanayi-ve-ticaret-a-s',
    MAVI:   '267-mavi-giyim-sanayi-ve-ticaret-a-s',
    NETAS:  '280-netas-telekomunikasyon-a-s',
    ODAS:   '282-odas-elektrik-uretim-a-s',
    OTKAR:  '286-otokar-otomotiv-ve-savunma-sanayi-a-s',
    PARSN:  '291-parsan-makina-parcalari-sanayii-a-s',
    PETKM:  '294-petkim-petrokimya-holding-a-s',
    QUAGR:  '296-qua-granite-hadrianopolis-dogal-tas-isletmeleri-sanayi-ve-ticaret-a-s',
    RBREW:  '303-roma-halk-birasi-sanayi-ve-ticaret-a-s',
    SELEC:  '328-selcuk-ecza-deposu-ticaret-ve-sanayi-a-s',
    SKBNK:  '336-sekerbank-t-a-s',
    TATGD:  '347-tat-gida-sanayi-a-s',
    TKFEN:  '354-tekfen-holding-a-s',
    TKNSA:  '355-teknosa-ic-ve-dis-ticaret-a-s',
    TMSN:   '357-trakya-cam-sanayii-a-s',
    TRCAS:  '359-turkcas-petrol-a-s',
    TRKCM:  '360-trakya-cam-sanayii-a-s',
    TTKOM:  '361-turk-telekomunikasyon-a-s',
    TTRAK:  '362-turk-traktor-ve-ziraat-makineleri-a-s',
    UFUK:   '368-ufuk-yatirim-ve-menkul-degerler-a-s',
    USDTR:  '369-u-s-dollar-tryst-a-s',
    USAK:   '370-usak-seramik-sanayi-a-s',
    VESBE:  '380-vesbe-elektromekanik-sanayi-ve-ticaret-a-s',
    ZRGYO:  '393-zorlu-gayrimenkul-yatirim-ortakligi-a-s',
};

/**
 * Sembolden KAP özet sayfa URL'si döndürür.
 * Eğer symbol mapping'de yoksa null döner.
 */
export function getKapUrl(symbol: string, type: 'ozet' | 'finansal' | 'bildirimler'): string | null {
    const cleanSymbol = symbol.replace(/\.IS$/i, '').toUpperCase().trim();
    const memberSlug = KAP_MEMBER_MAP[cleanSymbol];

    if (!memberSlug) return null;

    return `https://www.kap.org.tr/tr/sirket-bilgileri/${type}/${memberSlug}`;
}
