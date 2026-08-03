"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Info, BookOpen, BarChart3, HelpCircle, ShoppingBag, Target, CreditCard, MinusCircle } from "lucide-react";
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

// Widget 2: "Bu Veri Neleri Etkiler?" Data Map
interface DataEffects {
    dailyLifeEffect: string;
    bankingCreditEffect: string;
    marketAssetsEffect: string;
}

const DATA_EFFECTS_MAP: Record<string, DataEffects> = {
    "Aylık Tüketici Fiyat Endeksi (TÜFE)": {
        dailyLifeEffect: "TÜFE enflasyonu doğrudan ev kiranızı, market etiketlerini ve maaş zam oranlarınızı etkiler. Rakam yüksek çıktığında önümüzdeki aylarda alışveriş sepetinizin pahalılaşacağını ve alım gücünüzün azalacağını gösterir.",
        bankingCreditEffect: "Merkez Bankası enflasyonu düşürmek için faiz artırdığında; konut, araç ve ihtiyaç kredisi faizleri tırmanır. Kredi çekip ev/araba almak zorlaşır ancak bankadaki vadeli mevduatınızın faiz getirisi yükselir.",
        marketAssetsEffect: "Büyük yatırımcılar paralarını enflasyona karşı korumak için saniyeler içinde karar verir. Yüksek faiz beklentisiyle Borsa İstanbul'daki hisseler kısa vadede satış yiyebilir; Dolar/TL ve kuyumcudaki Gram Altın fiyatlarında yukarı yönlü hareketlenme yaşanır."
    },
    "Yıllık Enflasyon Oranı (TÜFE)": {
        dailyLifeEffect: "Yıllık bazdaki ev kiralama artış tavanınızı, asgari ücret ve memur maaş güncellemelerini doğrudan etkiler.",
        bankingCreditEffect: "Bankaların uzun vadeli konut kredisi faiz oranlarını ve mevduat ürünlerinin reel getirisini etkiler.",
        marketAssetsEffect: "Yıllık enflasyon faizlerin üzerindeyse parayı korumak için hisse senetleri ve altın yatırımlarına hücum yaşanır."
    },
    "Aylık Üretici Fiyat Endeksi (ÜFE)": {
        dailyLifeEffect: "Fabrikaların üretim maliyetlerini etkiler. Yüksek ÜFE 1-2 ay sonra tükettiğiniz tüm ürün ve hizmetlerin raf etiketlerine zam olarak yansır.",
        bankingCreditEffect: "Şirketlerin borçlanma ihtiyacını etkiler. Üretim maliyetleri artan sanayiciler bankalara daha fazla ticari kredi başvurusu yapar.",
        marketAssetsEffect: "İmalat şirketlerinin kâr marjlarını etkiler. Yüksek maliyet yükü sanayi hisselerini düşürebilir."
    },
    "ISM İmalat PMI Endeksi": {
        dailyLifeEffect: "İş bulma imkanlarını ve piyasadaki istihdam canlılığını etkiler. Fabrikalar daha çok sipariş aldıkça yeni eleman alımları artar.",
        bankingCreditEffect: "Ekonomide büyüme veya resesyon tehlikesine göre faiz oranlarını etkiler. PMI düşükse Merkez Bankası kredileri ucuzlatmak için faiz indirir.",
        marketAssetsEffect: "Sanayi hisselerini ve küresel Dolar gücünü etkiler. Yüksek PMI borsa şirket karlarını uçurur."
    },
    "S&P Global İmalat PMI (Nihai)": {
        dailyLifeEffect: "Fabrikaların çarklarının ne kadar hızlı döndüğünü ve genel ekonomik canlılığı etkiler.",
        bankingCreditEffect: "Sanayi kredilerinin büyüme hızını ve bankaların ticari kredi iştahını etkiler.",
        marketAssetsEffect: "İhracatçı şirket hisselerini ve doğrudan yabancı sermaye girişlerini etkiler."
    },
    "Fed Politika Faizi Kararı": {
        dailyLifeEffect: "Küresel kredi kartı faizlerini, taksitli borçlanmanızı ve dövizle aldığınız tüm ithal ürünlerin maliyetini etkiler.",
        bankingCreditEffect: "Dünya genelindeki tüm bankaların faiz politikalarını etkiler. Yüksek Fed faizi küresel borçlanmayı zorlaştırır.",
        marketAssetsEffect: "Borsa İstanbul, Ons Altın ve Dolar/TL fiyatlarını anında etkiler. Faiz düştüğünde borsalara para akar, faiz yükseldiğinde hisselerden para çıkabilir."
    },
    "TCMB Politika Faizi Kararı": {
        dailyLifeEffect: "Kredi kartı asgari ödeme faizlerinizi, kredili mevduat hesaplarınızı (KMH) ve taksitli harcamalarınızı doğrudan etkiler.",
        bankingCreditEffect: "Bankaların konut, taşıt ve mevduat faiz oranlarını tabandan tavanına kadar etkiler. Faiz artarsa borçlanmak zorlaşır, mevduat fonu kazandırır.",
        marketAssetsEffect: "Borsa İstanbul ve TL döviz kurlarını doğrudan etkiler. Faiz artırımı TL'ye değer kazandırır."
    },
    "Tarım Dışı İstihdam Değişimi (NFP)": {
        dailyLifeEffect: "Dünya ekonomisindeki istihdam canlılığını ve küresel refah seviyesini etkiler.",
        bankingCreditEffect: "Amerikan Merkez Bankası'nın (Fed) faiz indirme veya artırma zamanlamasını etkiler.",
        marketAssetsEffect: "Kuyumcudaki Gram Altın ve Dolar/TL fiyatını saniyeler içinde etkiler. Yüksek veri Doları güçlendirir, Altını geriletebilir."
    },
    "Dış Ticaret Dengesi": {
        dailyLifeEffect: "Ülkeye giren ithal malların, teknolojik cihazların ve akaryakıtın fiyatını etkiler.",
        bankingCreditEffect: "Ülkenin döviz rezervlerini ve Merkez Bankası'nın döviz kurlarını koruma kapasitesini etkiler.",
        marketAssetsEffect: "Dolar ve Euro kurunun üzerindeki baskıyı doğrudan etkiler. Dış ticaret açığı büyürse kurlar yukarı yönlenir."
    },
    "İşsizlik Oranı": {
        dailyLifeEffect: "Halkın genel iş bulma kolaylığını ve şirketlerin maaş teklif seviyelerini etkiler.",
        bankingCreditEffect: "Tüketici kredileri geri ödeme performanslarını ve taksitli kredi iştahını etkiler.",
        marketAssetsEffect: "Perakende ve tüketim hisselerinin mağaza cirolarını etkiler."
    },
    "Default": {
        dailyLifeEffect: "Piyasadaki fiyatları, harcama imkanlarını ve yaşam maliyetini etkiler.",
        bankingCreditEffect: "Kredi ve mevduat faiz oranlarının yönünü etkiler.",
        marketAssetsEffect: "Borsa, döviz kurları ve altın fiyatlarındaki dengeleri etkiler."
    }
};

