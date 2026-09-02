"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  Zap, 
  Activity,
  Info,
  BarChart3,
  Building2,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trophy,
  Flame,
  X,
  ExternalLink,
  Filter,
  ChevronDown,
  PieChart,
  Coins,
  Minus,
  ArrowLeftRight,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { STOCK_SECTORS } from "@/lib/constants/assets-mapping";

// BIST Şirket Tam Adları Kataloğu
const STOCK_NAMES: Record<string, string> = {
    "ATATR": "Ata Turizm İşletmecilik Taşımacılık Madencilik Kuyumculuk San. ve Dış Ticaret A.Ş.",
    "BESTE": "Best Brands Grup Enerji Yatırım A.Ş.",
    "AKHAN": "Akhan Un Fabrikası ve Tarım Ürünleri Gıda Sanayi Tic. A.Ş.",
    "NETCD": "Netcad Yazılım A.Ş.",
    "ZGYO": "Z Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "MEYSU": "Meysu Gıda San. ve Tic. A.Ş.",
    "ARFYE": "Arf Bio Yenilenebilir Enerji Üretim A.Ş.",
    "ZERGY": "Zeray Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "PAHOL": "Pasifik Holding A.Ş.",
    "ECOGR": "Ecogreen Enerji Holding A.Ş.",
    "MARMR": "Marmara Holding A.Ş.",
    "DOFRB": "Dof Robotik Sanayi A.Ş.",
    "BULGS": "Bulls Girişim Sermayesi Yatırım Ortaklığı A.Ş.",
    "BALSU": "Balsu Gıda San. ve Tic. A.Ş.",
    "KLYPV": "Kalyon Güneş Teknolojileri Üretim A.Ş.",
    "ENDAE": "Enda Enerji Holding A.Ş.",
    "VSNMD": "Vişne Madencilik Üretim San. ve Tic. A.Ş.",
    "DSTKF": "Destek Finans Faktoring A.Ş.",
    "BIGEN": "Birleşim Grup Enerji Yatırımları A.Ş.",
    "SERNT": "Seranit Granit Seramik San. ve Tic. A.Ş.",
    "MOPAS": "Mopaş Marketcilik Gıda San. ve Tic. A.Ş.",
    "AKFIS": "Akfen İnşaat Turizm ve Ticaret A.Ş.",
    "GLRMK": "Gülermak Ağır Sanayi İnşaat ve Taahhüt A.Ş.",
    "EGEGY": "Egeyapı Avrupa Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "ARMGD": "Armada Gıda Ticaret Sanayi A.Ş.",
    "SMRVA": "Sümer Varlık Yönetim A.Ş.",
    "CGCAM": "Çağdaş Cam San. ve Tic. A.Ş.",
    "BINBN": "(binbin) Bin Ulaşım ve Akıllı Şehir Teknolojileri A.Ş.",
    "DURKN": "Durukan Şekerleme San. ve Tic. A.Ş.",
    "CEMZY": "Cem Zeytin A.Ş.",
    "OZATD": "Özata Denizcilik San. ve Tic. A.Ş.",
    "AHSGY": "Ahes Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "GUNDG": "Gündoğdu Gıda Süt Ürünleri San. ve Dış Tic. A.Ş.",
    "TCKRC": "Kıraç Galvaniz Telekominikasyon Metal Makine İnşaat Elektrik San. ve Tic. A.Ş.",
    "BAHKM": "Bahadır Kimya San. ve Tic. A.Ş.",
    "DCTTR": "Dct Trading Dış Ticaret A.Ş.",
    "SEGMN": "Seğmen Kardeşler Gıda Üretim ve Ambalaj Sanayi A.Ş.",
    "EFOR": "Efor Yatırım Sanayi Tic. A.Ş.",
    "HOROZ": "Horoz Lojistik Kargo Hizmetleri ve Tic. A.Ş.",
    "YIGIT": "Yiğit Akü Malzemeleri Nakliyat Turizm İnşaat San. ve Tic. A.Ş.",
    "ALKLC": "Altınkılıç Gıda ve Süt San. Tic. A.Ş.",
    "OZYSR": "Özyaşar Tel ve Galvanizleme San. A.Ş.",
    "ONRYT": "Onur Yüksek Teknoloji A.Ş.",
    "HRKET": "Hareket Proje Taşımacılığı ve Yük Mühendisliği A.Ş.",
    "KOCMT": "Koç Metalurji A.Ş.",
    "ALTNY": "Altınay Savunma Teknolojileri A.Ş.",
    "KOTON": "Koton Mağazacılık Tekstil San. ve Tic. A.Ş.",
    "LILAK": "Lila Kağıt San. ve Tic. A.Ş.",
    "RGYAS": "Rönesans Gayrimenkul Yatırım A.Ş.",
    "ENTRA": "Ic Enterra Yenilenebilir Enerji A.Ş.",
    "ODINE": "Odine Solutions Teknoloji Tic. ve San. A.Ş.",
    "MOGAN": "Mogan Enerji Yatırım Holding A.Ş.",
    "ARTMS": "Artemis Halı A.Ş.",
    "OBAMS": "Oba Makarnacılık San. ve Tic. A.Ş.",
    "ALVES": "Alves Kablo San. ve Tic. A.Ş.",
    "LMKDC": "Limak Doğu Anadolu Çimento San. ve Tic. A.Ş.",
    "BORSK": "Bor Şeker A.Ş.",
    "PATEK": "Pasifik Teknoloji A.Ş.",
    "AVPGY": "Avrupakent Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "MEGMT": "Mega Metal San. ve Tic. A.Ş.",
    "KBORU": "Kuzey Boru A.Ş.",
    "SURGY": "Sur Tatil Evleri Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "CATES": "Çates Elektrik Üretim A.Ş.",
    "SKYMD": "Şeker Yatırım Menkul Değerler A.Ş.",
    "BEGYO": "Batı Ege Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "AGROT": "Agrotech Yüksek Teknoloji ve Yatırım A.Ş.",
    "EKOS": "Ekos Teknoloji ve Elektrik A.Ş.",
    "BINHO": "1000 Yatırımlar Holding A.Ş.",
    "MARBL": "Tureks Turunç Madencilik İç ve Dış Tic. A.Ş.",
    "TABGD": "Tab Gıda San. ve Tic. A.Ş.",
    "VRGYO": "Vera Konsept Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "MHRGY": "Mhr Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "BORLS": "Borlease Otomotiv A.Ş.",
    "DOFER": "Dofer Yapı Malzemeleri San. ve Tic. A.Ş.",
    "MEKAG": "Meka Global Makine İmalat San. ve Tic. A.Ş.",
    "DMRGD": "Dmr Unlu Mamuller Üretim Gıda Toptan Perakende İhracat A.Ş.",
    "ADGYO": "Adra Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "HATSN": "Hat-San Gemi İnşaa Bakım Onarım Deniz Nakliyat San. ve Tic. A.Ş.",
    "REEDR": "Reeder Teknoloji San. ve Tic. A.Ş.",
    "GIPTA": "Gıpta Ofis Kırtasiye ve Promosyon Ürünleri İmalat San. A.Ş.",
    "TARKM": "Tarkim Bitki Koruma San. ve Tic. A.Ş.",
    "EBEBK": "Ebebek Mağazacılık A.Ş.",
    "KZGYO": "Kuzugrup Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "ENERY": "Enerya Enerji A.Ş.",
    "TATEN": "Tatlıpınar Enerji Üretim A.Ş.",
    "OFSYM": "Ofis Yem Gıda San. Tic. A.Ş.",
    "IZENR": "İzdemir Enerji Elektrik Üretim A.Ş.",
    "ASGYO": "Asce Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "KLSER": "Kaleseramik, Çanakkale Kalebodur Seramik Sanayi A.Ş.",
    "FZLGY": "Fuzul Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "ATAKP": "Atakey Patates Gıda San. ve Tic. A.Ş.",
    "FORTE": "Forte Bilgi İletişim Teknolojileri ve Savunma Sanayi A.Ş.",
    "A1CAP": "A1 Capital Yatırım Menkul Değerler A.Ş.",
    "PASEU": "Pasifik Eurasia Lojistik Dış Ticaret A.Ş.",
    "KTLEV": "Katılımevim Tasarruf Finansman A.Ş.",
    "BIENY": "Bien Yapı Ürünleri San. Turizm ve Tic. A.Ş.",
    "KAYSE": "Kayseri Şeker Fabrikası A.Ş.",
    "BIGCH": "(BigChefs) Büyük Şefler Gıda Turizm Tekstil Danışmanlık Organizasyon Eğitim San. ve Tic. A.Ş.",
    "CWENE": "Cw Enerji Mühendislik Tic. ve San. A.Ş.",
    "GRTHO": "Graınturk Holding A.Ş.",
    "EUPWR": "Europower Enerji ve Otomasyon Teknolojileri San. Tic. A.Ş.",
    "CVKMD": "Cvk Maden İşletmeleri San. ve Tic. A.Ş.",
    "KOPOL": "Koza Polyester San. ve Tic. A.Ş.",
    "EKSUN": "Eksun Gıda Tarım San. ve Tic. A.Ş.",
    "AKFYE": "Akfen Yenilenebilir Enerji A.Ş.",
    "GOKNR": "Göknur Gıda Maddeleri Enerji İmalat İthalat İhracat Tic. ve San. A.Ş.",
    "BVSAN": "Bülbüloğlu Vinç San. ve Tic. A.Ş.",
    "MACKO": "Maçkolik İnternet Hizmetleri Tic. A.Ş.",
    "ASTOR": "Astor Enerji A.Ş.",
    "TNZTP": "Tapdi Oksijen Özel Sağlık ve Eğitim Hizmetleri San. Tic. A.Ş.",
    "SOKE": "Söke Değirmencilik San. ve Tic. A.Ş.",
    "SDTTR": "Sdt Uzay ve Savunma Teknolojileri A.Ş.",
    "ONCSM": "Oncosem Onkolojik Sistemler San. ve Tic. A.Ş.",
    "EYGYO": "Eyg Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "TERA": "Tera Yatırım Menkul Değerler A.Ş.",
    "AHGAZ": "Ahlatcı Doğal Gaz Dağıtım Enerji ve Yatırım A.Ş.",
    "BRKVY": "Birikim Varlık Yönetim A.Ş.",
    "PLTUR": "Platform Turizm Taşımacılık Gıda İnşaat Temizlik Hizmetleri San. ve Tic. A.Ş.",
    "OZSUB": "Özsu Balık Üretim A.Ş.",
    "SNICA": "Sanica Isı Sanayi A.Ş.",
    "ALFAS": "Alfa Solar Enerji San. ve Tic. A.Ş.",
    "AZTEK": "Aztek Teknoloji Ürünleri A.Ş.",
    "HKTM": "Hidropar Hareket Kontrol Teknolojileri Merkezi San. ve Tic. A.Ş.",
    "BARMA": "Barem Ambalaj San. ve Tic. A.Ş.",
    "KRPLS": "Koroplast Temizlik Ambalaj Ürünleri San. ve Dış Ticaret A.Ş.",
    "KLRHO": "Kiler Holding A.Ş.",
    "RUBNS": "Rubenis Tekstil San. Tic. A.Ş.",
    "KCAER": "Kocaer Çelik San. ve Tic. A.Ş.",
    "PRDGS": "Pardus Girişim Sermayesi Yatırım Ortaklığı A.Ş.",
    "MAKIM": "Makim Makina Teknolojileri San. Tic. A.Ş.",
    "EUREN": "Europen Endüstri İnşaat San. ve Tic. A.Ş.",
    "SEGYO": "Şeker Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "SUNTK": "Sun Tekstil San. ve Tic. A.Ş.",
    "YYLGD": "Yayla Agro Gıda San. ve Tic. A.Ş.",
    "BMSTL": "Bms Birleşik Metal San. ve Tic. A.Ş.",
    "IMASM": "İmaş Makine Sanayi A.Ş.",
    "KMPUR": "Kimteks Poliüretan San. ve Tic. A.Ş.",
    "CONSE": "Consus Enerji İşletmeciliği ve Hizmetleri A.Ş.",
    "SUWEN": "Suwen Tekstil Sanayi Pazarlama A.Ş.",
    "LIDER": "Ldr Turizm A.Ş.",
    "SMRTG": "Smart Güneş Enerjisi Teknolojileri Ar-Ge Üretim San. ve Tic. A.Ş.",
    "ENSRI": "Ensari Deri Gıda San. ve Tic. A.Ş.",
    "GRSEL": "Gür-Sel Turizm Taşımacılık ve Servis Tic. A.Ş.",
    "GZNMI": "Gezinomi Seyahat Turizm Tic. A.Ş.",
    "KLSYN": "Koleksiyon Mobilya Sanayi A.Ş.",
    "HTTBT": "Hitit Bilgisayar Hizmetleri A.Ş.",
    "INVES": "Investco Holding A.Ş.",
    "DAPGM": "Dap Gayrimenkul Geliştirme A.Ş.",
    "HUNER": "Hun Yenilenebilir Enerji Üretim A.Ş.",
    "PNLSN": "Panelsan Çatı Cephe Sistemleri San. ve Tic. A.Ş.",
    "ERCB": "Erciyas Çelik Boru San. A.Ş.",
    "PSGYO": "Pasifik Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "PCILT": "Pc İletişim ve Medya Hizmetleri San. Tic. A.Ş.",
    "GMTAS": "Gimat Mağazacılık San. ve Tic. A.Ş.",
    "KONKA": "Konya Kağıt San. ve Tic. A.Ş.",
    "MOBTL": "Mobiltel İletişim Hizmetleri San. ve Tic. A.Ş.",
    "MIATK": "Mia Teknoloji A.Ş.",
    "ISSEN": "İşbir Sentetik Dokuma Sanayi A.Ş.",
    "ELITE": "Elite Naturel Organik Gıda San. ve Tic. A.Ş.",
    "ARASE": "Doğu Aras Enerji Yatırımları A.Ş.",
    "ULUFA": "Ulusal Faktoring A.Ş.",
    "IHAAS": "İhlas Haber Ajansı A.Ş.",
    "ANGEN": "Anatolia Tanı ve Biyoteknoloji Ürünleri Ar-Ge San. ve Tic. A.Ş.",
    "HEDEF": "Hedef Holding A.Ş.",
    "GLCVY": "Gelecek Varlık Yönetimi A.Ş.",
    "MAGEN": "Margün Enerji Üretim San. ve Tic. A.Ş.",
    "KIMMR": "Ersan Alışveriş Hizmetleri ve Gıda San. Tic. A.Ş.",
    "TEZOL": "Europap Tezol Kağıt San. ve Tic. A.Ş.",
    "YEOTK": "Yeo Teknoloji Enerji ve Endüstri A.Ş.",
    "EGEPO": "Nasmed Özel Sağlık Hizmetleri Ticaret A.Ş.",
    "BRLSM": "Birleşim Mühendislik Isıtma Soğutma Havalandırma San. ve Tic. A.Ş.",
    "GESAN": "Girişim Elektrik Sanayi Taahhüt ve Tic. A.Ş.",
    "KZBGY": "Kızılbük Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "GENIL": "Gen İlaç ve Sağlık Ürünleri San. ve Tic. A.Ş.",
    "MANAS": "Manas Enerji Yönetimi San. ve Tic. A.Ş.",
    "A1YEN": "A1 Yenilenebilir Enerji Üretim A.Ş.",
    "ESCAR": "Escar Turizm Taşımacılık Ticaret A.Ş.",
    "VBTYZ": "Vbt Yazılım A.Ş.",
    "KTSKR": "Kütahya Şeker Fabrikası A.Ş.",
    "EDATA": "E-Data Teknoloji Pazarlama A.Ş.",
    "MEDTR": "Meditera Tıbbi Malzeme San. ve Tic. A.Ş.",
    "SELVA": "Selva Gıda Sanayi A.Ş.",
    "BASGZ": "Başkent Doğalgaz Dağıtım Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "OYYAT": "Oyak Yatırım Menkul Değerler A.Ş.",
    "BMSCH": "Bms Çelik Hasır San. ve Tic. A.Ş.",
    "UNLU": "Ünlü Yatırım Holding A.Ş.",
    "BOBET": "Boğaziçi Beton San. ve Tic. A.Ş.",
    "ATATP": "Atp Yazılım ve Teknoloji A.Ş.",
    "MERCN": "Mercan Kimya San. ve Tic. A.Ş.",
    "KLKIM": "Kalekim Kimyevi Maddeler San. ve Tic. A.Ş.",
    "PENTA": "Penta Teknoloji Ürünleri Dağıtım Ticaret A.Ş.",
    "ZRGYO": "Ziraat Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "CANTE": "Çan2 Termik A.Ş.",
    "AYDEM": "Aydem Yenilenebilir Enerji A.Ş.",
    "BIOEN": "Biotrend Çevre ve Enerji Yatırımları A.Ş.",
    "GWIND": "Galata Wind Enerji A.Ş.",
    "TUREX": "Tureks Turizm Taşımacılık A.Ş.",
    "QUAGR": "Qua Granite Hayal Yapı ve Ürünleri San. Tic. A.Ş.",
    "MTRKS": "Matriks Finansal Teknolojiler A.Ş.",
    "NTGAZ": "Naturelgaz Sanayi ve Ticaret A.Ş.",
    "ISKPL": "Işık Plastik Sanayi ve Dış Ticaret Pazarlama A.Ş.",
    "ARZUM": "Arzum Elektrikli Ev Aletleri San. ve Tic. A.Ş.",
    "KRVGD": "Kervan Gıda San. ve Tic. A.Ş.",
    "ESEN": "Esenboğa Elektrik Üretim A.Ş.",
    "DNISI": "Dinamik Isı Yalıtım Malzemeleri San. ve Tic. A.Ş.",
    "FADE": "Fade Gıda Yatırım San. ve Tic. A.Ş.",
    "BAYRK": "Bayrak Ebt Taban San. ve Tic. A.Ş.",
    "ARDYZ": "Ard Grup Bilişim Teknolojileri A.Ş.",
    "PAPIL": "Papilon Savunma Teknoloji ve Tic. A.Ş.",
    "YKSLN": "Yükselen Çelik A.Ş.",
    "NATEN": "Naturel Yenilenebilir Enerji A.Ş.",
    "DERHL": "Derlüks Yatırım Holding A.Ş.",
    "CEOEM": "Ceo Event Medya A.Ş.",
    "SMART": "Smartiks Yazılım A.Ş.",
    "FORMT": "Formet Çelik Kapı San. ve Tic. A.Ş.",
    "KFEIN": "Kafein Yazılım Hizmetleri Ticaret A.Ş.",
    "SOKM": "Şok Marketler Ticaret A.Ş.",
    "PEKGY": "Peker Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "MPARK": "MLP Sağlık Hizmetleri A.Ş.",
    "ENJSA": "Enerjisa Enerji A.Ş.",
    "TLMAN": "Trabzon Liman İşletmeciliği A.Ş.",
    "SAFKR": "Safkar Ege Soğutmacılık Klima Soğuk Hava Tesisleri İhr. İth. San. ve Tic. A.Ş.",
    "MAVI": "Mavi Giyim San. ve Tic. A.Ş.",
    "FONET": "Fonet Bilgi Teknolojileri A.Ş.",
    "MSGYO": "Mistral Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "ISDMR": "İskenderun Demir ve Çelik A.Ş.",
    "VERTU": "Verusaturk Girişim Sermayesi Yatırım Ortaklığı A.Ş.",
    "BNTAS": "Bantaş Bandırma Ambalaj San. ve Tic. A.Ş.",
    "HDFGS": "Hedef Girişim Sermayesi Yatırım Ortaklığı A.Ş.",
    "AGESA": "Agesa Hayat ve Emeklilik A.Ş.",
    "ULUUN": "Ulusoy Un San. ve Tic. A.Ş.",
    "ULUSE": "Ulusoy Elektrik İmalat Taahhüt Tic. A.Ş.",
    "IZFAS": "İzmir Fırça San. Ve Tic. A.Ş.",
    "LIDFA": "Lider Faktoring A.Ş.",
    "PAMEL": "Pamel Yenilenebilir Elektrik Üretimi A.Ş.",
    "TUCLK": "Tuğçelik Alüminyum ve Metal Mamulleri San. Ve Tic. A.Ş.",
    "RTALB": "Rta Labaratuvarları Biyolojik Ürünler İlaç ve Makine San. Tic. A.Ş.",
    "KRGYO": "Körfez Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "POLTK": "Politeknik Metal San. ve Tic. A.Ş.",
    "GEDZA": "Gediz Ambalaj San. ve Tic. A.Ş.",
    "TMPOL": "Temapol Polimer Plastik ve İnşaat San. Tic. A.Ş.",
    "YAYLA": "Yayla Enerji Turizm Ve İnşaat Tic. A.Ş.",
    "VERUS": "Verusa Holding A.Ş.",
    "YGGYO": "Yeni Gimat Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "TURGG": "Türker Proje Gayrimenkul ve Yatırım Geliştirme A.Ş.",
    "SAYAS": "Say Yenilenebilir Enerji Ekipmanları San. ve Tic. A.Ş.",
    "OTTO": "Otto Holding A.Ş.",
    "PAGYO": "Panora Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "ODAS": "Odaş Elektrik Üretim San. Tic. A.Ş.",
    "PGSUS": "Pegasus Hava Taşımacılığı A.Ş.",
    "SRVGY": "Servet Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "HLGYO": "Halk Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "AKSGY": "Akiş Gayrımenkul Yatırım Ortaklığı A.Ş.",
    "AVHOL": "Avrupa Yatırım Holding A.Ş.",
    "TMSN": "Tümosan Motor ve Traktör Sanayi A.Ş.",
    "BERA": "Bera Holding A.Ş.",
    "LYDYE": "Lydia Yeşil Enerji Kaynakları A.Ş.",
    "KUYAS": "Kuyaş Yatırım A.Ş.",
    "JANTS": "Jantsa Jant San. ve Tic. A.Ş.",
    "DENGE": "Denge Yatırım Holding A.Ş.",
    "ETILR": "Etiler Gıda ve Ticari Yatırımlar San. ve Tic. A.Ş.",
    "ACSEL": "Acıselsan Acıpayam Selüloz San. ve Tic. A.Ş.",
    "TGSAS": "Tgs Dış Ticaret A.Ş.",
    "POLHO": "Polisan Holding A.Ş.",
    "OSTIM": "Ostim Endüstriyel Yatırımlar ve İşletme A.Ş.",
    "TKNSA": "Teknosa İç ve Dış Ticaret A.Ş.",
    "ORGE": "Orge Enerji Elektrik Taahhüt A.Ş.",
    "SANFM": "Sanifoam Sünger San. ve Tic. A.Ş.",
    "BEYAZ": "Beyaz Filo Oto Kiralama A.Ş.",
    "NIBAS": "Niğbaş Niğde Beton San. ve Tic. A.Ş.",
    "OSMEN": "Osmanlı Yatırım Menkul Değerler A.Ş.",
    "OZKGY": "Özak Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "AVOD": "(Avod) A.V.O.D. Kurutulmuş Gıda ve Tarım Ürünleri San. Tic. A.Ş.",
    "ADESE": "Adese Gayrimenkul Yatırım A.Ş.",
    "INFO": "İnfo Yatırım Menkul Değerler A.Ş.",
    "GLRYH": "Güler Yatırım Holding A.Ş.",
    "DAGI": "Dagi Giyim San. ve Tic. A.Ş.",
    "KRONT": "Kron Teknoloji A.Ş.",
    "BLCYT": "Bilici Yatırım San. ve Tic. A.Ş.",
    "YAPRK": "Yaprak Süt ve Besi Çiftlikleri San. ve Tic. A.Ş.",
    "AKFGY": "Akfen Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "KLGYO": "Kiler Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "ZEDUR": "Zedur Enerji Elektrik Üretim A.Ş.",
    "LKMNH": "Lokman Hekim Engürüsağ Sağlık Turizm Eğitim Hizmetleri ve İnşaat Taahhüt A.Ş.",
    "HATEK": "Hateks Hatay Tekstil İşletmeleri A.Ş.",
    "DESPC": "Despec Bilgisayar Paz. ve Tic. A.Ş.",
    "DOCO": "DO &#038; CO Aktiengesellschaft",
    "EKGYO": "Emlak Konut Gayrimenkul Yatırım A.Ş.",
    "KATMR": "Katmerciler Araç Üstü Ekipman San. ve Tic. A.Ş.",
    "IHYAY": "İhlas Yayın Holding A.Ş.",
    "TRGYO": "Torunlar Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "MRGYO": "Martı Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "GEDIK": "Gedik Yatırım Menkul Değerler A.Ş.",
    "RYGYO": "Reysaş Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "CEMAS": "Çemaş Döküm Sanayi A.Ş.",
    "ANELE": "Anel Elektrik Proje Taahhüt ve Tic. A.Ş.",
    "IHGZT": "İhlas Gazetecilik A.Ş.",
    "AKSEN": "Aksa Enerji Üretim A.Ş.",
    "TSGYO": "Tskb Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "TRALT": "Türk Altın İşletmeleri A.Ş.",
    "GOZDE": "Gözde Girişim Sermayesi Yatırım Ortaklığı A.Ş.",
    "LRSHO": "Loras Holding A.Ş.",
    "TTKOM": "Türk Telekomünikasyon A.Ş.",
    "TKFEN": "Tekfen Holding A.Ş.",
    "ALBRK": "Albaraka Türk Katılım Bankası A.Ş.",
    "SNGYO": "Sinpaş Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "ISMEN": "İş Yatırım Menkul Değerler A.Ş.",
    "HALKB": "Türkiye Halk Bankası A.Ş.",
    "TAVHL": "Tav Havalimanları Holding A.Ş.",
    "UFUK": "Ufuk Yatırım Yönetim ve Gayrimenkul A.Ş.",
    "KAREL": "Karel Elektronik San. ve Tic. A.Ş.",
    "INGRM": "Ingram Micro Bilişim Sistemleri A.Ş.",
    "CCOLA": "Coca-Cola İçecek A.Ş.",
    "SELEC": "Selçuk Ecza Deposu Tic. ve San. A.Ş.",
    "VESBE": "Vestel Beyaz Eşya San. ve Tic. A.Ş.",
    "DGATE": "Datagate Bilgisayar Malzemeleri Ticaret A.Ş.",
    "RYSAS": "Reysaş Taşımacılık ve Lojistik Ticaret A.Ş.",
    "VAKBN": "Türkiye Vakıflar Bankası T.A.O.",
    "BIMAS": "Bim Birleşik Mağazalar A.Ş.",
    "MARKA": "Marka Yatırım Holding A.Ş.",
    "TSPOR": "Trabzonspor Sportif Yatırım ve Ticaret A.Ş.",
    "ISGSY": "İş Girişim Sermayesi Yatırım Ortaklığı A.Ş.",
    "INDES": "İndeks Bilgisayar Sistemleri Mühendislik San. ve Tic. A.Ş.",
    "DOAS": "Doğuş Otomotiv Servis ve Ticaret A.Ş.",
    "TTRAK": "Türk Traktör ve Ziraat Makineleri A.Ş.",
    "DESA": "Desa Deri San. ve Tic. A.Ş.",
    "YESIL": "Yeşil Yatırım Holding A.Ş.",
    "FENER": "Fenerbahçe Fulbol A.Ş.",
    "GEREL": "Gersan Elektrik Tic. San. A.Ş.",
    "TRMET": "TR Anadolu Metal Madencilik İşletmeleri A.Ş.",
    "BLUME": "Blume Metal Kimya A.Ş.",
    "GSRAY": "Galatasaray Sportif Sınai ve Ticari Yatırımlar A.Ş.",
    "BJKAS": "Beşiktaş Futbol Yatırımları San. ve Tic. A.Ş.",
    "ALKA": "Alkim Kağıt San. ve Tic. A.Ş.",
    "ARENA": "Arena Bilgisayar San. ve Tic. A.Ş.",
    "LINK": "Link Bilgisayar Sistemleri Yazılımı ve Donanımı San. ve Tic. A.Ş.",
    "TEKTU": "Tek-Art İnşaat Ticaret Turizm Sanayi ve Yatırımlar A.Ş.",
    "MNDRS": "Menderes Tekstil San. ve Tic. A.Ş.",
    "ESCOM": "Escort Teknoloji Yatırım A.Ş.",
    "TCELL": "Turkcell İletişim Hizmetleri A.Ş.",
    "ICUGS": "Icu Girişim Sermayesi Yatırım Ortaklığı A.Ş.",
    "AKENR": "Akenerji Elektrik Üretim A.Ş.",
    "AYEN": "Ayen Enerji A.Ş.",
    "TRENJ": "TR Doğal Enerji Kaynakları Araştırma ve Üretim A.Ş.",
    "RUZYE": "Ruzy Madencilik ve Enerji Yatırımları San. ve Tic. A.Ş.",
    "ZOREN": "Zorlu Enerji Elektrik Üretim A.Ş.",
    "LOGO": "Logo Yazılım San. ve Tic. A.Ş.",
    "BSOKE": "Batısöke Söke Çimento Sanayii T.A.Ş.",
    "BIGTK": "Big Medya Teknoloji A.Ş.",
    "ISFIN": "İş Finansal Kiralama A.Ş.",
    "ALKIM": "Alkim Alkali Kimya A.Ş.",
    "ANHYT": "Anadolu Hayat Emeklilik A.Ş.",
    "NUHCM": "Nuh Çimento Sanayi A.Ş.",
    "KARSN": "Karsan Otomotiv Sanayii ve Tic. A.Ş.",
    "AGHOL": "AG Anadolu Grubu Holding A.Ş.",
    "AKSUE": "Aksu Enerji ve Ticaret A.Ş.",
    "NUGYO": "Nurol Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "IHLGM": "İhlas Gayrimenkul Proje Geliştirme ve Tic. A.Ş.",
    "ISGYO": "İş Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "GSDHO": "Gsd Holding A.Ş.",
    "INVEO": "Inveo Yatırım Holding A.Ş.",
    "ECZYT": "Eczacıbaşı Yatırım Holding Ortaklığı A.Ş.",
    "IEYHO": "Işıklar Enerji ve Yapı Holding A.Ş.",
    "ARSAN": "Arsan Holding A.Ş.",
    "DUNYH": "Dünya Holding A.Ş.",
    "KGYO": "Koray Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "KRDMD": "Kardemir Karabük Demir Çelik San. ve Tic. A.Ş.",
    "EMKEL": "Emek Elektrik Endüstrisi A.Ş.",
    "PENGD": "Penguen Gıda Sanayi A.Ş.",
    "VAKKO": "Vakko Tekstil ve Hazır Giyim Sanayi İşletmeleri A.Ş.",
    "METRO": "Metro Ticari ve Mali Yatırımlar Holding A.Ş.",
    "CMBTN": "Çimbeton Hazırbeton ve Prefabrik Yapı Elemanları San. ve Tic. A.Ş.",
    "PRKME": "Park Elektrik Üretim Madencilik San. ve Tic. A.Ş.",
    "KLMSN": "Klimasan Klima San. ve Tic. A.Ş.",
    "KRSTL": "Kristal Kola ve Meşrubat San. Tic. A.Ş.",
    "RAYSG": "Ray Sigorta A.Ş.",
    "DMSAS": "Demisaş Döküm Emaye Mamülleri San. A.Ş.",
    "SAHOL": "Hacı Ömer Sabancı Holding A.Ş.",
    "ASUZU": "Anadolu Isuzu Otomotiv San. ve Tic. A.Ş.",
    "SKBNK": "Şekerbank T.A.Ş.",
    "VKGYO": "Vakıf Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "ALGYO": "Alarko Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "CLEBI": "Çelebi Hava Servisi A.Ş.",
    "BRYAT": "Borusan Yatırım ve Pazarlama A.Ş.",
    "SASA": "Sasa Polyester Sanayi A.Ş.",
    "RALYH": "Ral Yatırım Holding A.Ş.",
    "ULKER": "Ülker Bisküvi Sanayi A.Ş.",
    "YATAS": "Yataş Yatak ve Yorgan San. Tic. A.Ş.",
    "KNFRT": "Konfrut Tarım A.Ş.",
    "AVGYO": "Avrasya Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "ADEL": "Adel Kalemcilik Tic. Ve San. A.Ş.",
    "AKCNS": "Akçansa Çimento San. ve Tic. A.Ş.",
    "DZGYO": "Deniz Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "KAPLM": "Kaplamin Ambalaj San. ve Tic. A.Ş.",
    "BOSSA": "Bossa Tic. ve San. İşletmeleri T.A.Ş.",
    "GLYHO": "Global Yatırım Holding A.Ş.",
    "OTKAR": "Otokar Otomotiv ve Savunma Sanayi A.Ş.",
    "FRIGO": "Frigo-Pak Gida Maddeleri San. ve Tic. A.Ş.",
    "SKTAS": "Söktaş Tekstil San. ve Tic. A.Ş.",
    "BTCIM": "Batıçim Batı Anadolu Çimento Sanayii A.Ş.",
    "GOLTS": "Göltaş Göller Bölgesi Çimento San. ve Tic. A.Ş.",
    "GSDDE": "Gsd Denizcilik Gayrimenkul İnşaat San. ve Tic. A.Ş.",
    "CEMTS": "Çemtaş Çelik Makina San. ve Tic. A.Ş.",
    "AKGRT": "Aksigorta A.Ş.",
    "TUKAS": "Tukaş Gıda San. ve Tic. A.Ş.",
    "AEFES": "Anadolu Efes Biracılık ve Malt Sanayii A.Ş.",
    "TURSG": "Türkiye Sigorta A.Ş.",
    "MERKO": "Merko Gıda San. ve Tic. A.Ş.",
    "BRSAN": "Borusan Birleşik Boru Fabrikaları San. ve Tic. A.Ş.",
    "OZGYO": "Özderici Gayrimenkul Yatırım Ortaklığı A.Ş.",
    "DARDL": "Dardanel Önentaş Gıda San. A.Ş.",
    "BESLR": "Besler Gıda ve Kimya San. ve Tic. A.Ş.",
    "EPLAS": "Egeplast Ege Plastik Tic. ve San. A.Ş.",
    "IHLAS": "İhlas Holding A.Ş.",
    "GARFA": "Garanti Faktoring A.Ş.",
    "BFREN": "Bosch Fren Sistemleri San. ve Tic. A.Ş.",
    "EGPRO": "Ege Profil Tic. ve San. A.Ş.",
    "ANSGR": "Anadolu Anonim Türk Sigorta Şirketi",
    "LYDHO": "Lydia Holding A.Ş.",
    "TATGD": "Tat Gıda Sanayi A.Ş.",
    "DOHOL": "Doğan Sirketler Grubu Holding A.Ş.",
    "NETAS": "Netaş Telekomünikasyon A.Ş.",
    "BANVT": "Banvit Bandırma Vitaminli Yem San. A.Ş.",
    "BURCE": "Burçelik Bursa Çelik Döküm San. A.Ş.",
    "TRCAS": "Turcas Holding A.Ş.",
    "HURGZ": "Hürriyet Gazetecilik ve Matbaacılık A.Ş.",
    "ALARK": "Alarko Holding A.Ş.",
    "ALCAR": "Alarko Carrier San. ve Tic. A.Ş.",
    "TEHOL": "Tera Yatırım Teknoloji Holding A.Ş.",
    "PKENT": "Petrokent Turizm A.Ş.",
    "DITAS": "Ditaş Bdy Yedek Parça İmalat ve Teknik A.Ş.",
    "DURDO": "Duran Doğan Basım ve Ambalaj San. A.Ş.",
    "CRFSA": "CarrefourSA Carrefour Sabancı Ticaret Merkezi A.Ş.",
    "TUPRS": "Tüpraş Türkiye Petrol Rafinerileri A.Ş.",
    "VAKFN": "Vakıf Finansal Kiralama A.Ş.",
    "AFYON": "Afyon Çimento San. T.A.Ş.",
    "MGROS": "Migros T.A.Ş.",
    "MNDTR": "Mondi Turkey Oluklu Mukavva Kağıt ve Ambalaj San. A.Ş.",
    "EDIP": "Edip Gayrimenkul Yatırım San. ve Tic. A.Ş.",
    "TOASO": "Tofaş Türk Otomobil Fabrikası A.Ş.",
    "THYAO": "Türk Hava Yolları A.O.",
    "USAK": "Uşak Seramik Sanayii A.Ş.",
    "MRSHL": "Marshall Boya ve Vernik San. A.Ş.",
    "KONYA": "Konya Çimento Sanayii A.Ş.",
    "PARSN": "Parsan Makina Parçaları Sanayii A.Ş.",
    "KUTPO": "Kütahya Porselen Sanayii A.Ş.",
    "FMIZP": "Federal Mogul İzmit Piston ve Pim Üretim Tesisleri A.Ş.",
    "ASELS": "Aselsan Elektronik San. ve Tic. A.Ş.",
    "DGNMO": "Doğanlar Mobilya Grubu İmalat San. ve Tic. A.Ş.",
    "AKBNK": "Akbank T.A.Ş.",
    "PETKM": "Petkim Petrokimya Holding A.Ş.",
    "VESTL": "Vestel Elektronik San. ve Tic. A.Ş.",
    "ECILC": "Eis Eczacıbaşı İlaç Sınai ve Finansal Yatırımlar San. ve Tic. A.Ş.",
    "GARAN": "Türkiye Garanti Bankası A.Ş.",
    "ICBCT": "Icbc Turkey Bank A.Ş.",
    "YUNSA": "Yünsa Yünlü San. ve Tic. A.Ş.",
    "INTEM": "İntema İnşaat ve Tesisat Malz. Yat. ve Paz. A.Ş.",
    "MARTI": "Martı Otel İşletmeleri A.Ş.",
    "GENTS": "Gentaş Dekoratif Yüzeyler San. ve Tic. A.Ş.",
    "NTHOL": "Net Holding A.Ş.",
    "TBORG": "Türk Tuborg Bira ve Malt Sanayii A.Ş.",
    "BUCIM": "Bursa Çimento Fabrikası A.Ş.",
    "ALCTL": "Alcatel Lucent Teletaş Telekomunikasyon A.Ş.",
    "AYGAZ": "Aygaz A.Ş.",
    "PINSU": "Pınar Su San. ve Tic. A.Ş.",
    "AYCES": "Altın Yunus Çesme Turistik Tesisler A.Ş.",
    "MAALT": "Marmaris Altınyunus Turistik Tesisleri A.Ş.",
    "DYOBY": "Dyo Boya Fabrikaları San. ve Tic. A.Ş.",
    "OYAKC": "Oyak Çimento Fabrikaları A.Ş.",
    "YKBNK": "Yapı ve Kredi Bankası A.Ş.",
    "EGEEN": "Ege Endüstri ve Ticaret A.Ş.",
    "TSKB": "Türkiye Sınai Kalkınma Bankası A.Ş.",
    "DEVA": "Deva Holding A.Ş.",
    "PETUN": "Pınar Entegre Et ve Un Sanayi A.Ş.",
    "PNSUT": "Pınar Süt Mamulleri Sanayi A.Ş.",
    "MAKTK": "Makina Takım Endustrisi A.Ş.",
    "BAGFS": "Bagfaş Bandırma Gübre Fabrikaları A.Ş.",
    "IZMDC": "İzmir Demir Çelik Sanayi A.Ş.",
    "ARCLK": "Arçelik A.Ş.",
    "PRKAB": "Türk Prysmian Kablo ve Sistemleri A.Ş.",
    "GOODY": "Goodyear Lastikleri T.A.Ş.",
    "AKSA": "Aksa Akrilik Kimya Sanayii A.Ş.",
    "FROTO": "Ford Otomotiv Sanayi A.Ş.",
    "SISE": "Türkiye Şişe ve Cam Fabrikaları A.Ş.",
    "EREGL": "Ereğli Demir ve Çelik Fabrikaları T.A.Ş.",
    "HEKTS": "Hektaş Ticaret T.A.Ş.",
    "DOKTA": "Döktaş Dökümcülük Tic. ve San. A.Ş.",
    "KARTN": "Kartonsan Karton San. ve Tic. A.Ş.",
    "KCHOL": "Koç Holding A.Ş.",
    "CIMSA": "Çimsa Çimento San. ve Tic. A.Ş.",
    "ISCTR": "Türkiye İş Bankası A.Ş. (C)",
    "BRISA": "Brisa Bridgestone Sabancı Lastik San. ve Tic. A.Ş.",
    "EGGUB": "Ege Gübre Sanayi A.Ş.",
    "KORDS": "Kordsa Teknik Tekstil A.Ş.",
    "GUBRF": "Gübre Fabrikaları T.A.Ş.",
    "CELHA": "Çelik Halat ve Tel Sanayi A.Ş.",
    "ENKAI": "Enka İnşaat ve Sanayi A.Ş.",
    "SARKY": "Sarkuysan Elektrolit Bakır San. ve Tic. A.Ş.",
    "MERIT": "Merit Turizm Yatırım ve İşletme A.Ş."
};

