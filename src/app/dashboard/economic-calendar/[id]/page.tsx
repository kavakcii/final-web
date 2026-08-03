"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Info, ShieldAlert, Sparkles, BookOpen, BarChart3, HelpCircle, Layers, ShoppingBag, Target, CreditCard, Zap, Landmark, LandmarkIcon, PiggyBank, Compass } from "lucide-react";
import Link from "next/link";
import { ECONOMIC_CALENDAR_CATALOG, CatalogCalendarEvent } from "@/lib/calendar-catalog";

// Overview Description Map (Türkçe Özellik Açıklamaları)
const OVERVIEW_TR_DESCRIPTIONS: Record<string, string> = {
    "Dış Ticaret Dengesi": "Türkiye dış ticaret dengesi 1947 yılından bu yana açık vermektedir. Türkiye'nin başlıca ihracat kalemi kara taşıtları, tekstil, demir-çelik, giyim ve gıda ürünlerinden oluşurken; ithalat kalemleri makine, ulaşım ekipmanları, işlenmiş mallar, mineral yakıtlar, yağlar ve kimyasallardan oluşmaktadır. En büyük ticaret açıkları Çin, Rusya, Almanya, Güney Kore, İsviçre, Hindistan, İran ve Japonya ile verilirken; en büyük ticaret fazlası ise Irak, BAE, Birleşik Krallık, İsrail, Suriye, Kuzey Kıbrıs ve Azerbaycan ile verilmektedir.",
    "Aylık Tüketici Fiyat Endeksi (TÜFE)": "Tüketici Fiyat Endeksi (TÜFE), hanehalklarının satın aldığı mal ve hizmet sepetinin fiyatlarındaki ortalama değişimini ölçer. Türkiye'de TÜFE verisi enflasyon oranının ana göstergesidir ve TCMB faiz kararları, mevduat faizleri ile borsa değerlemeleri üzerinde doğrudan etkiye sahiptir.",
    "Yıllık Enflasyon Oranı (TÜFE)": "Yıllık TÜFE Enflasyonu, son 12 ay içerisindeki tüketici fiyat seviyesinin yıllık bazdaki artış hızını gösterir. Enflasyondaki düşüş (dezenflasyon) süreci piyasalar ve TL varlıkları açısından olumlu algılanır.",
    "Aylık Üretici Fiyat Endeksi (ÜFE)": "Üretici Fiyat Endeksi (ÜFE), ülke ekonomisinde üretilen malların üretici aşamasındaki fiyat değişimlerini ölçer. ÜFE maliyet artışlarını yansıttığı için ilerleyen aylarda TÜFE enflasyonu üzerinde öncü gösterge niteliğindedir.",
    "ISM İmalat PMI Endeksi": "ISM İmalat PMI, ABD sanayi ve imalat sektöründeki satınalma yöneticilerinin sipariş, üretim ve istihdam beklentilerini ölçen en önemli makro veridir. 50 üzerindeki değerler sektörde büyümeyi, 50 altı ise daralmayı ifade eder.",
    "ISM İmalat Fiyat Endeksi": "ISM İmalat Fiyat Endeksi, ABD imalatçılarının hammadde ve üretim girdileri için ödediği fiyat değişimlerini gösterir. Yüksek rakamlar küresel enflasyonist baskıların arttığına işaret eder.",
    "S&P Global İmalat PMI (Nihai)": "S&P Global İmalat PMI, fabrika üretimi, yeni siparişler, stok seviyeleri ve tedarik sürelerini değerlendirerek sanayi sektörünün sağlık durumunu puanlar.",
    "Fed Politika Faizi Kararı": "Fed (ABD Merkez Bankası) Politika Faizi Kararı, küresel finansal sistemin en kritik kararıdır. Doların küresel değerini, ons altını, gelişmekte olan ülke para birimlerini ve küresel hisse senedi piyasalarını doğrudan yönlendirir.",
    "TCMB Politika Faizi Kararı": "TCMB Politika Faizi Kararı, Türkiye Cumhuriyeti Merkez Bankası'nın haftalık repo faiz oranını belirlediği karardır. TL'nin değeri, mevduat ve kredi faizleri ile BIST 100 endeksi üzerinde birinci derecede etkilidir.",
    "Tarım Dışı İstihdam Değişimi (NFP)": "Tarım Dışı İstihdam (NFP), ABD ekonomisinde tarım sektörü dışındaki yeni yaratılan veya kaybedilen iş sayısını ölçer. Doların gücü ve Fed faiz beklentileri üzerinde en yüksek etkiye sahip veridir.",
    "İşsizlik Oranı": "İşsizlik Oranı, işgücü içerisindeki işsiz bireylerin yüzdesini gösterir. İstihdam piyasasının genel sağlık durumu hakkında temel göstergedir."
};

// 3-Mini Card Group Educational Data Map (Veri Nedir ve Ne İşe Yarar?)
interface EducationThreeCards {
    dailyLife: string;
    whatItMeasures: string;
    walletImpact: string;
    quickSummary: string;
}