// Widget 4: Scenario Analysis Event Map (Rich Fluid Explanatory Paragraphs)
interface CauseEffectScenarioDetail {
    title: string;
    badge: string;
    paragraph: string;
}

interface EventCauseEffectScenarioGroup {
    above: CauseEffectScenarioDetail;
    inline: CauseEffectScenarioDetail;
    below: CauseEffectScenarioDetail;
}

const EVENT_SCENARIOS_MAP: Record<string, EventCauseEffectScenarioGroup> = {
    "Aylık Tüketici Fiyat Endeksi (TÜFE)": {
        above: {
            title: "Beklentinin Üstünde Gelirse",
            badge: "Yüksek Enflasyon Baskısı",
            paragraph: "Tüketici Fiyat Endeksi'nin (TÜFE) piyasa beklentilerinin üzerinde gerçekleşmesi, hanehalkı tüketim sepetindeki mal ve hizmet fiyatlarının tahmin edilenden daha hızlı tırmandığını kanıtlar. Bu durum, piyasada enflasyonist baskıların katılaştığı ve harcama iştahının henüz dizginlenemediği algısını güçlendirir. Fiyat istikrarını sağlamakla yükümlü olan Merkez Bankası, paranın değer kaybını durdurabilmek adına politika faizini artırmak veya yüksek faiz oranlarını daha uzun bir süre korumak zorunda kalır. Faizlerin tırmanmasıyla birlikte ticari ve bireysel kredi maliyetleri yükselirken, vadeli mevduat ve likit fonların getirisi cazip hale gelir; bu da piyasada genel bir likidite sıkılaşmasına ve ekonomik aktivitede denge arayışına yol açar."
        },
        inline: {
            title: "Beklentilerle Paralel Gelirse",
            badge: "Sürpriz Yok / Nötr Seyir",
            paragraph: "Açıklanan TÜFE verisinin analistlerin ve kurumsal piyasa yapıcıların tahmin ortalamasıyla birebir örtüşmesi, ekonomi yönetiminin ve enflasyon patikasının öngörülen rotada ilerlediğini gösterir. Finansal piyasalar verinin getireceği olası makroekonomik sonuçları haber açıklanmadan önce varlık fiyatlarına büyük ölçüde yansıttığı (fiyatladığı) için faiz ve kur dengesinde şok kırılmalar yaşanmaz. Merkez Bankası mevcut para politikası duruşunu koruma esnekliği kazanırken, şirketler ve bireysel yatırımcılar önceden planladıkları finansal projeksiyonları revize etmek zorunda kalmadan mevcut yatırım dengelerini sürdürürler."
        },
        below: {
            title: "Beklentinin Altında Gelirse",
            badge: "Dezenflasyon İvmesi",
            paragraph: "Tüketici Fiyat Endeksi'nin beklentilerin altında kalması, mal ve hizmet fiyatlarındaki artış hızının yavaşladığını ve dezenflasyon sürecinin güç kazandığını ortaya koyar. Ülkedeki hayat pahalılığının ivme kaybetmesi, hanehalklarının alım gücü üzerindeki baskıyı hafifletirken piyasadaki enflasyonist beklentileri de olumlu yönde kırar. Bu dezenflasyonist tablo, Merkez Bankası'na politika faizinde indirime gitme ve para politikasını gevşetme alanı tanır. Borçlanma ve kredi maliyetlerinin gerileyeceği beklentisiyle şirket kârlılıkları üzerindeki finansman yükü hafifler, piyasalarda genel risk iştahı artar ve reel ekonomik canlılık ivme kazanır."
        }
    },
    "Yıllık Enflasyon Oranı (TÜFE)": {
        above: {
            title: "Beklentinin Üstünde Gelirse",
            badge: "Yıllık Katı Enflasyon",
            paragraph: "Yıllık enflasyon oranının öngörülen düşüş patikasının üzerinde gerçekleşmesi, fiyat artışlarının ekonomi geneline yayılarak katılaştığını gösterir. Bu durum, piyasa katılımcılarının geleceğe yönelik enflasyonist beklentilerini yukarı yönlü revize etmesine neden olur. Merkez Bankası, enflasyon ataletini kırmak için para politikasını daha da sıkılaştırmak ve faiz oranlarını uzun süre yüksek tutmak durumunda kalır. Yüksek seyreden kredi faizleri yatırım ve tüketim iştahını frenlerken, paranın zamansal değer kaybı endişesi tasarruf tercihlerinde korumacı enstrümanlara olan talebi canlı tutar."
        },
        inline: {
            title: "Beklentilerle Paralel Gelirse",
            badge: "Patikayla Uyumlu",
            paragraph: "Yıllık enflasyonun piyasa tahminleriyle tam uyum göstermesi, 12 aylık fiyat artış trendinin dezenflasyon programıyla paralel ilerlediğini teyit eder. Piyasalarda ekstra bir belirsizlik dalgası oluşmadığı için uzun vadeli borçlanma senetleri ve mevduat faiz oranları mevcut dengesini muhafaza eder. Şirketler yıllık bütçeleme ve yatırım planlarını sarsıntı yaşamadan sürdürebilirken, Merkez Bankası makro ihtiyati tedbirlerini planlanan takvim dahilinde uygulamaya devam eder."
        },
        below: {
            title: "Beklentinin Altında Gelirse",
            badge: "Hızlı Gerileme",
            paragraph: "Yıllık enflasyon oranının tahmin edilenden belirgin şekilde düşük çıkması, baz etkisinin de katkısıyla dezenflasyon sürecinin hızlandığını gösterir. Paranın satın alma gücündeki aşınmanın yavaşlaması piyasa moralini yükseltir ve yabancı sermaye girişlerini teşvik eder. Merkez Bankası'nın faiz indirim döngüsünü başlatması veya hızlandırması için güçlü bir zemin oluşur. Kredi erişiminin kolaylaşacağı ve sermaye maliyetinin düşeceği algısıyla reel sektör yatırımları cesaret kazanır."
        }
    },
    "Aylık Üretici Fiyat Endeksi (ÜFE)": {
        above: {
            title: "Beklentinin Üstünde Gelirse",
            badge: "Üretim Maliyet Baskısı",
            paragraph: "Üretici Fiyat Endeksi'nin (ÜFE) beklenenden yüksek açıklanması; sanayicinin elektrik, hammadde, lojistik ve işçilik giderlerindeki artışın hızlandığını gösterir. Fabrika çıkış fiyatlarındaki bu maliyet tırmanışı, üreticilerin kâr marjlarını baskılarken birkaç ay içerisinde bu yükün tüketici etiketlerine zam olarak yansıyacağı endişesini doğurur. Tüketici enflasyonuna (TÜFE) ilişkin öncü bir sinyal kabul edilen bu tablo, Merkez Bankası'nın faiz indirim adımlarını ertelemesine ve maliyet yönlü enflasyon baskılarına karşı daha temkinli bir duruş sergilemesine yol açar."
        },
        inline: {
            title: "Beklentilerle Paralel Gelirse",
            badge: "Maliyet Düzeyi Dengeli",
            paragraph: "Üretici maliyetlerindeki değişimlerin piyasa tahminleri düzeyinde gerçekleşmesi, imalat sektörünün girdi maliyetlerinde beklenmedik bir şok yaşanmadığını kanıtlar. Fabrikalar üretim bütçelerini ve kârlılık hedeflerini öngörüldüğü şekilde yönetme imkanı bulur. Sanayi şirketleri üzerindeki maliyet baskısı sabit kaldığı için tüketici fiyatlarına yansıyacak ekstra bir zam dalgası riski oluşmaz ve üretim çarkları istikrarlı seyrini korur."
        },
        below: {
            title: "Beklentinin Altında Gelirse",
            badge: "Girdi Maliyetlerinde Rahatlama",
            paragraph: "ÜFE'nin beklentilerin altında kalması, küresel hammadde, enerji ve tedarik maliyetlerinde gevşeme yaşandığına işaret eder. İmalatçıların üretim maliyetlerinin hafiflemesi, şirketlerin kâr marjlarını rahatlatırken önümüzdeki dönemde tüketici fiyatları üzerindeki zam baskısını önemli ölçüde azaltır. Gelecek aylara dair enflasyon beklentilerinin gerilemesiyle birlikte para politikasında rahatlama sinyalleri güçlenir ve sanayi üretimine yönelik yatırım iştahı artar."
        }
    },
    "ISM İmalat PMI Endeksi": {
        above: {
            title: "Beklentinin Üstünde Gelirse",
            badge: "Sanayide Güçlü Büyüme",
            paragraph: "ISM İmalat PMI endeksinin beklentilerin üzerinde açıklanması, imalat sektöründeki fabrika siparişlerinin, üretimin ve istihdamın canlılığını sürdürdüğünü kanıtlar. Sanayi çarklarının hızlı dönmesi genel ekonomik büyümenin güçlü olduğunu gösterse de, aşırı ısınan bir ekonomide işgücü ve hammadde maliyetlerinin artarak enflasyonu tetikleyebileceği endişesini yaratır. Bu durum, Merkez Bankası'nın para politikasını sıkı tutma veya faiz oranlarını yüksek seviyelerde koruma süresini uzatabileceği beklentisini doğurur."
        },
        inline: {
            title: "Beklentilerle Paralel Gelirse",
            badge: "Dengeli Üretim Hacmi",
            paragraph: "PMI verisinin piyasa beklentileriyle tam uyum sağlaması, imalat sektörünün ne aşırı ısındığını ne de daralma riski taşıdığını, makul bir büyüme temposunda ilerlediğini gösterir. Satınalma yöneticilerinin sipariş ve stok projeksiyonları doğrulandığı için piyasalarda ani bir reaksiyon yaşanmaz. Küresel ekonomi yönetimleri mevcut para ve maliye politikalarını değiştirmeden uygulamaya devam ederler."
        },
        below: {
            title: "Beklentinin Altında Gelirse",
            badge: "Sanayide Yavaşlama Sinyali",
            paragraph: "PMI endeksinin beklentilerin gerisinde kalması (özellikle 50 referans çizgisinin altına inmesi), sanayi üretiminde ve fabrika siparişlerinde belirgin bir kan kaybına işaret eder. Ekonomik aktivitenin yavaşladığı ve resesyon (ekonomik durgunluk) riskinin kapıya dayandığı algısı güçlenir. Büyümeyi yeniden canlandırmak ve istihdam kaybını önlemek amacıyla Merkez Bankaları politika faizlerinde indirim yapma ve piyasaya likidite sağlama baskısı altına girerler."
        }
    },
    "Fed Politika Faizi Kararı": {
        above: {
            title: "Sürpriz Faiz Artırımı / Şahin Karar",
            badge: "Para Musluğu Sıkılaştı",
            paragraph: "Fed'in beklentilerin üzerinde bir faiz artırımına gitmesi veya karar metninde beklenenden çok daha sert (şahin) bir tonda sıkılaşma vurgusu yapması, küresel finans sisteminde paraya erişim maliyetini anında tırmandırır. Küresel Dolar likiditesinin çekilmesiyle birlikte borçlanma maliyetleri yükselir, bireysel ve kurumsal harcama iştahı baskılanır. Gelişmekte olan ülkelerden sermaye çıkış riski doğarken, uluslararası yatırımcılar riskli varlıklardan kaçınarak yüksek faiz getirisi sunan güvenli liman enstrümanlarına yönelirler."
        },
        inline: {
            title: "Beklentilere Paralel Karar",
            badge: "Piyasa Beklentisi Karşılandı",
            paragraph: "Fed'in faiz kararını piyasa yapıcıların ve analistlerin tam olarak öngördüğü seviyede açıklaması, karar öncesinde yapılan fiyatlamaları doğrular. Kararın kendisi bir sürpriz yaratmadığı için küresel borsalarda şok dalgalanmalar görülmez. Tüm piyasa katılımcıları, faiz kararından ziyade Merkez Bankası Başkanı'nın basın toplantısındaki ifadelerine ve gelecek dönem faiz patikasına ilişkin ipuçlarına odaklanırlar."
        },
        below: {
            title: "Sürpriz Faiz İndirimi / Güvercin Karar",
            badge: "Piyasaya Likidite Desteği",
            paragraph: "Fed'in sürpriz bir faiz indirimine gitmesi veya gevşeme sürecinin hızlanacağına dair güvercin mesajlar vermesi, küresel para musluklarının açıldığı anlamına gelir. Borçlanma maliyetlerinin düşmesiyle birlikte şirketlerin yatırım yapması ve finansmana erişimi kolaylaşır. Küresel sermayenin risk iştahı artarak gelişmekte olan piyasalara ve büyüme odaklı varlıklara taze para akışı başlar, ekonomik aktivite küresel ölçekte canlılık kazanır."
        }
    },
    "TCMB Politika Faizi Kararı": {
        above: {
            title: "Beklentinin Üstünde Faiz Artırımı",
            badge: "Şok Sıkılaşma",
            paragraph: "TCMB'nin politika faizini piyasa beklentilerinin üzerinde artırması, enflasyonla mücadelede kararlılık ve Türk Lirası'nın cazibesini koruma hamlesi olarak okunur. Bankaların mevduat faiz oranları ve kredi maliyetleri hızla tırmanırken, piyasadaki Türk Lirası likiditesi çekilir. Kredi çekerek harcama yapma iştahı yavaşlar, vadeli TL mevduat ürünlerinin cazibesi tavan yapar; bu da enflasyonist beklentileri kırmayı ve döviz talebini dizginlemeyi hedefler."
        },
        inline: {
            title: "Beklentilerle Paralel Karar",
            badge: "Karar Fiyatlandı",
            paragraph: "TCMB kararlarının piyasa konsensüsüne tam uyum göstermesi, finansal kurumların ve yatırımcıların önceden aldığı pozisyonların korunmasını sağlar. Kredi ve mevduat faizlerinde ani bir sıçrama veya çöküş yaşanmaz. Piyasa odak noktası karar metnindeki sterilizasyon adımlarına ve Merkez Bankası'nın önümüzdeki toplantılara dair politika yönlendirmelerine kayar."
        },
        below: {
            title: "Faiz İndirimi / Gevşeme",
            badge: "Kredi & Büyüme Desteği",
            paragraph: "TCMB'nin faiz indirimi başlatması veya politikayı gevşetmesi, reel sektörü ve ticari yatırımları ucuz finansmanla destekleme amacını taşır. Bankaların kredi verme iştahı artarken, borçlanma maliyetlerinin gerilemesiyle sanayi, inşaat ve perakende sektörlerinde yatırım harcamaları hız kazanır. Piyasadaki likiditenin artması ekonomik büyümeyi ivmelendirirken, enflasyon dengesinin yakından izlenmesini gerektirir."
        }
    },
    "Tarım Dışı İstihdam Değişimi (NFP)": {
        above: {
            title: "Beklentinin Üstünde İstihdam",
            badge: "Sıcak İstihdam Piyasası",
            paragraph: "ABD Tarım Dışı İstihdam verisinin beklenenin çok üzerinde gelmesi, Amerikan şirketlerinin güçlü bir işe alım temposu sürdürdüğünü kanıtlar. İşgücü piyasasının bu derece sıkı kalması, ücret artışlarının yüksek seyretmesine ve dolayısıyla tüketim harcamalarının enflasyonu beslemesine yol açabilir. Bu durum, Amerikan Merkez Bankası'nın (Fed) faiz indirimlerini erteleyeceği beklentisini doğurarak küresel finansman koşullarının sıkı kalmasına neden olur."
        },
        inline: {
            title: "Beklentilerle Paralel İstihdam",
            badge: "Makul İstihdam Dengesi",
            paragraph: "Yeni yaratılan iş sayısının tahminlerle uyumlu gerçekleşmesi, istihdam piyasasında aşırı ısınma ya da sert bir soğuma yaşanmadığını gösterir. İşgücü arz ve talebinin dengede ilerlemesi para politikasında acil bir rotasyon ihtiyacı yaratmaz, küresel piyasalar mevcut makroekonomik dengelerini korurlar."
        },
        below: {
            title: "Beklentinin Altında İstihdam",
            badge: "İstihdamda Soğuma Sinyali",
            paragraph: "İstihdam artışının beklentilerin belirgin şekilde gerisinde kalması, Amerikan ekonomisinde şirketlerin işe alımları yavaşlattığına ve ekonomik aktivitede soğuma başladığına işaret eder. İşsizlik riskinin tırmanması, Merkez Bankası'nın faiz indirim sürecini öne çekerek ekonomiyi ve istihdamı destekleme zorunluluğunu doğurur."
        }
    },
    "Default": {
        above: {
            title: "Beklentinin Üstünde Gelirse",
            badge: "Yüksek Veri Gerçekleşmesi",
            paragraph: "Makroekonomik verinin piyasa beklentilerinin üzerinde gerçekleşmesi, ilgili ekonomik aktivitenin veya fiyat baskılarının tahminlerden güçlü seyrettiğini gösterir. Bu tablo, para otoritelerinin sıkılaştırıcı adımları artırmasına veya yüksek faiz oranlarını korumasına neden olabilir. Borçlanma maliyetlerinde yukarı yönlü baskı oluşurken piyasada likidite koşulları sıkılaşır."
        },
        inline: {
            title: "Beklentilerle Paralel Gelirse",
            badge: "Sürpriz Yok",
            paragraph: "Verinin piyasa beklentileriyle tam uyumlu açıklanması, ekonomideki öngörülebilirliği artırır. Piyasa yapıcılar verinin etkilerini önden fiyatladığı için finansal dengelerde beklenmedik sarsıntılar yaşanmaz, mevcut borçlanma ve yatırım projeksiyonları korunur."
        },
        below: {
            title: "Beklentinin Altında Gelirse",
            badge: "Düşük Veri Gerçekleşmesi",
            paragraph: "Göstergenin tahminlerin gerisinde kalması, ekonomik aktivitede veya fiyat artışlarında ivme kaybına işaret eder. Bu durum, Merkez Bankaları ve ekonomi yönetimleri üzerinde destekleyici ve gevşetici politikalar uygulama ihtiyacı doğurur. Finansman maliyetlerinde rahatlama ve piyasayı canlandırıcı beklentiler güç kazanır."
        }
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
    const [activeScenarioTab, setActiveScenarioTab] = useState<'above' | 'inline' | 'below'>('above');

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

    // Get overview Turkish description
    const overviewText = OVERVIEW_TR_DESCRIPTIONS[event.event] || 
        OVERVIEW_TR_DESCRIPTIONS[Object.keys(OVERVIEW_TR_DESCRIPTIONS).find(k => event.event.includes(k)) || ""] ||
        `${event.country} makroekonomik verileri arasında yer alan ${event.event}, piyasa yapıcılar ve yatırımcılar tarafından yakından takip edilen temel göstergelerden biridir.`;

    // 3-Mini Card Group Educational Object
    const eduCards = THREE_CARD_EDUCATION_MAP[event.event] ||
        THREE_CARD_EDUCATION_MAP[Object.keys(THREE_CARD_EDUCATION_MAP).find(k => event.event.includes(k)) || ""] ||
        THREE_CARD_EDUCATION_MAP["Default"];

    // Widget 2: "Bu Veri Neleri Etkiler?" Object
    const dataEffects = DATA_EFFECTS_MAP[event.event] ||
        DATA_EFFECTS_MAP[Object.keys(DATA_EFFECTS_MAP).find(k => event.event.includes(k)) || ""] ||
        DATA_EFFECTS_MAP["Default"];

    // Widget 4: Scenario Analysis Object Group (Fluid Explanatory Paragraphs)
    const scenarios = EVENT_SCENARIOS_MAP[event.event] ||
        EVENT_SCENARIOS_MAP[Object.keys(EVENT_SCENARIOS_MAP).find(k => event.event.includes(k)) || ""] ||
        EVENT_SCENARIOS_MAP["Default"];

    const currentScenario = scenarios[activeScenarioTab];

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
                </div>

                {/* Event Main Header Banner (LACİVERT ZEMİN) */}
                <div className="w-full bg-[#00008B] text-white border border-[#00008B] rounded-3xl p-8 shadow-xl shadow-[#00008B]/20 relative overflow-hidden space-y-6">
                    <div className="relative z-10 space-y-6">
                        {/* Üst Başlık Alanı */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                    {event.event}
                                </h1>
                            </div>
                        </div>

                        {/* ÖZET BİLGİ KUTUSU (Tamamen Beyaz Başlık ve İkon) */}
                        <div className="p-5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md leading-relaxed space-y-2">
                            <p className="text-white font-bold text-sm flex items-center gap-2">
                                <Info className="w-4 h-4 text-white" /> Veri Hakkında Özet Bilgi:
                            </p>
                            <p className="text-white text-xs font-medium leading-relaxed">
                                {overviewText}
                            </p>
                        </div>

                        {/* METRİK WIDGET'LARI */}
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

                {/* GEÇMİŞ VERİ GRAFİĞİ BÖLÜMÜ */}
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

                    {/* Bar Chart Visualizer */}
                    <div className="py-8 px-2">
                        <div className="flex items-end justify-between gap-3 md:gap-5 h-72 border-b border-slate-200 pb-4">
                            {chartSeries.map((s, idx) => {
                                const heightPercent = Math.min(Math.max((Math.abs(s.actual) / maxVal) * 100, 18), 100);
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                        <span className="text-xs font-black text-[#00008B] mb-2 tracking-tight block group-hover:scale-110 transition-transform">
                                            {s.formattedActual}
                                        </span>

                                        <div
                                            style={{ height: `${heightPercent}%` }}
                                            className="w-full max-w-[48px] bg-gradient-to-b from-[#00008B] via-[#2563eb] to-[#e0f2fe] hover:from-[#0808a3] hover:via-[#3b82f6] hover:to-[#bae6fd] rounded-t-2xl border border-[#00008B]/20 shadow-lg shadow-[#00008B]/15 transition-all group-hover:scale-105"
                                        />

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
                        {/* WIDGET 1: Bu Veri Nedir ve Ne İşe Yarar? */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-150">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#00008B]">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-[#00008B]">Bu Veri Nedir ve Ne İşe Yarar?</h3>
                                </div>
                            </div>

                            {/* 10 Saniyede Özet Şeridi */}
                            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 font-semibold">
                                <div>
                                    <strong className="text-amber-950 font-black block mb-0.5">10 Saniyede Hızlı Özet:</strong>
                                    <span>{eduCards.quickSummary}</span>
                                </div>
                            </div>

                            {/* 3'LÜ MİNİ KART GRUBU */}
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
                                </div>
                            </div>
                        </div>

                        {/* WIDGET 2: Bu Veri Neleri Etkiler? (İKON KUTULARI KALDIRILMIŞ SADE PANEL YAPISI) */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-150">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#00008B]">
                                    <HelpCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-[#00008B]">Bu Veri Neleri Etkiler?</h3>
                                </div>
                            </div>

                            {/* 3 ODAK PANELİ (İkon kutuları tamamen kaldırılmış tam genişlikli metin kutuları) */}
                            <div className="space-y-4">
                                {/* Panel 1: Gündelik Hayatı ve Yaşam Maliyetinizi Etkiler */}
                                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 space-y-1.5">
                                    <h4 className="text-xs font-black text-[#00008B] uppercase tracking-wider">
                                        1. Gündelik Hayatı ve Yaşam Maliyetinizi Etkiler
                                    </h4>
                                    <p className="text-xs font-medium text-slate-700 leading-relaxed">
                                        {dataEffects.dailyLifeEffect}
                                    </p>
                                </div>

                                {/* Panel 2: Banka Kredilerini ve Mevduat Faizlerini Etkiler */}
                                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 space-y-1.5">
                                    <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                                        2. Banka Kredilerini ve Mevduat Faizlerini Etkiler
                                    </h4>
                                    <p className="text-xs font-medium text-slate-700 leading-relaxed">
                                        {dataEffects.bankingCreditEffect}
                                    </p>
                                </div>

                                {/* Panel 3: Borsa İstanbul, Dolar ve Altın Fiyatlarını Etkiler */}
                                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-1.5">
                                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                                        3. Borsa İstanbul, Dolar ve Altın Fiyatlarını Etkiler
                                    </h4>
                                    <p className="text-xs font-medium text-slate-700 leading-relaxed">
                                        {dataEffects.marketAssetsEffect}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (1 Col): Scenario Analysis (Zengin ve Akıcı Paragraf Yapısı) */}
                    <div className="space-y-6">
                        {/* WIDGET 4: SENARYO ANALİZİ */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                                <h4 className="text-xs font-black text-[#00008B] uppercase tracking-wider">Senaryo Analizi</h4>
                            </div>

                            {/* 3'LÜ İNTERAKTİF SENARYO SEÇİCİ SEKMELERİ (TABS) */}
                            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
                                <button
                                    onClick={() => setActiveScenarioTab('above')}
                                    className={`py-2 px-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 ${
                                        activeScenarioTab === 'above'
                                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                    }`}
                                >
                                    <TrendingUp className="w-3 h-3" /> Üstünde
                                </button>

                                <button
                                    onClick={() => setActiveScenarioTab('inline')}
                                    className={`py-2 px-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 ${
                                        activeScenarioTab === 'inline'
                                            ? 'bg-slate-700 text-white shadow-md shadow-slate-700/20'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                    }`}
                                >
                                    <MinusCircle className="w-3 h-3" /> Paralel
                                </button>

                                <button
                                    onClick={() => setActiveScenarioTab('below')}
                                    className={`py-2 px-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 ${
                                        activeScenarioTab === 'below'
                                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                    }`}
                                >
                                    <TrendingDown className="w-3 h-3" /> Altında
                                </button>
                            </div>
                            
                            {/* AKTİF SEÇİLİ SENARYO PARAGRAF KARTI (TEK VE ZENGİN ANLATIM KARTI) */}
                            <div className={`p-5 rounded-2xl border space-y-3 transition-all ${
                                activeScenarioTab === 'above'
                                    ? 'bg-emerald-50/90 border-emerald-200'
                                    : activeScenarioTab === 'inline'
                                    ? 'bg-slate-50 border-slate-200'
                                    : 'bg-rose-50/90 border-rose-200'
                            }`}>
                                {/* Kart Başlığı */}
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                                    <h5 className={`text-xs font-black uppercase tracking-wider ${
                                        activeScenarioTab === 'above' ? 'text-emerald-900' : activeScenarioTab === 'inline' ? 'text-slate-800' : 'text-rose-900'
                                    }`}>
                                        {currentScenario.title}
                                    </h5>
                                </div>

                                {/* DETAYLI, AÇIKLAYICI VE ZENGİN TEK PARAGRAF METNİ */}
                                <p className="text-xs font-medium text-slate-700 leading-relaxed pt-1">
                                    {currentScenario.paragraph}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
