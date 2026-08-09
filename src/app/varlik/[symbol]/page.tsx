import { Metadata } from 'next';
import StockDetailClient from './stock-detail-client';
import halkarzAboutDb from '@/data/halkarz_about_db.json';

// BIST Şirket Adları Kataloğu
const STOCK_NAMES: Record<string, string> = {
  "ASELS": "Aselsan Elektronik San. ve Tic. A.Ş.",
  "THYAO": "Türk Hava Yolları A.O.",
  "EREGL": "Ereğli Demir ve Çelik Fabrikaları T.A.Ş.",
  "TUPRS": "Tüpraş Türkiye Petrol Rafinerileri A.Ş.",
  "KCHOL": "Koç Holding A.Ş.",
  "SAHOL": "Hacı Ömer Sabancı Holding A.Ş.",
  "GARAN": "Türkiye Garanti Bankası A.Ş.",
  "AKBNK": "Akbank T.A.Ş.",
  "ISCTR": "Türkiye İş Bankası A.Ş.",
  "YKBNK": "Yapı ve Kredi Bankası A.Ş.",
  "BIMAS": "BİM Birleşik Mağazalar A.Ş.",
  "MGROS": "Migros Ticaret A.Ş.",
  "SOKM": "Şok Marketler Ticaret A.Ş.",
  "SISE": "Türkiye Şişe ve Cam Fabrikaları A.Ş.",
  "FROTO": "Ford Otomotiv Sanayi A.Ş.",
  "TOASO": "Tofaş Türk Otomobil Fabrikası A.Ş.",
  "TTRAK": "Türk Traktör ve Ziraat Makineleri A.Ş.",
  "TCELL": "Turkcell İletişim Hizmetleri A.Ş.",
  "TTKOM": "Türk Telekomünikasyon A.Ş.",
  "SASA": "Sasa Polyester Sanayi A.Ş.",
  "HEKTS": "Hektaş Ticaret T.A.Ş.",
  "ASTOR": "Astor Enerji A.Ş.",
  "MIATK": "Mia Teknoloji A.Ş.",
  "PGSUS": "Pegasus Hava Taşımacılığı A.Ş.",
  "BIGEN": "Birleşim Grup Enerji Yatırımları A.Ş.",
  "TKFEN": "Tekfen Holding A.Ş."
};

interface PageProps {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSymbol = resolvedParams.symbol || 'ASELS';
  const symbol = rawSymbol.toUpperCase().replace('.IS', '').trim();
  const fullName = STOCK_NAMES[symbol] || `${symbol} Sanayi ve Ticaret A.Ş.`;

  const title = `${symbol} - ${fullName} Hisse Fiyatı, Temettü & AI Analizi | FinAI`;
  const description = `${fullName} (${symbol}) canlı borsa fiyatı, 52 haftalık dip/tepe analizi, geçmiş temettü verileri, son dakika KAP bildirimleri ve yapay zeka analizleri FinAI'de.`;

  return {
    title,
    description,
    keywords: [
      symbol,
      fullName,
      `${symbol} hisse`,
      `${symbol} hisse senedi`,
      `${symbol} temettü`,
      `${symbol} temettü 2026`,
      `${symbol} canlı fiyat`,
      `${symbol} KAP haberleri`,
      `${symbol} bilanço`,
      `${symbol} grafik`,
      'BIST 100',
      'Borsa İstanbul',
      'FinAI'
    ],
    openGraph: {
      title,
      description,
      url: `https://finai.net.tr/varlik/${symbol}`,
      siteName: 'FinAI',
      locale: 'tr_TR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://finai.net.tr/varlik/${symbol}`,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const rawSymbol = resolvedParams.symbol || 'ASELS';
  const symbol = rawSymbol.toUpperCase().replace('.IS', '').trim();
  const fullName = STOCK_NAMES[symbol] || `${symbol} Sanayi ve Ticaret A.Ş.`;
  const about = (halkarzAboutDb as Record<string, string>)[symbol] || `${fullName} Borsa İstanbul'da işlem gören şirket.`;

  // Google JSON-LD Yapılandırılmış Veri (Schema.org)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Corporation",
        "@id": `https://finai.net.tr/varlik/${symbol}#corporation`,
        "name": fullName,
        "tickerSymbol": `BIST:${symbol}`,
        "description": about.slice(0, 300),
        "url": `https://finai.net.tr/varlik/${symbol}`
      },
      {
        "@type": "FinancialProduct",
        "@id": `https://finai.net.tr/varlik/${symbol}#product`,
        "name": `${symbol} Hisse Senedi`,
        "category": "Stock",
        "provider": {
          "@type": "Organization",
          "name": "Borsa İstanbul"
        },
        "description": `${fullName} (${symbol}) canlı borsa fiyatı, trend analizi ve temettü dağıtım bilgileri.`
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Ana Sayfa",
            "item": "https://finai.net.tr"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "BIST Hisseleri",
            "item": "https://finai.net.tr/dashboard/data"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": `${symbol} - ${fullName}`,
            "item": `https://finai.net.tr/varlik/${symbol}`
          }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `${fullName} (${symbol}) hisse fiyatı ve grafiği nasıl takip edilir?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `${symbol} hisse senedinin anlık borsa fiyatına, gün içi ve 52 haftalık en yüksek/en düşük seviyelerine ve yapay zeka destekli trend analizlerine FinAI varlık merkezinden canlı olarak ulaşabilirsiniz.`
            }
          },
          {
            "@type": "Question",
            "name": `${symbol} temettü (kâr payı) veriyor mu?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `${fullName} şirketinin geçmiş temettü dağıtım tarihleri, hisse başına net/brüt temettü miktarları ve temettü verimi oranları FinAI temettü tablosunda güncel olarak yer almaktadır.`
            }
          },
          {
            "@type": "Question",
            "name": `${symbol} için son dakika KAP bildirimleri ve haberler nereden okunur?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `${symbol} şirketine ait en güncel KAP bildirimleri, finansal analizler ve şirket haberleri FinAI canlı haber akışında anlık olarak yayınlanmaktadır.`
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StockDetailClient symbol={symbol} />
    </>
  );
}