const THREE_CARD_EDUCATION_MAP: Record<string, EducationThreeCards> = {
    "Aylık Tüketici Fiyat Endeksi (TÜFE)": {
        dailyLife: "Düşünün ki her ay marketten ve pazardan aldığınız 50 temel ürünün sepet fiyatıdır. Geçen ay 1.000 TL olan sepet bu ay 1.030 TL olduysa o ayki enflasyon %3'tür.",
        whatItMeasures: "Cebinizdeki Türk Lirası'nın satın alma gücünün ne kadar hızlı eridiğini veya korunduğunu gösteren ana karnedir.",
        walletImpact: "Maaş zamlarından ev kiralarına, market etiketlerinden mevduat faizlerine kadar tüm harcama bütçenizi yönlendirir.",
        quickSummary: "Bu rakam yükselirse market alışverişiniz ve yaşam maliyetiniz pahalılaşır; düştüğünde fiyat artışları yavaşlar."
    },
    "Yıllık Enflasyon Oranı (TÜFE)": {
        dailyLife: "Geçen yılın aynı ayında 1.000 TL olan ürün sepetinin bugün kaç TL olduğunu gösteren 12 aylık toplam fiyat değişimidir.",
        whatItMeasures: "Ülkedeki fiyatlar genel seviyesinin yıllık bazdaki artış hızını ve paranızın yıllık alım gücü kaybını ölçer.",
        walletImpact: "Yıllık kira artış oranları, asgari ücret ve emekli zamları doğrudan bu verinin sonucuna göre hesaplanır.",
        quickSummary: "Yıllık hayat pahalılığının hızını gösterir; düşüşe geçmesi paranın değer kaybının yavaşladığını kanıtlar."
    },
    "Aylık Üretici Fiyat Endeksi (ÜFE)": {
        dailyLife: "Fabrikaların ve imalatçıların hammadde, elektrik ve işçilik için ödediği maliyet sepetidir. Üretim bandından çıkan malın fabrika çıkış fiyatıdır.",
        whatItMeasures: "Üreticinin sırtındaki maliyet yükünü ölçer. Fabrikadaki maliyet artışı 1-2 ay sonra etiketlere yansıyacağı için TÜFE'nin öncü sinyalidir.",
        walletImpact: "Fabrika maliyetleri artarsa ilerleyen aylarda tükettiğiniz tüm ürünlere zam geleceğinin haberini verir.",
        quickSummary: "Üretici maliyetlerinin yönünü gösterir; yüksek ÜFE gelecekteki tüketici zamlarının habercisidir."
    },
    "ISM İmalat PMI Endeksi": {
        dailyLife: "Fabrika ve şirket yöneticilerine yapılan 'Gelecek ay daha çok hammadde alacak mısınız, işçi çıkaracak mısınız?' anketinin sonuç karnesidir.",
        whatItMeasures: "Sanayide çarkların dönüp dönmediğini ölçer. 50 puan üzerindeki değerler büyümeyi, 50 altı ise daralmayı ifade eder.",
        walletImpact: "Ekonominin canlı kalmasını ve iş imkanlarının artmasını sağlar; düşük kalırsa şirket karlarını ve borsayı baskılar.",
        quickSummary: "Sanayide çarkların dönüp dönmediğini fısıldayan ilk erken uyarı göstergesidir."
    },
    "S&P Global İmalat PMI (Nihai)": {
        dailyLife: "İmalat sektöründeki satınalma yöneticilerinin sipariş, üretim ve stok seviyelerine göre verdikleri puanların ortalamasıdır.",
        whatItMeasures: "Ülke sanayisinin büyüme hızını ve ekonomik aktivite gücünü puanlar.",
        walletImpact: "Fabrikaların üretim gücünü temsil eder; yüksek puanlar borsa şirketlerinin kârlılığını olumlu etkiler.",
        quickSummary: "Sanayinin sağlık durumunu puanlayan küresel büyüme göstergesidir."
    },
    "Fed Politika Faizi Kararı": {
        dailyLife: "Dünyanın en büyük Merkez Bankası'nın küresel para musluğunu kısması (faiz artırma) veya vanayı açmasıdır (faiz indirimi).",
        whatItMeasures: "Piyasadaki borçlanma maliyetini ve Doların küresel değerini belirler.",
        walletImpact: "Dünya borsalarını, kuyumcudaki Altın fiyatlarını ve Dolar/TL kurunun yönünü doğrudan çizer.",
        quickSummary: "Küresel para vanasının ayarıdır; yüksek faiz borçlanmayı zorlaştırır, düşük faiz piyasayı coşturur."
    },
    "TCMB Politika Faizi Kararı": {
        dailyLife: "TCMB'nin bankalara para verirken uyguladığı taban faiz oranını belirleyerek piyasadaki para musluğunu ayarlamasıdır.",
        whatItMeasures: "TL'nin zamansal değerini ve bankaların mevduat/kredi faiz oranlarının tabanını belirler.",
        walletImpact: "Banka kredi kartı faizlerinizi, konut/taşıt kredilerini ve Borsa İstanbul'un çekiciliğini doğrudan yönlendirir.",
        quickSummary: "Türkiye ekonomisinin ana vana ayarıdır; faiz artarsa borçlanmak zorlaşır, mevduat getirisi yükselir."
    },
    "Tarım Dışı İstihdam Değişimi (NFP)": {
        dailyLife: "ABD'deki büyük fabrikaların, dükkanların ve şirketlerin o ay kaç bin yeni elemanı işe aldığının resmi karnesidir.",
        whatItMeasures: "Tarım sektörü dışındaki işgücü piyasasının canlılığını ve iş yaratma kapasitesini ölçer.",
        walletImpact: "Küresel Dolar gücünü belirler; kuyumcudaki Gram Altın ve Dolar/TL fiyatlarını doğrudan sallar.",
        quickSummary: "Dünya ekonomisinin iş yaratma gücüdür; yüksek gelirse Dolar güçlenir, Altın gerileyebilir."
    },
    "Dış Ticaret Dengesi": {
        dailyLife: "Ülkenin yurt dışına sattığı mallar (ihracat) ile dışarıdan satın aldığı mallar (ithalat) arasındaki bütçe farkıdır.",
        whatItMeasures: "Ülkeye giren döviz ile ülkeden çıkan döviz arasındaki net bakiyeyi ölçer. Açık vermek dışarıya borçlanmak demektir.",
        walletImpact: "Döviz ihtiyacını belirlediği için Dolar ve Euro kurunun üzerindeki baskıyı doğrudan etkiler.",
        quickSummary: "Ülkenin dış döviz bilançosudur; ticaret açığı arttıkça dövize olan ihtiyaç yükselir."
    },
    "İşsizlik Oranı": {
        dailyLife: "İş aradığı halde bulamayan kişilerin toplam aktif işgücüne olan oranını gösteren halk karnesidir.",
        whatItMeasures: "İstihdam piyasasının sağlık durumunu ve ekonomik refah seviyesini ölçer.",
        walletImpact: "Halkın alım gücünü ve tüketim harcamalarını belirler; düşük işsizlik güçlü ekonomi demektir.",
        quickSummary: "Halkın iş bulma kolaylığını gösterir; düşük işsizlik ekonominin sağlam olduğunu kanıtlar."
    },
    "Default": {
        dailyLife: "Ülke ekonomisindeki üretim, tüketim ve fiyat hareketlerinin genel seyrini gösteren resmi makro veri göstergesidir.",
        whatItMeasures: "Piyasalardaki ekonomik canlılık düzeyini ve finansal dengeyi ölçer.",
        walletImpact: "Bireysel birikimlerinizin değerini ve piyasalardaki yatırım kararlarını etkiler.",
        quickSummary: "Piyasanın genel gidişatını ve ekonomik sağlık durumunu özetleyen temel göstergedir."
    }
};