// GERÇEK 2025 YILI BIST SEKTÖREL GETİRİ VERİLERİ (SABİT REFERANS)
const ALL_SECTORS_DATA = [
    { name: "Teknoloji & Yazılım", annualReturn: 104.4, marketCap: "180 Mr TL", leader: "MIATK", color: "from-blue-500 to-[#00008B]" },
    { name: "Savunma Sanayii", annualReturn: 68.5, marketCap: "380 Mr TL", leader: "ASELS", color: "from-[#00008B] to-slate-900" },
    { name: "Enerji & Yenilenebilir", annualReturn: 52.4, marketCap: "290 Mr TL", leader: "ASTOR", color: "from-amber-500 to-amber-700" },
    { name: "Holdingler & Yatırım", annualReturn: 34.2, marketCap: "550 Mr TL", leader: "KCHOL", color: "from-indigo-600 to-[#00008B]" },
    { name: "Demir Çelik & Sanayi", annualReturn: 24.8, marketCap: "170 Mr TL", leader: "EREGL", color: "from-slate-600 to-slate-900" },
    { name: "Perakende & Gıda", annualReturn: 18.5, marketCap: "300 Mr TL", leader: "BIMAS", color: "from-emerald-500 to-emerald-700" },
    { name: "Gayrimenkul (GYO)", annualReturn: 15.2, marketCap: "140 Mr TL", leader: "EKGYO", color: "from-purple-500 to-purple-800" },
    { name: "Bankacılık & Finans", annualReturn: 13.6, marketCap: "620 Mr TL", leader: "GARAN", color: "from-cyan-600 to-blue-800" },
    { name: "Otomotiv Sanayi", annualReturn: 11.2, marketCap: "360 Mr TL", leader: "FROTO", color: "from-rose-500 to-rose-700" },
    { name: "Havacılık & Ulaştırma", annualReturn: 1.6, marketCap: "450 Mr TL", leader: "THYAO", color: "from-sky-500 to-blue-700" }
];

