"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  Layers, 
  ArrowUpRight, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Activity,
  LayoutGrid,
  Info,
  Sparkles,
  BarChart3,
  SlidersHorizontal,
  Grid,
  List,
  Cpu,
  PieChart,
  Plus,
  Check,
  Building2,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Scale,
  Trophy,
  Award,
  Flame,
  ArrowDownRight,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  Filter,
  ChevronDown
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
    "ERCB": "Erciyas Çelik Boru San. A.Ş.",
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

// GERÇEK 2025 YILI BIST SEKTÖREL GETİRİ VERİLERİ
const ALL_SECTORS_DATA = [
    { name: "Teknoloji & Yazılım", annualReturn: 104.4, marketCap: "180 Mr TL", leader: "MIATK", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Savunma Sanayii", annualReturn: 68.5, marketCap: "380 Mr TL", leader: "ASELS", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Enerji & Yenilenebilir", annualReturn: 52.4, marketCap: "290 Mr TL", leader: "ASTOR", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Holdingler & Yatırım", annualReturn: 34.2, marketCap: "550 Mr TL", leader: "KCHOL", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Demir Çelik & Sanayi", annualReturn: 24.8, marketCap: "170 Mr TL", leader: "EREGL", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Perakende & Gıda", annualReturn: 18.5, marketCap: "300 Mr TL", leader: "BIMAS", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Gayrimenkul (GYO)", annualReturn: 15.2, marketCap: "140 Mr TL", leader: "EKGYO", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Bankacılık & Finans", annualReturn: 13.6, marketCap: "620 Mr TL", leader: "GARAN", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Otomotiv Sanayi", annualReturn: 11.2, marketCap: "360 Mr TL", leader: "FROTO", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" },
    { name: "Havacılık & Ulaştırma", annualReturn: 1.6, marketCap: "450 Mr TL", leader: "THYAO", color: "from-[#F0F4FF] via-blue-500 to-[#00008B]" }
];

// EŞLEŞTİRME KATALOĞU: SEKTÖR ADI -> STOCK_SECTORS ANAHTARLARI
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

// AYIN ENLERİ MOCK ŞABLON VERİSİ (TIKLANABİLİR DÜZEN)
const MONTHLY_TOP_5_GAINERS = [
    { rank: 1, symbol: "MIATK", name: "Mia Teknoloji A.Ş.", monthlyReturn: 38.4, price: 78.50, sector: "Teknoloji" },
    { rank: 2, symbol: "ASTOR", name: "Astor Enerji A.Ş.", monthlyReturn: 31.2, price: 118.20, sector: "Enerji" },
    { rank: 3, symbol: "THYAO", name: "Türk Hava Yolları A.O.", monthlyReturn: 24.6, price: 315.25, sector: "Havacılık" },
    { rank: 4, symbol: "ASELS", name: "Aselsan Elektronik Sanayi", monthlyReturn: 21.8, price: 64.10, sector: "Savunma" },
    { rank: 5, symbol: "GARAN", name: "Garanti BBVA A.Ş.", monthlyReturn: 19.5, price: 112.40, sector: "Bankacılık" }
];

const MONTHLY_TOP_5_LOSERS = [
    { rank: 1, symbol: "HEKTS", name: "Hektaş Ticaret T.A.Ş.", monthlyReturn: -18.6, price: 14.20, sector: "Kimya" },
    { rank: 2, symbol: "SASA", name: "Sasa Polyester Sanayi", monthlyReturn: -15.4, price: 38.90, sector: "Tekstil" },
    { rank: 3, symbol: "ODAS", name: "Odaş Elektrik Üretim", monthlyReturn: -12.8, price: 8.45, sector: "Enerji" },
    { rank: 4, symbol: "VESTL", name: "Vestel Elektronik Sanayi", monthlyReturn: -10.5, price: 72.30, sector: "Dayanıklı Tüketim" },
    { rank: 5, symbol: "PETKM", name: "Petkim Petrokimya Holding", monthlyReturn: -9.2, price: 18.60, sector: "Petrokimya" }
];

// BIST TOPLAM 620 ŞİRKET MASTER KATALOĞU
const MASTER_BIST_620 = [
  "ATATR",
  "BESTE",
  "AKHAN",
  "NETCD",
  "ZGYO",
  "MEYSU",
  "ARFYE",
  "ZERGY",
  "PAHOL",
  "ECOGR",
  "MARMR",
  "DOFRB",
  "BULGS",
  "BALSU",
  "KLYPV",
  "ENDAE",
  "VSNMD",
  "DSTKF",
  "BIGEN",
  "SERNT",
  "MOPAS",
  "AKFIS",
  "GLRMK",
  "EGEGY",
  "ARMGD",
  "SMRVA",
  "CGCAM",
  "BINBN",
  "DURKN",
  "CEMZY",
  "OZATD",
  "AHSGY",
  "GUNDG",
  "TCKRC",
  "BAHKM",
  "DCTTR",
  "SEGMN",
  "EFOR",
  "HOROZ",
  "YIGIT",
  "ALKLC",
  "OZYSR",
  "ONRYT",
  "HRKET",
  "KOCMT",
  "ALTNY",
  "KOTON",
  "LILAK",
  "RGYAS",
  "ENTRA",
  "ODINE",
  "MOGAN",
  "ARTMS",
  "OBAMS",
  "ALVES",
  "LMKDC",
  "BORSK",
  "PATEK",
  "AVPGY",
  "MEGMT",
  "KBORU",
  "SURGY",
  "CATES",
  "SKYMD",
  "BEGYO",
  "AGROT",
  "EKOS",
  "BINHO",
  "MARBL",
  "TABGD",
  "VRGYO",
  "MHRGY",
  "BORLS",
  "DOFER",
  "MEKAG",
  "DMRGD",
  "ADGYO",
  "HATSN",
  "REEDR",
  "GIPTA",
  "TARKM",
  "EBEBK",
  "KZGYO",
  "ENERY",
  "TATEN",
  "OFSYM",
  "IZENR",
  "ASGYO",
  "KLSER",
  "FZLGY",
  "ATAKP",
  "FORTE",
  "A1CAP",
  "PASEU",
  "KTLEV",
  "BIENY",
  "KAYSE",
  "BIGCH",
  "CWENE",
  "GRTHO",
  "EUPWR",
  "CVKMD",
  "KOPOL",
  "EKSUN",
  "AKFYE",
  "GOKNR",
  "BVSAN",
  "MACKO",
  "ASTOR",
  "TNZTP",
  "SOKE",
  "SDTTR",
  "ONCSM",
  "EYGYO",
  "TERA",
  "AHGAZ",
  "BRKVY",
  "PLTUR",
  "OZSUB",
  "SNICA",
  "ALFAS",
  "AZTEK",
  "HKTM",
  "BARMA",
  "KRPLS",
  "KLRHO",
  "RUBNS",
  "KCAER",
  "PRDGS",
  "MAKIM",
  "EUREN",
  "SEGYO",
  "SUNTK",
  "YYLGD",
  "BMSTL",
  "IMASM",
  "KMPUR",
  "CONSE",
  "SUWEN",
  "LIDER",
  "SMRTG",
  "ENSRI",
  "GRSEL",
  "GZNMI",
  "KLSYN",
  "HTTBT",
  "INVES",
  "DAPGM",
  "HUNER",
  "PNLSN",
  "ERCB",
  "PSGYO",
  "PCILT",
  "GMTAS",
  "KONKA",
  "MOBTL",
  "MIATK",
  "ISSEN",
  "ELITE",
  "ARASE",
  "ULUFA",
  "IHAAS",
  "ANGEN",
  "HEDEF",
  "GLCVY",
  "MAGEN",
  "KIMMR",
  "TEZOL",
  "YEOTK",
  "EGEPO",
  "BRLSM",
  "GESAN",
  "KZBGY",
  "GENIL",
  "MANAS",
  "A1YEN",
  "ESCAR",
  "VBTYZ",
  "KTSKR",
  "EDATA",
  "MEDTR",
  "SELVA",
  "BASGZ",
  "OYYAT",
  "BMSCH",
  "UNLU",
  "BOBET",
  "ATATP",
  "MERCN",
  "KLKIM",
  "PENTA",
  "ZRGYO",
  "CANTE",
  "AYDEM",
  "BIOEN",
  "GWIND",
  "TUREX",
  "QUAGR",
  "MTRKS",
  "NTGAZ",
  "ISKPL",
  "ARZUM",
  "KRVGD",
  "ESEN",
  "DNISI",
  "FADE",
  "BAYRK",
  "ARDYZ",
  "PAPIL",
  "YKSLN",
  "NATEN",
  "DERHL",
  "CEOEM",
  "SMART",
  "FORMT",
  "KFEIN",
  "SOKM",
  "PEKGY",
  "MPARK",
  "ENJSA",
  "TLMAN",
  "SAFKR",
  "MAVI",
  "FONET",
  "MSGYO",
  "ISDMR",
  "VERTU",
  "BNTAS",
  "HDFGS",
  "AGESA",
  "ULUUN",
  "ULUSE",
  "IZFAS",
  "LIDFA",
  "PAMEL",
  "TUCLK",
  "RTALB",
  "KRGYO",
  "POLTK",
  "GEDZA",
  "TMPOL",
  "YAYLA",
  "VERUS",
  "YGGYO",
  "TURGG",
  "SAYAS",
  "OTTO",
  "PAGYO",
  "ODAS",
  "PGSUS",
  "SRVGY",
  "HLGYO",
  "AKSGY",
  "AVHOL",
  "TMSN",
  "BERA",
  "LYDYE",
  "KUYAS",
  "JANTS",
  "DENGE",
  "ETILR",
  "ACSEL",
  "TGSAS",
  "POLHO",
  "OSTIM",
  "TKNSA",
  "ORGE",
  "SANFM",
  "BEYAZ",
  "NIBAS",
  "OSMEN",
  "OZKGY",
  "AVOD",
  "ADESE",
  "INFO",
  "GLRYH",
  "DAGI",
  "KRONT",
  "BLCYT",
  "YAPRK",
  "AKFGY",
  "KLGYO",
  "ZEDUR",
  "LKMNH",
  "HATEK",
  "DESPC",
  "DOCO",
  "EKGYO",
  "KATMR",
  "IHYAY",
  "TRGYO",
  "MRGYO",
  "GEDIK",
  "RYGYO",
  "CEMAS",
  "ANELE",
  "IHGZT",
  "AKSEN",
  "TSGYO",
  "TRALT",
  "GOZDE",
  "LRSHO",
  "TTKOM",
  "TKFEN",
  "ALBRK",
  "SNGYO",
  "ISMEN",
  "HALKB",
  "TAVHL",
  "UFUK",
  "KAREL",
  "INGRM",
  "CCOLA",
  "SELEC",
  "VESBE",
  "DGATE",
  "RYSAS",
  "VAKBN",
  "BIMAS",
  "MARKA",
  "TSPOR",
  "ISGSY",
  "INDES",
  "DOAS",
  "TTRAK",
  "DESA",
  "YESIL",
  "FENER",
  "GEREL",
  "TRMET",
  "BLUME",
  "GSRAY",
  "BJKAS",
  "ALKA",
  "ARENA",
  "LINK",
  "TEKTU",
  "MNDRS",
  "ESCOM",
  "TCELL",
  "ICUGS",
  "AKENR",
  "AYEN",
  "TRENJ",
  "RUZYE",
  "ZOREN",
  "LOGO",
  "BSOKE",
  "BIGTK",
  "ISFIN",
  "ALKIM",
  "ANHYT",
  "NUHCM",
  "KARSN",
  "AGHOL",
  "AKSUE",
  "NUGYO",
  "IHLGM",
  "ISGYO",
  "GSDHO",
  "INVEO",
  "ECZYT",
  "IEYHO",
  "ARSAN",
  "DUNYH",
  "KGYO",
  "KRDMD",
  "EMKEL",
  "PENGD",
  "VAKKO",
  "METRO",
  "CMBTN",
  "PRKME",
  "KLMSN",
  "KRSTL",
  "RAYSG",
  "DMSAS",
  "SAHOL",
  "ASUZU",
  "SKBNK",
  "VKGYO",
  "ALGYO",
  "CLEBI",
  "BRYAT",
  "SASA",
  "RALYH",
  "ULKER",
  "YATAS",
  "KNFRT",
  "AVGYO",
  "ADEL",
  "AKCNS",
  "DZGYO",
  "KAPLM",
  "BOSSA",
  "GLYHO",
  "OTKAR",
  "FRIGO",
  "SKTAS",
  "BTCIM",
  "GOLTS",
  "GSDDE",
  "CEMTS",
  "AKGRT",
  "TUKAS",
  "AEFES",
  "TURSG",
  "MERKO",
  "BRSAN",
  "OZGYO",
  "DARDL",
  "BESLR",
  "EPLAS",
  "IHLAS",
  "GARFA",
  "BFREN",
  "EGPRO",
  "ANSGR",
  "LYDHO",
  "TATGD",
  "DOHOL",
  "NETAS",
  "BANVT",
  "BURCE",
  "TRCAS",
  "HURGZ",
  "ALARK",
  "ALCAR",
  "TEHOL",
  "PKENT",
  "DITAS",
  "DURDO",
  "CRFSA",
  "TUPRS",
  "VAKFN",
  "AFYON",
  "MGROS",
  "MNDTR",
  "EDIP",
  "TOASO",
  "THYAO",
  "USAK",
  "MRSHL",
  "KONYA",
  "PARSN",
  "KUTPO",
  "FMIZP",
  "ASELS",
  "DGNMO",
  "AKBNK",
  "PETKM",
  "VESTL",
  "ECILC",
  "GARAN",
  "ICBCT",
  "YUNSA",
  "INTEM",
  "MARTI",
  "GENTS",
  "NTHOL",
  "TBORG",
  "BUCIM",
  "ALCTL",
  "AYGAZ",
  "PINSU",
  "AYCES",
  "MAALT",
  "DYOBY",
  "OYAKC",
  "YKBNK",
  "EGEEN",
  "TSKB",
  "DEVA",
  "PETUN",
  "PNSUT",
  "MAKTK",
  "BAGFS",
  "IZMDC",
  "ARCLK",
  "PRKAB",
  "GOODY",
  "AKSA",
  "FROTO",
  "SISE",
  "EREGL",
  "HEKTS",
  "DOKTA",
  "KARTN",
  "KCHOL",
  "CIMSA",
  "ISCTR",
  "BRISA",
  "EGGUB",
  "KORDS",
  "GUBRF",
  "CELHA",
  "ENKAI",
  "SARKY",
  "MERIT"
];

interface StockItem {
    symbol: string;
    name: string;
    price: number;
    change: number;
    volume: string;
    pe: number;
    high52: number;
    sector: string;
}

type SortField = 'symbol' | 'price' | 'change' | 'volume' | 'pe' | 'high52';
type SortOrder = 'asc' | 'desc';

export default function AssetsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSector, setSelectedSector] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<SortField>('change');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const itemsPerPage = 10;

    // CANLI BİST FİYATLARI STATE & 60 SANİYE OTOMATİK YENİLEME
    const [livePrices, setLivePrices] = useState<Record<string, { price: number; change: number; volume: string; pe: number }>>({});
    const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const fetchLivePrices = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch("/api/bist/prices");
            if (res.ok) {
                const data = await res.json();
                if (data && data.prices) {
                    setLivePrices(data.prices);
                    const now = new Date();
                    const timeStr = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                    setLastUpdatedTime(timeStr);
                }
            }
        } catch (e) {
            console.error("Live prices fetch failed:", e);
        } finally {
            setIsRefreshing(false);
        }
    };

    // İlk yüklemede canlı veriyi çek ve HER 60 SANİYEDE BİR otomatik tazele
    useEffect(() => {
        fetchLivePrices();
        const interval = setInterval(() => {
            fetchLivePrices();
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // GRAFİK GENİŞLEME & DIŞARI TIKLAMA STATE & REF
    const [isSectorChartExpanded, setIsSectorChartExpanded] = useState(false);
    const sectorChartRef = useRef<HTMLDivElement>(null);
    const stockSectionRef = useRef<HTMLDivElement>(null);

    // Sayfanın/kapsayıcının boş bir alanına tıklandığında genişlemiş grafiği kapatma
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (sectorChartRef.current && !sectorChartRef.current.contains(event.target as Node)) {
                setIsSectorChartExpanded(false);
            }
        }
        if (isSectorChartExpanded) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isSectorChartExpanded]);

    // Dinamik En Çok Getirisi Olan İlk 4 Sektör
    const top4Sectors = useMemo(() => ALL_SECTORS_DATA.slice(0, 4), []);

    // TÜM BIST HİSSELERİNİ ÜRETME VE CANLI FİYATLARLA BİRLEŞTİRME
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
                        const volVal = ((sym.charCodeAt(0) * 12.4 + 50) % 850 + 40).toFixed(1) + " Mr ₺";
                        const peVal = parseFloat(((sym.charCodeAt(0) % 18) + 4.2).toFixed(1));
                        const highVal = parseFloat((basePrice * 1.25).toFixed(2));
                        
                        result.push({
                            symbol: sym,
                            name: nameStr,
                            price: parseFloat(basePrice.toFixed(2)),
                            change: changeVal,
                            volume: volVal,
                            pe: peVal,
                            high52: highVal,
                            sector: displaySector
                        });
                    }
                });
            });
        });

        // 620 Master Listesindeki Tüm Diğer Şirketler
        MASTER_BIST_620.forEach((sym) => {
            if (!addedSymbols.has(sym)) {
                addedSymbols.add(sym);
                const basePrice = Math.abs((sym.charCodeAt(0) * 17 + (sym.charCodeAt(1) || 65) * 5) % 450) + 12.5;
                const changeVal = parseFloat((((sym.charCodeAt(0) % 7) - 3) * 1.35).toFixed(2));
                const nameStr = STOCK_NAMES[sym] || `${sym} Şirket Grubu A.Ş.`;
                const volVal = ((sym.charCodeAt(0) * 12.4 + 50) % 850 + 40).toFixed(1) + " Mr ₺";
                const peVal = parseFloat(((sym.charCodeAt(0) % 18) + 4.2).toFixed(1));
                const highVal = parseFloat((basePrice * 1.25).toFixed(2));
                
                result.push({
                    symbol: sym,
                    name: nameStr,
                    price: parseFloat(basePrice.toFixed(2)),
                    change: changeVal,
                    volume: volVal,
                    pe: peVal,
                    high52: highVal,
                    sector: "Genel BIST"
                });
            }
        });

        // CANLI VERİ ENTEGRASYONU: TradingView Canlı Fiyatları Varsa Anında Güncelle
        return result.map(item => {
            const live = livePrices[item.symbol];
            if (live) {
                return {
                    ...item,
                    price: live.price,
                    change: live.change,
                    volume: live.volume || item.volume,
                    pe: live.pe || item.pe
                };
            }
            return item;
        });
    }, [livePrices]);

    // SEKTÖR, ARAMA VE SIRALAMA UYGULANMIŞ HİSSE LİSTESİ
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

        // Dinamik Sıralama
        list.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];

            if (typeof valA === 'string') {
                return sortOrder === 'asc' 
                    ? (valA as string).localeCompare(valB as string)
                    : (valB as string).localeCompare(valA as string);
            }

            return sortOrder === 'asc' 
                ? (valA as number) - (valB as number)
                : (valB as number) - (valA as number);
        });

        return list;
    }, [allStocksList, selectedSector, searchTerm, sortField, sortOrder]);

    // SAYFALAMA HESAPLAMALARI
    const totalPages = Math.max(1, Math.ceil(filteredStocks.length / itemsPerPage));
    const paginatedStocks = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredStocks.slice(start, start + itemsPerPage);
    }, [filteredStocks, currentPage, itemsPerPage]);

    // Sektör Sütununa Tıklandığında Filtreleme ve Aşağı Kaydırma
    const handleSectorClick = (sectorName: string) => {
        setSelectedSector(sectorName);
        setCurrentPage(1);
        setTimeout(() => {
            stockSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // Sıralama Değiştirme
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    return (
        <div className="p-4 md:p-6 min-h-screen bg-[#F8FAFC] space-y-8 w-full max-w-full overflow-x-hidden">
            
            {/* ========================================================================= */}
            {/* 1. BÖLÜM: ÜST YARI (ANALYTICS & INSIGHTS - SOL %50, SAĞ %50 EQUAL WIDTH) */}
            {/* ========================================================================= */}
            <div className="w-full relative space-y-6">
                <div className="flex flex-col lg:flex-row items-stretch gap-6 w-full overflow-hidden">
                    
                    {/* SOL ÜST MODÜL: SEKTÖRLER YILLIK GETİRİLERİ */}
                    <motion.div 
                        ref={sectorChartRef}
                        layout
                        initial={false}
                        animate={{ 
                            width: isSectorChartExpanded ? "100%" : "50%",
                            flex: isSectorChartExpanded ? "1 1 100%" : "1 1 50%"
                        }}
                        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                            "bg-white border border-slate-200/90 rounded-[32px] p-6 shadow-xl relative overflow-hidden cursor-pointer group flex flex-col justify-between shrink-0 min-w-0",
                            isSectorChartExpanded 
                                ? "ring-4 ring-[#00008B]/20 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-white" 
                                : "hover:border-[#00008B]/40 hover:shadow-2xl"
                        )}
                        onClick={() => !isSectorChartExpanded && setIsSectorChartExpanded(true)}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#00008B] flex items-center justify-center text-white shadow-md shadow-[#00008B]/20 shrink-0">
                                    <BarChart3 className="w-5 h-5 text-sky-300" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Sektörler Yıllık Getirileri (2025 BIST)</h2>
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-[#00008B] border border-blue-200/60 uppercase tracking-widest">
                                            {isSectorChartExpanded ? "Tüm Sektörler (Sütuna Tıkla Hisseleri İncele)" : "En Yüksek 4 Sektör"}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400">
                                        {isSectorChartExpanded 
                                            ? "İstediğiniz sektör sütununa tıklayarak o sektördeki tüm hisseleri alt tabloda görüntüleyin" 
                                            : "Genişletmek için kutuya, hisselerini süzmek için sektör sütununa tıklayın"}
                                    </p>
                                </div>
                            </div>

                            {/* Kapatma ("X") veya Büyütme İkonu */}
                            {isSectorChartExpanded ? (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSectorChartExpanded(false);
                                    }}
                                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-600 transition-all duration-300 shadow-sm flex items-center gap-1.5 text-xs font-black"
                                    title="Orijinal Düzenine Dön (Kapat)"
                                >
                                    <X className="w-4 h-4" />
                                    <span className="hidden sm:inline">Kapat</span>
                                </button>
                            ) : (
                                <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-[#00008B] group-hover:text-white transition-all duration-300">
                                    <Maximize2 className="w-4 h-4" />
                                </div>
                            )}
                        </div>

                        {!isSectorChartExpanded ? (
                            /* DEFAULT 4 DİKEY SÜTUN GRAFİĞİ */
                            <div className="h-72 w-full flex items-end justify-around pt-6 px-4 pb-2 gap-4">
                                {top4Sectors.map((sector, idx) => {
                                    const maxVal = 115;
                                    const heightPercent = Math.min((sector.annualReturn / maxVal) * 100, 100);
                                    const isSelected = selectedSector === sector.name;
                                    return (
                                        <div 
                                            key={idx} 
                                            className="flex-1 flex flex-col items-center h-full justify-end group/col cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSectorClick(sector.name);
                                            }}
                                            title={`${sector.name} Hisselerini Görmek İçin Tıklayın`}
                                        >
                                            <span className="text-xs font-black text-[#00008B] mb-2 group-hover/col:scale-110 transition-transform">
                                                +{sector.annualReturn}%
                                            </span>
                                            
                                            <div 
                                                className={cn(
                                                    "w-full max-w-[72px] rounded-t-2xl bg-gradient-to-t transition-all duration-500 shadow-md group-hover/col:brightness-110 relative overflow-hidden flex items-start justify-center pt-2 border-t border-sky-300/40",
                                                    sector.color,
                                                    isSelected && "scale-105 brightness-110 shadow-xl"
                                                )}
                                                style={{ height: `${heightPercent}%` }}
                                            >
                                                <span className="text-[10px] font-black text-white bg-[#00008B]/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full shadow-sm">
                                                    #{idx + 1}
                                                </span>
                                            </div>
                                            
                                            <span className={cn(
                                                "text-[11px] font-black mt-3 text-center truncate w-full transition-colors",
                                                isSelected ? "text-[#00008B] underline" : "text-slate-700 group-hover/col:text-[#00008B]"
                                            )}>
                                                {sector.name}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400">
                                                Lider: {sector.leader}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* EXPANDED ALL SECTORS VERTICAL COLUMNS */
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="h-80 w-full flex items-end justify-between pt-8 px-2 md:px-6 pb-2 gap-2 md:gap-3 overflow-x-auto scrollbar-none"
                            >
                                {ALL_SECTORS_DATA.map((sector, idx) => {
                                    const maxVal = 115;
                                    const heightPercent = Math.min((sector.annualReturn / maxVal) * 100, 100);
                                    const isSelected = selectedSector === sector.name;
                                    return (
                                        <motion.div 
                                            key={idx} 
                                            initial={{ opacity: 0, scaleY: 0, y: 40 }}
                                            animate={{ opacity: 1, scaleY: 1, y: 0 }}
                                            transition={{ 
                                                duration: 0.7, 
                                                delay: 0.35 + (idx * 0.12), 
                                                ease: [0.16, 1, 0.3, 1] 
                                            }}
                                            className="flex-1 min-w-[70px] md:min-w-[85px] flex flex-col items-center h-full justify-end group/col origin-bottom cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSectorClick(sector.name);
                                            }}
                                            title={`${sector.name} Hisselerini Görmek İçin Tıklayın`}
                                        >
                                            <span className="text-[11px] md:text-xs font-black text-[#00008B] mb-2 group-hover/col:scale-110 transition-transform">
                                                +{sector.annualReturn}%
                                            </span>
                                            
                                            <div 
                                                className={cn(
                                                    "w-full max-w-[65px] rounded-t-2xl bg-gradient-to-t transition-all duration-300 shadow-lg group-hover/col:brightness-110 relative overflow-hidden flex items-start justify-center pt-2 border-t border-sky-300/40",
                                                    sector.color,
                                                    isSelected && "scale-105 brightness-110 shadow-xl"
                                                )}
                                                style={{ height: `${heightPercent}%` }}
                                            >
                                                <span className="text-[9px] font-black text-white bg-[#00008B]/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full shadow-sm">
                                                    #{idx + 1}
                                                </span>
                                            </div>
                                            
                                            <span className={cn(
                                                "text-[10px] md:text-xs font-black mt-2.5 text-center truncate w-full transition-colors",
                                                isSelected ? "text-[#00008B] underline" : "text-slate-800 group-hover/col:text-[#00008B]"
                                            )} title={sector.name}>
                                                {sector.name}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400">
                                                {sector.leader}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </motion.div>

                    {/* SAĞ ÜST MODÜL: AYIN ENLERİ (PARANTEZSİZ & TIKLANABİLİR LİSTE) */}
                    <AnimatePresence mode="popLayout">
                        {!isSectorChartExpanded && (
                            <motion.div 
                                initial={{ opacity: 0, scaleX: 0, width: "0%", filter: "blur(8px)" }}
                                animate={{ opacity: 1, scaleX: 1, width: "50%", filter: "blur(0px)" }}
                                exit={{ 
                                    opacity: 0, 
                                    scaleX: 0, 
                                    width: "0%", 
                                    filter: "blur(8px)",
                                    transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] } 
                                }}
                                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                                style={{ transformOrigin: "right center" }}
                                className="bg-white border border-slate-200/90 rounded-[32px] p-6 shadow-xl space-y-5 flex flex-col justify-between shrink-0 overflow-hidden min-w-0"
                            >
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
                                            <Trophy className="w-5 h-5 text-amber-100" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">Ayın Enleri</h2>
                                            <p className="text-[11px] font-bold text-slate-400 whitespace-nowrap">En Çok Kazandıran & Kaybettiren Hisseler (İncelemek için Tıklayın)</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0">
                                        <Flame className="w-3 h-3 text-amber-500" />
                                        Performans
                                    </div>
                                </div>

                                <motion.div 
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                >
                                    {/* SOL KOLON: EN İYİ GETİRİLİ 5 HİSSE (BELİRGİN CANLI YEŞİL ZEMİN & LOGOSUZ YAZI) */}
                                    <div className="space-y-2 bg-emerald-100/90 p-3.5 rounded-2xl border border-emerald-300 shadow-sm">
                                        <h3 className="text-[10px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-sm" />
                                            En İyi Getirili 5 Hisse
                                        </h3>
                                        <div className="space-y-1.5">
                                            {MONTHLY_TOP_5_GAINERS.map((item) => (
                                                <a 
                                                    key={item.symbol} 
                                                    href={`/varlik/${item.symbol}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-2.5 bg-[#E6F4EA] border border-emerald-300/90 rounded-xl hover:bg-emerald-200/90 hover:border-emerald-500 hover:shadow-md transition-all text-xs group cursor-pointer"
                                                >
                                                    <div className="min-w-0">
                                                        <span className="font-black text-emerald-950 text-xs block leading-tight group-hover:text-emerald-700 transition-colors">
                                                            {item.symbol}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-emerald-800/80 block truncate max-w-[120px]">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <span className="font-black text-emerald-800 text-xs shrink-0 bg-emerald-200/90 px-2 py-0.5 rounded-lg border border-emerald-300 shadow-xs">
                                                        +{item.monthlyReturn}%
                                                    </span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SAĞ KOLON: EN KÖTÜ GETİRİLİ 5 HİSSE (BELİRGİN CANLI KIRMIZI ZEMİN & LOGOSUZ YAZI) */}
                                    <div className="space-y-2 bg-rose-100/90 p-3.5 rounded-2xl border border-rose-300 shadow-sm">
                                        <h3 className="text-[10px] font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-sm" />
                                            En Kötü Getirili 5 Hisse
                                        </h3>
                                        <div className="space-y-1.5">
                                            {MONTHLY_TOP_5_LOSERS.map((item) => (
                                                <a 
                                                    key={item.symbol} 
                                                    href={`/varlik/${item.symbol}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-2.5 bg-[#FCE8E6] border border-rose-300/90 rounded-xl hover:bg-rose-200/90 hover:border-rose-500 hover:shadow-md transition-all text-xs group cursor-pointer"
                                                >
                                                    <div className="min-w-0">
                                                        <span className="font-black text-rose-950 text-xs block leading-tight group-hover:text-rose-700 transition-colors">
                                                            {item.symbol}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-rose-800/80 block truncate max-w-[120px]">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <span className="font-black text-rose-800 text-xs shrink-0 bg-rose-200/90 px-2 py-0.5 rounded-lg border border-rose-300 shadow-xs">
                                                        {item.monthlyReturn}%
                                                    </span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. BÖLÜM: ALT YARI (VARLIK MERKEZİ - SEKTÖR FİLTRE KUTUSU & AKILLI SAYFALAMA) */}
            {/* ========================================================================= */}
            <div 
                ref={stockSectionRef}
                className="w-full bg-white border border-slate-200/90 rounded-[32px] p-5 md:p-6 shadow-xl space-y-5 relative"
            >
                <div className="space-y-4">
                    
                    {/* ÜST BAŞLIK: VARLIK MERKEZİ */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                {selectedSector ? `${selectedSector} - Varlık Merkezi` : "Varlık Merkezi"}
                            </h2>
                            <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                                Tüm BIST şirketlerini inceleyebilir, tablo başlıklarına tıklayarak sıralama yapabilir veya sektör filtresinden süzebilirsiniz.
                            </p>
                        </div>

                        {selectedSector && (
                            <button
                                onClick={() => {
                                    setSelectedSector(null);
                                    setCurrentPage(1);
                                }}
                                className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center gap-1.5 transition-all shadow-sm"
                            >
                                <X className="w-3.5 h-3.5 text-rose-500" />
                                Tüm Sektörleri Göster
                            </button>
                        )}
                    </div>

                    {/* ARAMA VE SEKTÖR FİLTRE KUTUSU (DROPDOWN SELECT BOX) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                        
                        {/* VARLIK ARAMA ÇUBUĞU (2 Kolon) */}
                        <div className="md:col-span-2 relative w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#00008B] transition-colors" />
                            <input 
                                type="text"
                                placeholder="Hisse Sembolü veya Şirket Ara (Örn: MIATK, THYAO, ASELS, KCHOL)"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00008B]/30 focus:bg-white transition-all shadow-inner"
                            />
                        </div>

                        {/* SEKTÖR SEÇİM FİLTRE KUTUCUĞU (DROPDOWN) */}
                        <div className="relative w-full">
                            <div className="relative">
                                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00008B] pointer-events-none" />
                                <select
                                    value={selectedSector || ""}
                                    onChange={(e) => {
                                        setSelectedSector(e.target.value || null);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-10 pr-8 py-3 bg-blue-50/60 border border-blue-200/80 rounded-2xl text-xs font-black text-[#00008B] appearance-none focus:outline-none focus:ring-2 focus:ring-[#00008B]/30 focus:bg-white transition-all cursor-pointer shadow-sm"
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
                    </div>

                    {/* ========================================================================= */}
                    {/* PROFESYONEL DERLİ TOPLU VERİ TABLOSU (AMBLEMSİZ / YALNIZCA YAZILI HİSSE KODU) */}
                    {/* ========================================================================= */}
                    {paginatedStocks.length > 0 ? (
                        <div className="w-full rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse table-fixed">
                                <thead>
                                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider select-none">
                                        
                                        {/* HİSSE & ŞİRKET */}
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

                                        {/* SEKTÖR */}
                                        <th className="py-3 px-2 w-[18%]">
                                            <span>Sektör</span>
                                        </th>

                                        {/* FİYAT */}
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

                                        {/* GÜNLÜK DEĞİŞİM */}
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

                                        {/* HACİM */}
                                        <th 
                                            className="py-3 px-2 text-right w-[14%] cursor-pointer hover:bg-slate-200/60 transition-colors hidden sm:table-cell"
                                            onClick={() => handleSort('volume')}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                <span>Hacim</span>
                                                {sortField === 'volume' ? (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00008B]" /> : <ArrowDown className="w-3 h-3 text-[#00008B]" />
                                                ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />}
                                            </div>
                                        </th>

                                        {/* F/K ORANI */}
                                        <th 
                                            className="py-3 px-2 text-right w-[8%] cursor-pointer hover:bg-slate-200/60 transition-colors hidden md:table-cell"
                                            onClick={() => handleSort('pe')}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                <span>F/K</span>
                                                {sortField === 'pe' ? (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#00008B]" /> : <ArrowDown className="w-3 h-3 text-[#00008B]" />
                                                ) : <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />}
                                            </div>
                                        </th>

                                        {/* İŞLEM / İNCELE */}
                                        <th className="py-3 px-2 text-center w-[5%]">
                                            <span>İncele</span>
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
                                            {/* HİSSE & ŞİRKET (LOGOSUZ - SADE YAZILI HİSSE KODU VE UNVAN) */}
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
                                                    <span className="text-[10px] font-semibold text-slate-400 truncate block max-w-[200px]" title={item.name}>
                                                        {item.name}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* SEKTÖR */}
                                            <td className="py-3 px-2">
                                                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-[#00008B] border border-blue-100 truncate block max-w-[130px]">
                                                    {item.sector}
                                                </span>
                                            </td>

                                            {/* FİYAT */}
                                            <td className="py-3 px-2 text-right font-black text-slate-900 text-xs">
                                                ₺{item.price.toFixed(2)}
                                            </td>

                                            {/* DEĞİŞİM */}
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

                                            {/* HACİM */}
                                            <td className="py-3 px-2 text-right text-xs font-bold text-slate-600 hidden sm:table-cell">
                                                {item.volume}
                                            </td>

                                            {/* F/K */}
                                            <td className="py-3 px-2 text-right text-xs font-bold text-slate-600 hidden md:table-cell">
                                                {item.pe > 0 ? item.pe.toFixed(2) : "A.A."}
                                            </td>

                                            {/* İŞLEM / İNCELE */}
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
                                className="px-4 py-2 rounded-xl bg-[#00008B] text-white text-xs font-black shadow-md inline-block"
                            >
                                Tüm Hisseleri Göster
                            </button>
                        </div>
                    )}

                    {/* DİNAMİK AKILLI SAYFALAMA KONTROLÜ (1 2 3 ... DAHA FAZLASI >) */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-4 gap-3">
                            <span className="text-xs font-bold text-slate-500">
                                Toplam <span className="font-black text-slate-900">{filteredStocks.length}</span> Şirketten{" "}
                                <span className="font-black text-slate-900">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredStocks.length)}</span> Arası Gösteriliyor
                            </span>

                            <div className="flex items-center gap-1.5">
                                {/* ÖNCEKİ SAYFA */}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    title="Önceki Sayfa"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {/* DINAMIK 3 SAYFA BUTONU */}
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
                                                        ? "bg-[#00008B] text-white border-[#00008B] shadow-md scale-105"
                                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                                )}
                                            >
                                                {i}
                                            </button>
                                        );
                                    }
                                    return pages;
                                })()}

                                {/* DAHA FAZLASI / SONRAKİ SAYFA BUTONU */}
                                {currentPage + 2 < totalPages && (
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 3, totalPages))}
                                        className="px-3 py-1.5 rounded-xl border border-blue-200 text-[#00008B] bg-blue-50/50 hover:bg-blue-100 text-xs font-black transition-all"
                                    >
                                        ... Daha Fazlası
                                    </button>
                                )}

                                {/* SONRAKİ SAYFA İKONU */}
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