// Widget 2: Investor Why Follow Descriptive Data Map
interface InvestorWhyFollow {
    centralBankAction: string;
    bigMoneyMovement: string;
    personalBenefit: string;
}

const INVESTOR_WHY_FOLLOW_MAP: Record<string, InvestorWhyFollow> = {
    "Aylık Tüketici Fiyat Endeksi (TÜFE)": {
        centralBankAction: "Merkez Bankası'nı ekonominin dev su vanasını tutan kurum olarak düşünün. Enflasyon yüksek çıkınca 'Piyasada çok fazla para dolaşıyor, insanların harcamasını durdurmalıyım' der ve vanayı sıkar (faizleri artırır). Vanayı sıkınca kredi almak zorlaşır.",
        bigMoneyMovement: "Milyon dolarlık dev fonlar haber açıklanacağı saniyede ekran başında pusuda bekler. Eğer faizlerin artacağını anlarlarsa 'Riski bırakıp paramı garanti mevduat faizine veya dolara yatırayım' derler. Borsanın o anda düşmesinin tek sebebi bu dev paraların yer değiştirmesidir.",
        personalBenefit: "Bu veriyi takip etmek, havanın fırtınalı mı yoksa güneşli mi olacağını önceden görmek gibidir. Dolarınızın, altınınızın veya hissenizin yarın ne tarafa savrulacağını saniyeler öncesinden tahmin etmenizi sağlar."
    },
    "Yıllık Enflasyon Oranı (TÜFE)": {
        centralBankAction: "Merkez Bankaları yıllık bazdaki enflasyon trendine bakarak uzun vadeli faiz politikasını çizer. Yıllık enflasyon katılaşırsa uzun süre yüksek faiz uygulanır.",
        bigMoneyMovement: "Yabancı ve yerli kurumsal yatırımcılar paranızın yıllık bazda eriyip erimediğine bakar. Yıllık enflasyon faizden yüksekse parayı korumak için Borsa İstanbul hisselerine veya Altına hücum ederler.",
        personalBenefit: "Mevduatınızın yıllık bazda size kâr mı ettirdiğini yoksa paranızı erittiğini (Reel Getiri) bilimsel olarak görmenizi sağlar."
    },
    "Aylık Üretici Fiyat Endeksi (ÜFE)": {
        centralBankAction: "Merkez Bankası imalatçıların hammadde maliyet yükünü inceleyerek 2 ay sonra raflara yansıyacak tüketici enflasyonunu tahmin eder ve faiz kararını önden kurgular.",
        bigMoneyMovement: "Sanayi şirketlerine yatırım yapan dev fonlar, imalat maliyetleri arttığında şirket kârlarının düşeceğini anlarlar ve o hisselerden kâr satışı yaparak ayrılırlar.",
        personalBenefit: "Tüketeceğiniz malların 2 ay sonra pahalılaşıp pahalılaşmayacağını söyler; bütçenizi ve yatırımlarınızı önden korumanıza yardımcı olur."
    },
    "ISM İmalat PMI Endeksi": {
        centralBankAction: "Ekonomide durgunluk (resesyon) tehlikesi belirirse Merkez Bankası faizleri düşürerek piyasaya taze para pompalamak zorunda kalır.",
        bigMoneyMovement: "Küresel dev fonlar fabrikaların çarklarının yavaşladığını gördüğünde sanayi ve imalat hisselerinden çıkıp Altın ve Tahvil gibi limanlara sığınır.",
        personalBenefit: "Şirket kârlılıklarının ve ekonominin genel yönünü fısıldar; ekonomik kriz risklerini önceden hissetmenizi sağlar."
    },
    "S&P Global İmalat PMI (Nihai)": {
        centralBankAction: "Ülke sanayisinin büyüme gücünü ölçen Merkez Bankaları faiz oranlarını ekonomi boğulmayacak şekilde hassasçe ayarlar.",
        bigMoneyMovement: "Uluslararası fonlar imalat puanı yüksek ülkelere doğrudan sıcak para aktarır; borsa endekslerinde güçlü yükseliş dalgası başlar.",
        personalBenefit: "İhracat yapan yerli şirketlerin kârlılıklarını öngörüp doğru borsada doğru hisseye yatırım yapmanızı sağlar."
    },
    "Fed Politika Faizi Kararı": {
        centralBankAction: "ABD Merkez Bankası (Fed) faiz artırdığında dünyadaki tüm Dolar para birimleri ABD'ye geri çağrılır. Faiz indirdiğinde ise para dünyaya dağılır.",
        bigMoneyMovement: "Dünya üzerindeki trilyon dolarlık fonlar Fed kararı anında pozisyon değiştirir. Yüksek Amerikan faizi Türkiye gibi gelişmekte olan ülkelerden para çıkışına neden olur.",
        personalBenefit: "Kuyumcudaki Altın fiyatlarının, Amerikan borsalarının ve Türkiye'deki Dolar kurunun yönünü doğrudan bilmenizi sağlar."
    },
    "TCMB Politika Faizi Kararı": {
        centralBankAction: "TCMB politika faizini artırdığında TL'nin faiz getirisini güçlendirir, düşürdüğünde piyasaya harcama yapması için para sunar.",
        bigMoneyMovement: "Yerli ve yabancı yatırımcılar TCMB faizinin Borsa İstanbul kârlılığına olan etkisini hesaplayarak Banka ve Sanayi hisselerinde büyük alım/satım yaparlar.",
        personalBenefit: "Kredi çekip çekmeyeceğinize veya birikiminizi mevduat mı borsa mı yapacağınıza karar vermenizi sağlar."
    },
    "Tarım Dışı İstihdam Değişimi (NFP)": {
        centralBankAction: "Fed halkın istihdam durumuna bakarak 'Ekonomi çok ısındı faiz artırmalıyım' veya 'İşsizlik artıyor faiz indirmeliyim' kararı verir.",
        bigMoneyMovement: "Döviz ve Emtia (Altın/Gümüş) tüccarları NFP verisi ile Doların küresel gücünü hesaplar; Ons Altında saniyelik 30-40 dolarlık sıçramalar yaşanır.",
        personalBenefit: "Gram Altın ve Dolar kurunun veri açıklandığı an hangi yöne fırlayacağını görmenizi sağlar."
    },
    "Dış Ticaret Dengesi": {
        centralBankAction: "Merkez Bankası ülkedeki döviz rezervlerinin durumunu analiz ederek döviz kurlarındaki fırlama risklerini değerlendirir.",
        bigMoneyMovement: "Dış ticaret açığı büyüdüğünde yabancı yatırımcılar 'Bu ülkeye daha fazla döviz lazım olacak' diyerek Dolar/TL'de yukarı yönlü pozisyon alırlar.",
        personalBenefit: "Dolar ve Euro kurlarının üzerinde yukarı yönlü baskı oluşup oluşmayacağını önceden öngörmenizi sağlar."
    },
    "İşsizlik Oranı": {
        centralBankAction: "Halkın iş bulma imkanlarını izleyerek büyümenin ne kadar dengeli olduğunu kontrol eder.",
        bigMoneyMovement: "İşsizlik arttığında halkın harcama yapamayacağını bilen fonlar Perakende ve Tüketici hisselerinden kâr satışı yapar.",
        personalBenefit: "Ülke ekonomisinin genel refah seviyesini ve iş bulma piyasasının sağlığını gösterir."
    },
    "Default": {
        centralBankAction: "Merkez bankaları ekonomideki dengeleri korumak ve fiyat istikrarını sağlamak için veriyi faiz politikalarına yansıtır.",
        bigMoneyMovement: "Piyasadaki büyük oyuncular ve fonlar risk-ödül dengesini hesaplayarak portföylerini güvenli ve yüksek getirili varlıklara dağıtır.",
        personalBenefit: "Piyasalarda havanın ne yöne eseceğini anlayıp birikimlerinizi doğru zamanda doğru varlıkta tutmanızı sağlar."
    }
};