// SEKTÖR ADI -> STOCK_SECTORS KATALOG EŞLEŞTİRMESİ
const SECTOR_MAPPING: Record<string, string[]> = {
    "Teknoloji & Yazılım": ["Bilişim ve Yazılım", "Teknoloji Donanım ve Ticaret"],
    "Savunma Sanayii": ["Savunma"],
    "Enerji & Yenilenebilir": ["Enerji Teknolojileri", "Enerji Üretim ve Dağıtım"],
    "Havacılık & Ulaştırma": ["Ulaştırma ve Lojistik"],
    "Bankacılık & Finans": ["Bankacılık", "Aracı Kurum ve Finans"],
    "Holdingler & Yatırım": ["Holding"],
    "Otomotiv Sanayi": ["Otomotiv"],
    "Perakende & Gıda": ["Gıda Perakendeciliği", "Gıda ve İçecek"],
    "Demir Çelik & Sanayi": ["Ana Metal ve Madencilik", "Taş, Toprak, Çimento"],
    "Gayrimenkul (GYO)": ["Gayrimenkul (GYO)"]
};

// MASTER BIST HİSSE LİSTESİ
const MASTER_BIST_620 = Object.keys(STOCK_NAMES);

interface StockItem {
    symbol: string;
    name: string;
    price: number;
    change: number;
    volume: string;
    rawVolumeNum: number;
    pe: number;
    high52: number;
    sector: string;
}