// Distinct Historical Release Datasets for Every Specific Macro Indicator
const EVENT_HISTORICAL_SERIES: Record<string, Array<{ month: string; actual: number; forecast: number; formattedActual: string }>> = {
    "Dış Ticaret Dengesi": [
        { month: "Ara 2025", actual: -7.8, forecast: -8.0, formattedActual: "-7,8 B $" },
        { month: "Oca 2026", actual: -9.3, forecast: -9.0, formattedActual: "-9,3 B $" },
        { month: "Şub 2026", actual: -8.5, forecast: -8.7, formattedActual: "-8,5 B $" },
        { month: "Mar 2026", actual: -8.9, forecast: -8.4, formattedActual: "-8,9 B $" },
        { month: "Nis 2026", actual: -11.1, forecast: -10.5, formattedActual: "-11,1 B $" },
        { month: "May 2026", actual: -8.5, forecast: -8.2, formattedActual: "-8,5 B $" },
        { month: "Haz 2026", actual: -5.9, forecast: -6.1, formattedActual: "-5,9 B $" },
        { month: "Tem 2026", actual: -10.37, forecast: -9.8, formattedActual: "-10,37 B $" },
        { month: "Ağu 2026", actual: -6.9, forecast: -7.2, formattedActual: "-6,9 B $" }
    ],
    "Aylık Tüketici Fiyat Endeksi (TÜFE)": [
        { month: "Ara 2025", actual: 2.93, forecast: 3.10, formattedActual: "%2,93" },
        { month: "Oca 2026", actual: 6.70, forecast: 6.50, formattedActual: "%6,70" },
        { month: "Şub 2026", actual: 4.53, forecast: 4.20, formattedActual: "%4,53" },
        { month: "Mar 2026", actual: 3.16, forecast: 3.25, formattedActual: "%3,16" },
        { month: "Nis 2026", actual: 3.18, forecast: 3.00, formattedActual: "%3,18" },
        { month: "May 2026", actual: 3.37, forecast: 3.10, formattedActual: "%3,37" },
        { month: "Haz 2026", actual: 1.64, forecast: 2.10, formattedActual: "%1,64" },
        { month: "Tem 2026", actual: 0.99, forecast: 1.10, formattedActual: "%0,99" },
        { month: "Ağu 2026", actual: 1.78, forecast: 1.83, formattedActual: "%1,78" }
    ],
    "Yıllık Enflasyon Oranı (TÜFE)": [
        { month: "Ara 2025", actual: 64.77, forecast: 65.10, formattedActual: "%64,77" },
        { month: "Oca 2026", actual: 64.86, forecast: 64.50, formattedActual: "%64,86" },
        { month: "Şub 2026", actual: 67.07, forecast: 66.80, formattedActual: "%67,07" },
        { month: "Mar 2026", actual: 68.50, forecast: 68.10, formattedActual: "%68,50" },
        { month: "Nis 2026", actual: 69.80, forecast: 70.20, formattedActual: "%69,80" },
        { month: "May 2026", actual: 75.45, forecast: 74.80, formattedActual: "%75,45" },
        { month: "Haz 2026", actual: 71.60, forecast: 72.00, formattedActual: "%71,60" },
        { month: "Tem 2026", actual: 61.78, forecast: 62.10, formattedActual: "%61,78" },
        { month: "Ağu 2026", actual: 31.75, forecast: 31.80, formattedActual: "%31,75" }
    ],
    "ISM İmalat PMI Endeksi": [
        { month: "Ara 2025", actual: 47.1, forecast: 47.2, formattedActual: "47,1" },
        { month: "Oca 2026", actual: 49.1, forecast: 47.0, formattedActual: "49,1" },
        { month: "Şub 2026", actual: 47.8, forecast: 49.5, formattedActual: "47,8" },
        { month: "Mar 2026", actual: 50.3, forecast: 48.4, formattedActual: "50,3" },
        { month: "Nis 2026", actual: 49.2, forecast: 50.0, formattedActual: "49,2" },
        { month: "May 2026", actual: 48.7, forecast: 49.6, formattedActual: "48,7" },
        { month: "Haz 2026", actual: 48.5, forecast: 49.1, formattedActual: "48,5" },
        { month: "Tem 2026", actual: 46.8, forecast: 48.8, formattedActual: "46,8" },
        { month: "Ağu 2026", actual: 49.8, forecast: 49.5, formattedActual: "49,8" }
    ],
    "Tarım Dışı İstihdam Değişimi (NFP)": [
        { month: "Ara 2025", actual: 216, forecast: 170, formattedActual: "216K" },
        { month: "Oca 2026", actual: 353, forecast: 180, formattedActual: "353K" },
        { month: "Şub 2026", actual: 275, forecast: 200, formattedActual: "275K" },
        { month: "Mar 2026", actual: 303, forecast: 214, formattedActual: "303K" },
        { month: "Nis 2026", actual: 175, forecast: 243, formattedActual: "175K" },
        { month: "May 2026", actual: 272, forecast: 185, formattedActual: "272K" },
        { month: "Haz 2026", actual: 206, forecast: 190, formattedActual: "206K" },
        { month: "Tem 2026", actual: 114, forecast: 175, formattedActual: "114K" },
        { month: "Ağu 2026", actual: 175, forecast: 175, formattedActual: "175K" }
    ],
    "TCMB Politika Faizi Kararı": [
        { month: "Ara 2025", actual: 42.50, forecast: 42.50, formattedActual: "%42,50" },
        { month: "Oca 2026", actual: 45.00, forecast: 45.00, formattedActual: "%45,00" },
        { month: "Şub 2026", actual: 45.00, forecast: 45.00, formattedActual: "%45,00" },
        { month: "Mar 2026", actual: 50.00, forecast: 45.00, formattedActual: "%50,00" },
        { month: "Nis 2026", actual: 50.00, forecast: 50.00, formattedActual: "%50,00" },
        { month: "May 2026", actual: 50.00, forecast: 50.00, formattedActual: "%50,00" },
        { month: "Haz 2026", actual: 50.00, forecast: 50.00, formattedActual: "%50,00" },
        { month: "Tem 2026", actual: 50.00, forecast: 50.00, formattedActual: "%50,00" },
        { month: "Ağu 2026", actual: 50.00, forecast: 50.00, formattedActual: "%50,00" }
    ],
    "Default": [
        { month: "Ara 2025", actual: 1.2, forecast: 1.1, formattedActual: "%1,2" },
        { month: "Oca 2026", actual: 1.5, forecast: 1.3, formattedActual: "%1,5" },
        { month: "Şub 2026", actual: 0.9, forecast: 1.0, formattedActual: "%0,9" },
        { month: "Mar 2026", actual: 1.1, forecast: 1.2, formattedActual: "%1,1" },
        { month: "Nis 2026", actual: 1.8, forecast: 1.6, formattedActual: "%1,8" },
        { month: "May 2026", actual: 1.4, forecast: 1.5, formattedActual: "%1,4" },
        { month: "Haz 2026", actual: 0.99, forecast: 1.1, formattedActual: "%0,99" },
        { month: "Tem 2026", actual: 1.78, forecast: 1.83, formattedActual: "%1,78" },
        { month: "Ağu 2026", actual: 1.65, forecast: 1.70, formattedActual: "%1,65" }
    ]
};

export default function EconomicEventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params?.id as string;

    const [event, setEvent] = useState<CatalogCalendarEvent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!eventId) return;

        const decodedId = decodeURIComponent(eventId);
        const found = ECONOMIC_CALENDAR_CATALOG.find(e => e.id === decodedId || e.event === decodedId);

        if (found) {
            setEvent(found);
            setLoading(false);
        } else {
            fetch('/api/calendar')
                .then(res => res.json())
                .then(json => {
                    if (json.data && Array.isArray(json.data)) {
                        const apiFound = json.data.find((e: any) => e.id === decodedId || e.event === decodedId);
                        if (apiFound) setEvent(apiFound);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [eventId]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center text-[#00008B]">
                <div className="w-10 h-10 rounded-full border-4 border-[#00008B] border-t-transparent animate-spin mb-3" />
                <span className="text-xs font-black uppercase tracking-wider">Haber Detayları Yükleniyor...</span>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center p-6 text-[#00008B]">
                <h2 className="text-xl font-black mb-2">Haber Bulunamadı</h2>
                <p className="text-xs text-slate-500 mb-6">İstenen ekonomik veri detayına ulaşılamadı.</p>
                <Link href="/dashboard/economic-calendar" className="px-5 py-2.5 rounded-xl bg-[#00008B] text-white font-bold text-xs">
                    Takvime Dön
                </Link>
            </div>
        );
    }

    const isHighImpact = event.impact === 'high' || event.impact === 'critical';

    // Get overview Turkish description
    const overviewText = OVERVIEW_TR_DESCRIPTIONS[event.event] || 
        OVERVIEW_TR_DESCRIPTIONS[Object.keys(OVERVIEW_TR_DESCRIPTIONS).find(k => event.event.includes(k)) || ""] ||
        `${event.country} makroekonomik verileri arasında yer alan ${event.event}, piyasa yapıcılar ve yatırımcılar tarafından yakından takip edilen temel göstergelerden biridir.`;

    // 3-Mini Card Group Educational Object
    const eduCards = THREE_CARD_EDUCATION_MAP[event.event] ||
        THREE_CARD_EDUCATION_MAP[Object.keys(THREE_CARD_EDUCATION_MAP).find(k => event.event.includes(k)) || ""] ||
        THREE_CARD_EDUCATION_MAP["Default"];

    // Widget 2: Investor Why Follow Object
    const whyFollow = INVESTOR_WHY_FOLLOW_MAP[event.event] ||
        INVESTOR_WHY_FOLLOW_MAP[Object.keys(INVESTOR_WHY_FOLLOW_MAP).find(k => event.event.includes(k)) || ""] ||
        INVESTOR_WHY_FOLLOW_MAP["Default"];

    // Historical chart series specific to this exact event
    const chartSeries = EVENT_HISTORICAL_SERIES[event.event] || 
        EVENT_HISTORICAL_SERIES[Object.keys(EVENT_HISTORICAL_SERIES).find(k => event.event.includes(k)) || ""] ||
        EVENT_HISTORICAL_SERIES["Default"];

    // Find min and max for chart bar height scaling
    const absValues = chartSeries.map(s => Math.abs(s.actual));
    const maxVal = Math.max(...absValues, 1);

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-50 text-[#00008B] w-full mx-auto relative overflow-hidden">
            <div className="w-full max-w-[1400px] mx-auto px-6 py-8 md:px-10 lg:py-10 space-y-8 relative z-10 mb-20">
                {/* Navigation Top Bar */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/dashboard/economic-calendar"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-[#00008B] font-bold text-xs shadow-sm hover:bg-slate-100 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Ekonomik Takvime Dön
                    </Link>

                    <div className="flex items-center gap-2 text-xs font-black text-[#00008B] bg-blue-50 px-4 py-2 rounded-2xl border border-blue-200">
                        <Sparkles className="w-4 h-4 text-amber-500" /> FinAL Eğitim & Etki Analiz Rehberi
                    </div>
                </div>

                {/* Event Main Header Banner (TAMAMEN LACİVERT KUTU ZEMİNİ + BEYAZ YAZILAR) */}
                <div className="w-full bg-[#00008B] text-white border border-[#00008B] rounded-3xl p-8 shadow-xl shadow-[#00008B]/20 relative overflow-hidden space-y-6">
                    <div className="relative z-10 space-y-6">
                        {/* LACİVERT ZEMİN ÜZERİNE BEYAZ Üst Başlık Alanı */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{event.flag}</span>
                                <div>
                                    <span className="text-xs font-black text-blue-200 uppercase tracking-widest block">
                                        {event.country} • MAKROEKONOMİK GÖSTERGE ANALİZİ
                                    </span>
                                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-0.5">
                                        {event.event}
                                    </h1>
                                </div>
                            </div>

                            {/* Impact Badge */}
                            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
                                <ShieldAlert className={`w-4 h-4 ${isHighImpact ? 'text-amber-300' : 'text-blue-300'}`} />
                                <span className="text-xs font-extrabold text-white">
                                    {isHighImpact ? 'Yüksek Piyasa Etkisi' : 'Orta Piyasa Etkisi'}
                                </span>
                            </div>
                        </div>

                        {/* ÖZET BİLGİ KUTUSU (Şeffaf Mavi Kontraslı) */}
                        <div className="p-5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md leading-relaxed space-y-2">
                            <p className="text-amber-300 font-bold text-sm flex items-center gap-2">
                                <Info className="w-4 h-4 text-amber-300" /> Veri Hakkında Özet Bilgi:
                            </p>
                            <p className="text-white text-xs font-medium leading-relaxed">
                                {overviewText}
                            </p>
                        </div>

                        {/* METRİK WIDGET'LARI (Açıklanma Zamanı, Açıklanan, Beklenen, Önceki - Koyu Mavi Kartlar) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                            <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md">
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Açıklanma Zamanı</span>
                                <span className="text-sm font-black text-white block mt-1">
                                    {event.dateFormatted || 'Bugün'} - {event.time} (TSİ)
                                </span>
                            </div>

                            <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md">
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Açıklanan Veri</span>
                                <span className="text-sm font-black text-white block mt-1">
                                    {event.actual || 'Bekleniyor'}
                                </span>
                            </div>

                            <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md">
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Piyasa Beklentisi</span>
                                <span className="text-sm font-black text-blue-100 block mt-1">
                                    {event.forecast || '-'}
                                </span>
                            </div>

                            <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md">
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Önceki Veri</span>
                                <span className="text-sm font-black text-blue-100 block mt-1">
                                    {event.previous || '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* GEÇMİŞ VERİ GRAFİĞİ BÖLÜMÜ (BEYAZ Ana Kutu + Fotoğraftaki Sektör Getirileri Özgün Mum Renk Gradient'ı) */}
                <div className="bg-white border border-slate-200 text-[#00008B] rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-150">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-[#00008B]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-[#00008B] tracking-tight">
                                    {event.event} — Geçmiş Veri Grafiği
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aylık Dönemler İtibarıyla Habere Özel Gerçekleşen Veri Trendi</p>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 rounded-sm bg-gradient-to-b from-[#00008B] to-blue-400" />
                                <span>Gerçekleşen Veri</span>
                            </div>
                        </div>
                    </div>

                    {/* Bar Chart Visualizer (Fotoğraftaki Üstü Koyu Lacivert, Altı Açık Mavi-Beyaz Geçişli Sütunlar) */}
                    <div className="py-8 px-2">
                        <div className="flex items-end justify-between gap-3 md:gap-5 h-72 border-b border-slate-200 pb-4">
                            {chartSeries.map((s, idx) => {
                                const heightPercent = Math.min(Math.max((Math.abs(s.actual) / maxVal) * 100, 18), 100);
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                        {/* Value Label on Top of Bar */}
                                        <span className="text-xs font-black text-[#00008B] mb-2 tracking-tight block group-hover:scale-110 transition-transform">
                                            {s.formattedActual}
                                        </span>

                                        {/* Fotoğraftaki Sektör Getirileri Mum Tasarımı (Üst Koyu Lacivert #00008B, Altı Açık Mavi-Beyaz) */}
                                        <div
                                            style={{ height: `${heightPercent}%` }}
                                            className="w-full max-w-[48px] bg-gradient-to-b from-[#00008B] via-[#2563eb] to-[#e0f2fe] hover:from-[#0808a3] hover:via-[#3b82f6] hover:to-[#bae6fd] rounded-t-2xl border border-[#00008B]/20 shadow-lg shadow-[#00008B]/15 transition-all group-hover:scale-105"
                                        />

                                        {/* Month Label */}
                                        <span className="text-[10px] font-bold text-slate-600 mt-3 text-center block">
                                            {s.month}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Structured Educational & Market Impact Section Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left & Middle Column (2 Cols): What is it & Why follow? */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* WIDGET 1: Bu Veri Nedir ve Ne İşe Yarar? (3'LÜ MİNİ KART GRUBU & 10 SANİYEDE ÖZET) */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#00008B]">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-[#00008B]">Bu Veri Nedir ve Ne İşe Yarar?</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Basitleştirilmiş Tanım & Temel Finansal Bilgi</p>
                                    </div>
                                </div>
                            </div>

                            {/* ⚡ 10 Saniyede Özet Şeridi */}
                            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 font-semibold">
                                <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <strong className="text-amber-950 font-black block mb-0.5">⚡ 10 Saniyede Hızlı Özet:</strong>
                                    <span>{eduCards.quickSummary}</span>
                                </div>
                            </div>

                            {/* 🎨 3'LÜ MİNİ KART GRUBU */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Kart 1: Gündelik Hayattaki Karşılığı */}
                                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 space-y-2 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-xs font-black text-[#00008B]">
                                            <ShoppingBag className="w-4 h-4 text-blue-600" />
                                            <span>Gündelik Hayat Benzetmesi</span>
                                        </div>
                                        <p className="text-xs font-medium text-slate-700 leading-relaxed mt-2">
                                            {eduCards.dailyLife}
                                        </p>
                                    </div>
                                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block pt-2 border-t border-blue-200/40">
                                        • Somut Örnek
                                    </span>
                                </div>

                                {/* Kart 2: Neyi Ölçer? */}
                                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 space-y-2 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-xs font-black text-indigo-900">
                                            <Target className="w-4 h-4 text-indigo-600" />
                                            <span>Neyi Ölçer?</span>
                                        </div>
                                        <p className="text-xs font-medium text-slate-700 leading-relaxed mt-2">
                                            {eduCards.whatItMeasures}
                                        </p>
                                    </div>
                                    <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block pt-2 border-t border-indigo-200/40">
                                        • Temel İşlev
                                    </span>
                                </div>

                                {/* Kart 3: Cebinize & Bütçenize Etkisi */}
                                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 space-y-2 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-xs font-black text-emerald-950">
                                            <CreditCard className="w-4 h-4 text-emerald-600" />
                                            <span>Cebinize & Bütçenize Etkisi</span>
                                        </div>
                                        <p className="text-xs font-medium text-slate-700 leading-relaxed mt-2">
                                            {eduCards.walletImpact}
                                        </p>
                                    </div>
                                    <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block pt-2 border-t border-emerald-200/40">
                                        • Kişisel Bütçe
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* WIDGET 2: Yatırımcılar Bu Veriyi Neden Yakından Takip Eder? (3 BETİMSELE ÖDAK KARTLI YAPI) */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#00008B]">
                                        <HelpCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-[#00008B]">Yatırımcılar Bu Veriyi Neden Yakından Takip Eder?</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Piyasa Psikolojisi, Merkez Bankası Kararları & Paranın Rotasyonu</p>
                                    </div>
                                </div>
                            </div>

                            {/* 🎨 3 BETİMSEL ODAK PANELİ (Merkez Bankası + Akıllı Para + Cebiniz İçin Anlamı) */}
                            <div className="space-y-4">
                                {/* Panel 1: Merkez Bankası Bu Rakamı Görünce Ne Yapar? */}
                                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-[#00008B] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-[#00008B]/20">
                                        <Landmark className="w-5 h-5 text-amber-300" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black text-[#00008B] uppercase tracking-wider flex items-center gap-2">
                                            1. Merkez Bankası Bu Rakamı Görünce Ne Yapar? <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">(Devlet Boyutu)</span>
                                        </h4>
                                        <p className="text-xs font-medium text-slate-700 leading-relaxed">
                                            {whyFollow.centralBankAction}
                                        </p>
                                    </div>
                                </div>

                                {/* Panel 2: Zengin Yatırımcılar ve Büyük Fonlar Neden Pusuda Bekler? */}
                                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 flex items-start gap-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-indigo-900/20">
                                        <PiggyBank className="w-5 h-5 text-indigo-300" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                                            2. Zengin Yatırımcılar ve Dev Fonlar Neden Pusuda Bekler? <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">(Piyasa Boyutu)</span>
                                        </h4>
                                        <p className="text-xs font-medium text-slate-700 leading-relaxed">
                                            {whyFollow.bigMoneyMovement}
                                        </p>
                                    </div>
                                </div>

                                {/* Panel 3: Bunu Bilmek Senin Cebine Ne Kazandırır? */}
                                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-emerald-800/20">
                                        <Compass className="w-5 h-5 text-emerald-300" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                                            3. Bunu Bilmek Senin Cebine Ne Kazandırır? <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">(Sizin Boyutunuz)</span>
                                        </h4>
                                        <p className="text-xs font-medium text-slate-700 leading-relaxed">
                                            {whyFollow.personalBenefit}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (1 Col): Affected Parities & Assets Impact Matrix */}
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-150">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#00008B]">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-[#00008B]">Hangi Varlıklara Etki Eder?</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doğrudan Etkilenen Pariteler</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <span className="text-xs font-black text-[#00008B]">BIST 100 Endeksi</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">Yüksek Duyarlılık</span>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <span className="text-xs font-black text-[#00008B]">USD/TRY Dolar Kuru</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">Doğrudan Etki</span>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <span className="text-xs font-black text-[#00008B]">Gram Altın / Ons Altın</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">Orta Etki</span>
                                </div>
                            </div>
                        </div>

                        {/* Senaryo Analizi (Beklentinin Üstü / Altı) */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                            <h4 className="text-xs font-black text-[#00008B] uppercase tracking-wider">Senaryo Analizi</h4>
                            
                            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                                    <TrendingUp className="w-4 h-4 text-emerald-600" /> Beklentinin Üstünde Gelirse
                                </div>
                                <p className="text-[11px] text-emerald-900 font-medium">
                                    Piyasalarda sıkılaşma algısını artırabilir, döviz ve faiz oranları üzerinde yukarı yönlü baskı oluşturabilir.
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-black text-rose-800">
                                    <TrendingDown className="w-4 h-4 text-rose-600" /> Beklentinin Altında Gelirse
                                </div>
                                <p className="text-[11px] text-rose-900 font-medium">
                                    Piyasalarda rahatlama ve borsada olumlu hava yaratabilir.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