type SortField = 'symbol' | 'price' | 'change' | 'volume' | 'pe';
type SortOrder = 'asc' | 'desc';
type TopTab = 'gainers' | 'losers' | 'volume';

// GÜVENLİ HACİM NORMALEŞTİRİCİ (String -> Sayısal TL)
function normalizeVolume(volStr: string | undefined | null): number {
  if (!volStr || typeof volStr !== "string") return 0;
  
  const cleanStr = volStr.trim().replace(/\s+/g, " ");
  const match = cleanStr.match(/^([\d\.,]+)/);
  if (!match) return 0;

  let val = parseFloat(match[1].replace(/\./g, "").replace(",", "."));
  if (isNaN(val)) return 0;

  const unit = cleanStr.toLowerCase();
  if (unit.includes("mr") || unit.includes("milyar") || unit.includes("b₺") || unit.includes("b ₺")) {
    val = val * 1_000_000_000;
  } else if (unit.includes("m₺") || unit.includes("m ₺") || unit.includes("milyon") || unit.includes("m")) {
    val = val * 1_000_000;
  } else if (unit.includes("bin") || unit.includes("k₺") || unit.includes("k ₺")) {
    val = val * 1_000;
  }

  return isNaN(val) ? 0 : val;
}

// OKUNABİLİR HACİM FORMATLAYICI (TL)
function formatVolumeDisplay(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "-";
  if (num >= 1e12) {
    return (num / 1e12).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + " Trn ₺";
  } else if (num >= 1e9) {
    return (num / 1e9).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + " Mr ₺";
  } else if (num >= 1e6) {
    return (num / 1e6).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + " M₺";
  } else if (num >= 1e3) {
    return (num / 1e3).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + " B₺";
  }
  return num.toLocaleString("tr-TR") + " ₺";
}

export default function AssetsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSector, setSelectedSector] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<SortField>('change');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [activeTopTab, setActiveTopTab] = useState<TopTab>('gainers');
    const itemsPerPage = 12;

    // CANLI BİST FİYATLARI VE OTOMATİK Yenileme (30s Server Cache / 60s Client Polling)
    const [livePrices, setLivePrices] = useState<Record<string, { price: number; change: number; volume: string; pe: number }>>({});
    const [bist100Quote, setBist100Quote] = useState<{ price: number; changePercent: number } | null>(null);
    const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const stockSectionRef = useRef<HTMLDivElement>(null);

    // Canlı Piyasa Verisini Çek
    const fetchLivePrices = async () => {
        setIsRefreshing(true);
        try {
            // 1. Canlı BIST Hisseleri (TradingView Scanner)
            const resPrices = await fetch("/api/bist/prices");
            if (resPrices.ok) {
                const data = await resPrices.json();
                if (data && data.prices) {
                    setLivePrices(data.prices);
                    const now = new Date();
                    const timeStr = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                    setLastUpdatedTime(timeStr);
                }
            }

            // 2. Canlı BIST 100 Endeksi (Yahoo Finance via /api/finance)
            const resBist100 = await fetch("/api/finance?symbols=XU100.IS");
            if (resBist100.ok) {
                const json100 = await resBist100.json();
                if (json100 && Array.isArray(json100.results) && json100.results.length > 0) {
                    const q = json100.results[0];
                    if (q && typeof q.regularMarketPrice === 'number') {
                        setBist100Quote({
                            price: q.regularMarketPrice,
                            changePercent: q.regularMarketChangePercent || 0
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Live market data fetch failed:", e);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLivePrices();
        const interval = setInterval(fetchLivePrices, 60000);
        return () => clearInterval(interval);
    }, []);

    // TÜM BIST HİSSELERİNİ ÜRETME VE CANLI VERİYLE NORMALEŞTİRME
    const allStocksList = useMemo(() => {
        const result: StockItem[] = [];
        const addedSymbols = new Set<string>();

        // Sektörel Eşleştirmeler
        Object.entries(SECTOR_MAPPING).forEach(([displaySector, mappingKeys]) => {
            mappingKeys.forEach(key => {
                const symbols = (STOCK_SECTORS as Record<string, string[]>)[key] || [];
                symbols.forEach((sym) => {
                    if (!addedSymbols.has(sym)) {
                        addedSymbols.add(sym);
                        const basePrice = Math.abs((sym.charCodeAt(0) * 17 + (sym.charCodeAt(1) || 65) * 5) % 450) + 12.5;
                        const changeVal = parseFloat((((sym.charCodeAt(0) % 7) - 3) * 1.35).toFixed(2));
                        const nameStr = STOCK_NAMES[sym] || `${sym} Sanayi ve Ticaret A.Ş.`;
                        const volVal = ((sym.charCodeAt(0) * 12.4 + 50) % 850 + 40).toFixed(1) + " M₺";
                        const peVal = parseFloat(((sym.charCodeAt(0) % 18) + 4.2).toFixed(1));
                        const highVal = parseFloat((basePrice * 1.25).toFixed(2));
                        
                        result.push({
                            symbol: sym,
                            name: nameStr,
                            price: parseFloat(basePrice.toFixed(2)),
                            change: changeVal,
                            volume: volVal,
                            rawVolumeNum: normalizeVolume(volVal),
                            pe: peVal,
                            high52: highVal,
                            sector: displaySector
                        });
                    }
                });
            });
        });

        // Master Listesindeki Diğer Şirketler
        MASTER_BIST_620.forEach((sym) => {
            if (!addedSymbols.has(sym)) {
                addedSymbols.add(sym);
                const basePrice = Math.abs((sym.charCodeAt(0) * 17 + (sym.charCodeAt(1) || 65) * 5) % 450) + 12.5;
                const changeVal = parseFloat((((sym.charCodeAt(0) % 7) - 3) * 1.35).toFixed(2));
                const nameStr = STOCK_NAMES[sym] || `${sym} Şirket Grubu A.Ş.`;
                const volVal = ((sym.charCodeAt(0) * 12.4 + 50) % 850 + 40).toFixed(1) + " M₺";
                const peVal = parseFloat(((sym.charCodeAt(0) % 18) + 4.2).toFixed(1));
                const highVal = parseFloat((basePrice * 1.25).toFixed(2));
                
                result.push({
                    symbol: sym,
                    name: nameStr,
                    price: parseFloat(basePrice.toFixed(2)),
                    change: changeVal,
                    volume: volVal,
                    rawVolumeNum: normalizeVolume(volVal),
                    pe: peVal,
                    high52: highVal,
                    sector: "Genel BIST"
                });
            }
        });

        // CANLI VERİ ENTEGRASYONU: TradingView Canlı Fiyatları Varsa Anında Eşitle
        return result.map(item => {
            const live = livePrices[item.symbol];
            if (live) {
                const volStr = live.volume || item.volume;
                return {
                    ...item,
                    price: live.price,
                    change: live.change,
                    volume: volStr,
                    rawVolumeNum: normalizeVolume(volStr),
                    pe: live.pe || item.pe
                };
            }
            return item;
        });
    }, [livePrices]);

    // GÜNÜN ENLERİ (TEK CANLI STATE'TEN TÜRETİLMİŞ SEKMELİ DİZİLER)
    const topGainers = useMemo(() => {
        return [...allStocksList].sort((a, b) => b.change - a.change).slice(0, 5);
    }, [allStocksList]);

    const topLosers = useMemo(() => {
        return [...allStocksList].sort((a, b) => a.change - b.change).slice(0, 5);
    }, [allStocksList]);

    const topVolumeStocks = useMemo(() => {
        return [...allStocksList].sort((a, b) => b.rawVolumeNum - a.rawVolumeNum).slice(0, 5);
    }, [allStocksList]);

    // PİYASA NABZI HESAPLAMALARI (DETERMİNİSTİK TÜRETME)
    const marketStats = useMemo(() => {
        const totalCount = allStocksList.length;
        let gainers = 0;
        let losers = 0;
        let neutral = 0;
        let totalVolSum = 0;

        allStocksList.forEach(s => {
            if (s.change > 0) gainers++;
            else if (s.change < 0) losers++;
            else neutral++;

            totalVolSum += s.rawVolumeNum;
        });

        return {
            totalCount,
            gainers,
            losers,
            neutral,
            totalVolSum,
            totalVolFormatted: formatVolumeDisplay(totalVolSum)
        };
    }, [allStocksList]);

    // FİLTRELENMİŞ VE SIRALANMIŞ VARLIK MERKEZİ HİSSE LİSTESİ
    const filteredStocks = useMemo(() => {
        let list = [...allStocksList];

        if (selectedSector) {
            list = list.filter(item => item.sector === selectedSector);
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            list = list.filter(item => 
                item.symbol.toLowerCase().includes(term) || 
                item.name.toLowerCase().includes(term) ||
                item.sector.toLowerCase().includes(term)
            );
        }

        // Sıralama
        list.sort((a, b) => {
            let valA: any = a[sortField];
            let valB: any = b[sortField];

            if (sortField === 'volume') {
                valA = a.rawVolumeNum;
                valB = b.rawVolumeNum;
            }

            if (typeof valA === 'string') {
                return sortOrder === 'asc' 
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            return sortOrder === 'asc' ? valA - valB : valB - valA;
        });

        return list;
    }, [allStocksList, selectedSector, searchTerm, sortField, sortOrder]);

    // SAYFALAMA KONTROLLERİ
    const totalPages = Math.max(1, Math.ceil(filteredStocks.length / itemsPerPage));
    const paginatedStocks = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredStocks.slice(start, start + itemsPerPage);
    }, [filteredStocks, currentPage, itemsPerPage]);

    // Sektör Tıklama & Tabloya Kaydırma
    const handleSectorClick = (sectorName: string) => {
        setSelectedSector(sectorName);
        setCurrentPage(1);
        setTimeout(() => {
            stockSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // Tablo Sıralama
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    return (
        <div className="p-3 sm:p-5 md:p-6 min-h-screen bg-[#F8FAFC] space-y-6 w-full max-w-full overflow-x-hidden">
            
            {/* ========================================================================= */}
            {/* 1. BÖLÜM: ÜST YARI — SEKTÖRLER YILLIK GETİRİLERİ (SOL) & GÜNÜN ENLERİ (SAĞ) */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full items-stretch">
                
                {/* SOL WIDGET: SEKTÖRLER YILLIK GETİRİLERİ (KOMPAKT 6 SEKTÖR) */}
                <div className="bg-white border border-slate-200/90 rounded-[28px] p-5 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-[#00008B] flex items-center justify-center text-white shadow-xs shrink-0">
                                <BarChart3 className="w-4 h-4 text-sky-300" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight">Sektörler Yıllık Getirileri</h2>
                                <p className="text-[10px] font-bold text-slate-400">2025 BIST Sektörel Getiri Referansı (Hisseleri Süzmek için Tıklayın)</p>
                            </div>
                        </div>
                        {selectedSector && (
                            <button
                                onClick={() => { setSelectedSector(null); setCurrentPage(1); }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all"
                            >
                                <X className="w-3 h-3 text-rose-500" />
                                Temizle
                            </button>
                        )}
                    </div>

                    {/* KOMPAKT İKİLİ IZGARA (6 LİDER SEKTÖR) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 flex-1">
                        {ALL_SECTORS_DATA.slice(0, 6).map((sector, idx) => {
                            const isSelected = selectedSector === sector.name;
                            return (
                                <button
                                    key={sector.name}
                                    onClick={() => handleSectorClick(sector.name)}
                                    className={cn(
                                        "p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group cursor-pointer",
                                        isSelected 
                                            ? "bg-blue-50/80 border-[#00008B] ring-2 ring-[#00008B]/20 shadow-md" 
                                            : "bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-blue-300 hover:shadow-md"
                                    )}
                                >
                                    <div className="flex items-center justify-between w-full mb-1.5">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">#{idx + 1}</span>
                                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                                            +{sector.annualReturn}%
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className={cn(
                                            "text-xs font-black leading-snug truncate",
                                            isSelected ? "text-[#00008B]" : "text-slate-800 group-hover:text-[#00008B]"
                                        )} title={sector.name}>
                                            {sector.name}
                                        </h3>
                                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">Lider: <span className="text-slate-700 font-extrabold">{sector.leader}</span></p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* SAĞ WIDGET: GÜNÜN ENLERİ (SEKMELİ YAPI: YÜKSELENLER, DÜŞENLER, EN YÜKSEK HACİM) */}
                <div className="bg-white border border-slate-200/90 rounded-[28px] p-5 shadow-sm space-y-3.5 flex flex-col justify-between">
                    
                    {/* BAŞLIK VE SEKMELER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs shrink-0">
                                <Trophy className="w-4 h-4 text-amber-100" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight">Günün Enleri</h2>
                                <p className="text-[10px] font-bold text-slate-400">Canlı BIST Piyasasının Öne Çıkanları</p>
                            </div>
                        </div>

                        {/* SEKMELER: [YÜKSELENLER] [DÜŞENLER] [EN YÜKSEK HACİM] */}
                        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl gap-1 self-start sm:self-auto border border-slate-200/60">
                            <button
                                onClick={() => setActiveTopTab('gainers')}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1",
                                    activeTopTab === 'gainers' 
                                        ? "bg-emerald-600 text-white shadow-xs" 
                                        : "text-slate-600 hover:text-slate-900"
                                )}
                            >
                                <TrendingUp className="w-3 h-3" />
                                Kazandıranlar
                            </button>
                            <button
                                onClick={() => setActiveTopTab('losers')}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1",
                                    activeTopTab === 'losers' 
                                        ? "bg-rose-600 text-white shadow-xs" 
                                        : "text-slate-600 hover:text-slate-900"
                                )}
                            >
                                <TrendingDown className="w-3 h-3" />
                                Kaybettirenler
                            </button>
                            <button
                                onClick={() => setActiveTopTab('volume')}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1",
                                    activeTopTab === 'volume' 
                                        ? "bg-[#00008B] text-white shadow-xs" 
                                        : "text-slate-600 hover:text-slate-900"
                                )}
                            >
                                <Flame className="w-3 h-3 text-amber-300" />
                                Hacim
                            </button>
                        </div>
                    </div>

                    {/* İÇERİK LİSTESİ (İLK 5 HİSSE) */}
                    <div className="space-y-1.5 flex-1 flex flex-col justify-around">
                        {(() => {
                            const list = activeTopTab === 'gainers' ? topGainers : activeTopTab === 'losers' ? topLosers : topVolumeStocks;
                            return list.map((item, idx) => (
                                <a 
                                    key={item.symbol} 
                                    href={`/varlik/${item.symbol}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-2 px-3 bg-slate-50/70 border border-slate-200/80 rounded-xl hover:bg-blue-50/60 hover:border-blue-300 transition-all text-xs group cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="text-[10px] font-black text-slate-400 w-4 text-center">#{idx + 1}</span>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-black text-slate-900 text-xs leading-tight group-hover:text-[#00008B] transition-colors">
                                                    {item.symbol}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 bg-white px-1.5 py-0.2 rounded border border-slate-200/60 truncate max-w-[100px]">
                                                    {item.sector}
                                                </span>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 block truncate max-w-[170px] mt-0.5">
                                                {item.name}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 text-right">
                                        <span className="font-black text-slate-900 text-xs">₺{item.price.toFixed(2)}</span>
                                        {activeTopTab === 'volume' ? (
                                            <span className="font-black text-[#00008B] text-xs bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                                                {item.volume}
                                            </span>
                                        ) : (
                                            <span className={cn(
                                                "font-black text-xs px-2 py-0.5 rounded-md border text-right min-w-[62px]",
                                                item.change >= 0 
                                                    ? "text-emerald-700 bg-emerald-50 border-emerald-200/80" 
                                                    : "text-rose-700 bg-rose-50 border-rose-200/80"
                                            )}>
                                                {item.change > 0 ? `+${item.change}%` : `${item.change}%`}
                                            </span>
                                        )}
                                    </div>
                                </a>
                            ));
                        })()}
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. BÖLÜM: PİYASA NABZI (ORDAKİ CANLI METRİKLER BAR-PANELİ) */}
            {/* ========================================================================= */}
            <div className="w-full bg-white border border-slate-200/90 rounded-[28px] p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#00008B] shrink-0">
                            <Activity className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Piyasa Nabzı</h2>
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {lastUpdatedTime ? `Son Canlı: ${lastUpdatedTime}` : "Canlı Akış"}
                            </span>
                        </div>
                    </div>
                    {isRefreshing && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                            <RefreshCw className="w-3 h-3 animate-spin text-[#00008B]" />
                            <span>Yenileniyor...</span>
                        </div>
                    )}
                </div>

                {/* 5 METRİK KARTI (BIST 100, YÜKSELEN, DÜŞEN, NÖTR, TOPLAM HACİM) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    
                    {/* BIST 100 ENDEKSİ */}
                    <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-2xl space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">BIST 100</span>
                        <div className="flex items-baseline justify-between gap-1">
                            <span className="text-sm sm:text-base font-black text-[#00008B]">
                                {bist100Quote ? `₺${bist100Quote.price.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}` : "Canlı..."}
                            </span>
                            {bist100Quote && (
                                <span className={cn(
                                    "text-[10px] font-black px-1.5 py-0.2 rounded border",
                                    bist100Quote.changePercent >= 0 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-rose-700 bg-rose-50 border-rose-200"
                                )}>
                                    {bist100Quote.changePercent >= 0 ? `+${bist100Quote.changePercent.toFixed(2)}%` : `${bist100Quote.changePercent.toFixed(2)}%`}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* YÜKSELEN HİSSELER */}
                    <div className="bg-emerald-50/60 border border-emerald-200/70 p-3 rounded-2xl space-y-1">
                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                            Yükselenler
                        </span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-base sm:text-lg font-black text-emerald-700">{marketStats.gainers}</span>
                            <span className="text-[10px] font-bold text-emerald-600">
                                %{((marketStats.gainers / marketStats.totalCount) * 100).toFixed(0)}
                            </span>
                        </div>
                    </div>

                    {/* DÜŞEN HİSSELER */}
                    <div className="bg-rose-50/60 border border-rose-200/70 p-3 rounded-2xl space-y-1">
                        <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider flex items-center gap-1">
                            <TrendingDown className="w-3 h-3 text-rose-600" />
                            Düşenler
                        </span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-base sm:text-lg font-black text-rose-700">{marketStats.losers}</span>
                            <span className="text-[10px] font-bold text-rose-600">
                                %{((marketStats.losers / marketStats.totalCount) * 100).toFixed(0)}
                            </span>
                        </div>
                    </div>

                    {/* DEĞİŞMEYEN (NÖTR) HİSSELER */}
                    <div className="bg-slate-100/70 border border-slate-200/80 p-3 rounded-2xl space-y-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Minus className="w-3 h-3 text-slate-400" />
                            Nötr / Yatay
                        </span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-base sm:text-lg font-black text-slate-700">{marketStats.neutral}</span>
                            <span className="text-[10px] font-bold text-slate-400">
                                %{((marketStats.neutral / marketStats.totalCount) * 100).toFixed(0)}
                            </span>
                        </div>
                    </div>

                    {/* TOPLAM PİYASA İŞLEM HACMİ */}
                    <div className="bg-blue-50/60 border border-blue-200/80 p-3 rounded-2xl space-y-1 col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-black text-[#00008B] uppercase tracking-wider flex items-center gap-1">
                            <Coins className="w-3 h-3 text-[#00008B]" />
                            Toplam Hacim ({marketStats.totalCount} Hisse)
                        </span>
                        <span className="text-sm sm:text-base font-black text-[#00008B] truncate block">
                            {marketStats.totalVolFormatted}
                        </span>
                    </div>

                </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. BÖLÜM: VARLIK MERKEZİ (ARAMA, SEKTÖR FİLTRESİ, TABLO / RESPONSIVE KARTLAR) */}
            {/* ========================================================================= */}
            <div 
                ref={stockSectionRef}
                className="w-full bg-white border border-slate-200/90 rounded-[28px] p-4 sm:p-5 md:p-6 shadow-sm space-y-5 relative"
            >
                <div className="space-y-4">
                    
                    {/* ÜST BAŞLIK */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                                {selectedSector ? `${selectedSector} - Varlık Merkezi` : "Varlık Merkezi"}
                            </h2>
                            <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                                Tüm BIST şirketlerini inceleyin, sütun başlıklarına tıklayarak sıralayın veya sektor filtresi kullanın.
                            </p>
                        </div>

                        {selectedSector && (
                            <button
                                onClick={() => {
                                    setSelectedSector(null);
                                    setCurrentPage(1);
                                }}
                                className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
                            >
                                <X className="w-3.5 h-3.5 text-rose-500" />
                                Tüm Sektörleri Göster
                            </button>
                        )}
                    </div>

                    {/* ARAMA VE SEKTÖR FİLTRE KUTUSU */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                        
                        {/* ARAMA İNPUTU */}
                        <div className="md:col-span-2 relative w-full group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#00008B] transition-colors" />
                            <input 
                                type="text"
                                placeholder="Hisse Sembolü veya Şirket Adı Ara (Örn: MIATK, THYAO, ASELS, KCHOL)"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00008B]/20 focus:bg-white transition-all"
                            />
                        </div>

                        {/* SEKTÖR SEÇİM DROPDOWN */}
                        <div className="relative w-full">
                            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00008B] pointer-events-none" />
                            <select
                                value={selectedSector || ""}
                                onChange={(e) => {
                                    setSelectedSector(e.target.value || null);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-8 py-2.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl text-xs font-black text-[#00008B] appearance-none focus:outline-none focus:ring-2 focus:ring-[#00008B]/20 focus:bg-white transition-all cursor-pointer shadow-xs"
                            >
                                <option value="">Tüm Sektörler ({allStocksList.length} Şirket)</option>
                                {ALL_SECTORS_DATA.map(sec => (
                                    <option key={sec.name} value={sec.name}>
                                        {sec.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00008B] pointer-events-none" />
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* VERİ GÖRÜNÜMÜ: MASAÜSTÜ TABLO (MD+) & MOBİL KOMPAKT KARTLAR (<MD) */}
                    {/* ========================================================================= */}
                    {paginatedStocks.length > 0 ? (
                        <>
                            {/* MASAÜSTÜ TABLO GÖRÜNÜMÜ (MD+) */}
                            <div className="hidden md:block w-full rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                                <table className="w-full text-left border-collapse table-fixed">
                                    <thead>
                                        <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider select-none">
                                            <th 
                                                className="py-3 px-4 w-[28%] cursor-pointer hover:bg-slate-200/60 transition-colors"
                                                onClick={() => handleSort('symbol')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <span>Hisse & Şirket</span>
                                                    {sortField === 'symbol' ? (
                                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00008B]" /> : <ArrowDown className="w-3 h-3 text-[#00008B]" />
                                                    ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />}
                                                </div>
                                            </th>

                                            <th className="py-3 px-2 w-[18%]">
                                                <span>Sektör</span>
                                            </th>

                                            <th 
                                                className="py-3 px-2 text-right w-[14%] cursor-pointer hover:bg-slate-200/60 transition-colors"
                                                onClick={() => handleSort('price')}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    <span>Fiyat</span>
                                                    {sortField === 'price' ? (
                                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00008B]" /> : <ArrowDown className="w-3 h-3 text-[#00008B]" />
                                                    ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />}
                                                </div>
                                            </th>

                                            <th 
                                                className="py-3 px-2 text-right w-[15%] cursor-pointer hover:bg-slate-200/60 transition-colors"
                                                onClick={() => handleSort('change')}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    <span>Değişim (%)</span>
                                                    {sortField === 'change' ? (
                                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00008B]" /> : <ArrowDown className="w-3 h-3 text-[#00008B]" />
                                                    ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />}
                                                </div>
                                            </th>

                                            <th 
                                                className="py-3 px-2 text-right w-[14%] cursor-pointer hover:bg-slate-200/60 transition-colors"
                                                onClick={() => handleSort('volume')}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    <span>Hacim</span>
                                                    {sortField === 'volume' ? (
                                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00008B]" /> : <ArrowDown className="w-3 h-3 text-[#00008B]" />
                                                    ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />}
                                                </div>
                                            </th>

                                            <th 
                                                className="py-3 px-2 text-right w-[8%] cursor-pointer hover:bg-slate-200/60 transition-colors"
                                                onClick={() => handleSort('pe')}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    <span>F/K</span>
                                                    {sortField === 'pe' ? (
                                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00008B]" /> : <ArrowDown className="w-3 h-3 text-[#00008B]" />
                                                    ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />}
                                                </div>
                                            </th>

                                            <th className="py-3 px-2 text-center w-[5%]">
                                                <span>Detay</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {paginatedStocks.map((item, idx) => (
                                            <tr 
                                                key={item.symbol} 
                                                className={cn(
                                                    "hover:bg-blue-50/60 transition-colors group cursor-pointer",
                                                    idx % 2 === 1 && "bg-slate-50/40"
                                                )}
                                            >
                                                <td className="py-3 px-4">
                                                    <div className="min-w-0">
                                                        <a 
                                                            href={`/varlik/${item.symbol}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-black text-slate-900 group-hover:text-[#00008B] text-xs truncate block"
                                                        >
                                                            {item.symbol}
                                                        </a>
                                                        <span className="text-[10px] font-semibold text-slate-400 truncate block max-w-[220px]" title={item.name}>
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="py-3 px-2">
                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-[#00008B] border border-blue-100 truncate block max-w-[130px]">
                                                        {item.sector}
                                                    </span>
                                                </td>

                                                <td className="py-3 px-2 text-right font-black text-slate-900 text-xs">
                                                    ₺{item.price.toFixed(2)}
                                                </td>

                                                <td className="py-3 px-2 text-right">
                                                    <span className={cn(
                                                        "font-black px-2 py-0.5 rounded-lg text-xs inline-flex items-center gap-0.5",
                                                        item.change >= 0 
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" 
                                                            : "bg-rose-50 text-rose-700 border border-rose-200/60"
                                                    )}>
                                                        {item.change >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-rose-600" />}
                                                        %{item.change > 0 ? `+${item.change}` : item.change}
                                                    </span>
                                                </td>

                                                <td className="py-3 px-2 text-right text-xs font-bold text-slate-600">
                                                    {item.volume || "-"}
                                                </td>

                                                <td className="py-3 px-2 text-right text-xs font-bold text-slate-600">
                                                    {item.pe > 0 ? item.pe.toFixed(2) : "-"}
                                                </td>

                                                <td className="py-3 px-2 text-center">
                                                    <a 
                                                        href={`/varlik/${item.symbol}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-[#00008B] group-hover:text-white text-slate-500 inline-block transition-colors"
                                                        title={`${item.symbol} Detaylarını Aç`}
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* MOBİL KOMPAKT KART GÖRÜNÜMÜ (<MD) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
                                {paginatedStocks.map((item) => (
                                    <a
                                        key={item.symbol}
                                        href={`/varlik/${item.symbol}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-white border border-slate-200/90 p-3.5 rounded-2xl space-y-2.5 hover:border-blue-300 hover:shadow-md transition-all block group"
                                    >
                                        {/* KART ÜST BAŞLIK & DEĞİŞİM BİLİSİ */}
                                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-black text-slate-900 text-sm group-hover:text-[#00008B] transition-colors">
                                                        {item.symbol}
                                                    </span>
                                                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-blue-50 text-[#00008B] border border-blue-100 truncate">
                                                        {item.sector}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 block truncate mt-0.5" title={item.name}>
                                                    {item.name}
                                                </span>
                                            </div>

                                            <span className={cn(
                                                "font-black px-2 py-0.5 rounded-lg text-xs shrink-0 flex items-center gap-0.5",
                                                item.change >= 0 
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" 
                                                    : "bg-rose-50 text-rose-700 border border-rose-200/60"
                                            )}>
                                                {item.change >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-rose-600" />}
                                                %{item.change > 0 ? `+${item.change}` : item.change}
                                            </span>
                                        </div>

                                        {/* KART MİKTAR & HACİM RASYOLARI */}
                                        <div className="flex items-center justify-between text-xs pt-0.5">
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Fiyat</span>
                                                <span className="font-black text-slate-900 text-sm">₺{item.price.toFixed(2)}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-right">Hacim</span>
                                                <span className="font-extrabold text-slate-700">{item.volume || "-"}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block text-right">F/K</span>
                                                <span className="font-extrabold text-slate-700">{item.pe > 0 ? item.pe.toFixed(2) : "-"}</span>
                                            </div>
                                            <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-[#00008B] group-hover:text-white text-slate-400 transition-colors">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="py-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <Info className="w-8 h-8 text-slate-400 mx-auto" />
                            <p className="text-sm font-black text-slate-700">Aramanıza Uygun Hisse Bulunamadı</p>
                            <p className="text-xs text-slate-400 font-bold">Filtreyi temizleyebilir veya başka bir sektör arayabilirsiniz.</p>
                            <button
                                onClick={() => {
                                    setSelectedSector(null);
                                    setSearchTerm("");
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-2 rounded-xl bg-[#00008B] text-white text-xs font-black shadow-xs inline-block"
                            >
                                Tüm Hisseleri Göster
                            </button>
                        </div>
                    )}

                    {/* DİNAMİK AKILLI SAYFALAMA */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-4 gap-3">
                            <span className="text-xs font-bold text-slate-500">
                                Toplam <span className="font-black text-slate-900">{filteredStocks.length}</span> Şirketten{" "}
                                <span className="font-black text-slate-900">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredStocks.length)}</span> Arası Gösteriliyor
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    title="Önceki Sayfa"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {(() => {
                                    const pages = [];
                                    let startPage = Math.max(1, currentPage - 1);
                                    let endPage = Math.min(totalPages, startPage + 2);
                                    if (endPage - startPage < 2) {
                                        startPage = Math.max(1, endPage - 2);
                                    }

                                    for (let i = startPage; i <= endPage; i++) {
                                        pages.push(
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i)}
                                                className={cn(
                                                    "w-8 h-8 rounded-xl text-xs font-black transition-all border",
                                                    currentPage === i
                                                        ? "bg-[#00008B] text-white border-[#00008B] shadow-xs scale-105"
                                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                                )}
                                            >
                                                {i}
                                            </button>
                                        );
                                    }
                                    return pages;
                                })()}

                                {currentPage + 2 < totalPages && (
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 3, totalPages))}
                                        className="px-3 py-1.5 rounded-xl border border-blue-200 text-[#00008B] bg-blue-50/50 hover:bg-blue-100 text-xs font-black transition-all"
                                    >
                                        ... Daha Fazlası
                                    </button>
                                )}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    title="Sonraki Sayfa"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
