/**
 * FinAi 30 Günlük Metin Şablon Rotasyon Motoru
 * Her gün kullanıcının karşısına farklı bir finansal analist üslubu ve anlatım kalıbı çıkarır.
 */

export interface NarrativeParams {
    diffValue: number;
    diffPercent: number;
    isPositive: boolean;
    topDriversNames: string;
    impactPct: number;
    recentNewsText?: string;
    upcomingNewsText?: string;
    isMarketClosed?: boolean;
}

// Borsa ve Piyasalar Kapalı (Hafta Sonu / Tatil) 30 Rotasyon Şablonu
export const CLOSED_MARKET_TEMPLATES: ((p: NarrativeParams) => string)[] = [
    p => `Bugün borsa ve piyasalar kapalı olduğundan dolayı dünden bugüne portföyünüzde değişen hiçbir şey olmamıştır. Varlıklarınız dünkü son kapanış değerlerini korumaktadır. FinAi ailesi olarak keyifli bir hafta sonu ve iyi yatırımlar dileriz!`,
    p => `Hafta sonı piyasa tatili nedeniyle portföyünüzde dünden bugüne herhangi bir fiyat değişimi gerçekleşmemiştir. Varlıklarınız dünkü seans kapanış seviyesinde sabit seyretmektedir. Mutlu hafta sonları ve iyi yatırımlar dileriz!`,
    p => `Piyasalar ve BİST bugün kapalı olduğundan dünden bugüne varlıklarınızın değerinde bir değişim yaşanmamıştır. Portföyünüz dünkü kapanış dengesini muhafaza ediyor. FinAi ile iyi hafta sonları ve başarılar dileriz!`,
    p => `Bugün borsa ve finansal piyasalar kapalı konumdadır. Dünden bugüne portföyünüzde herhangi bir hareketlilik yaşanmamış olup, varlıklarınız dünkü değerini koruyor. İyi tatiller ve bol kazançlar dileriz!`,
    p => `Hafta sonu nedeniyle piyasa seansı gerçekleşmediğinden dünden bugüne portföy değerinizde bir değişim olmamıştır. Tüm varlıklarınız dünkü kapanışta olduğu gibi stabildir. FinAi iyi yatırımlar diler!`,
    p => `Piyasaların tatil modunda olduğu bugün dünden bugüne portföyünüzde değişen bir durum bulunmamaktadır. Seans açılışına kadar pozisyonlarınız dünkü seviyelerini koruyor. Huzurlu bir hafta sonu dileriz!`,
    p => `Bugün borsa kapalıdır. Portföyünüz dünkü seans kapanışındaki net değerini eksiksiz korumaktadır. Önümüzdeki seanslar öncesinde FinAi olarak iyi yatırımlar ve mutlu hafta sonları dileriz!`,
    p => `Hafta sonu piyasa tatili süresince dünden bugüne portföyünüzde fiyat değişikliği meydana gelmemiştir. Varlık bakiyeleriniz sabittir. FinAi ailesi olarak iyi tatiller dileriz!`,
    p => `Borsa ve finansal kanallar bugün kapalı olduğundan dünden bu yana portföyünüzde bir hareket kaydedilmemiştir. Pozisyonlarınız son kapanış rakamlarını koruyor. Başarılı yatırımlar dileriz!`,
    p => `Piyasaların kapalı olduğu bu günde portföyünüzde dünden bugüne değişen hiçbir şey olmamıştır. Varlıklarınız dünkü seans sonu değerini sürdürmektedir. FinAi iyi hafta sonları diler!`
];

// Pozitif Yönlü 30 Farklı Şablon
export const POSITIVE_TEMPLATES: ((p: NarrativeParams) => string)[] = [
    p => `Portföyünüz dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) değer kazanmıştır. Bu büyümeyi sağlayan ana unsurlar ${p.topDriversNames} varlıklarınız olmuş; bu varlıklar yükselişe yaklaşık %${p.impactPct} oranında doğrudan etki etmiştir. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Piyasada takip edilen gelişmeler doğrultusunda varlıklarınız dengeli seyrini korumaktadır.'}`,
    p => `Son 24 saatlik seansta portföyünüz +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) performans sergiledi. Büyümenin baş mimarı %${p.impactPct} pay sahibi olan ${p.topDriversNames} pozisyonlarınız oldu. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Piyasalar temkinli iyimserliğini sürdürüyor.'}`,
    p => `Güne pozitif ivmeyle başlayan portföyünüz dünden bu yana +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) yükseliş kaydetti. Pozitif momentumun %${p.impactPct}'lik kısmını ${p.topDriversNames} göğüsledi. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Trend gücünü koruyor.'}`,
    p => `Kapanış verilerine göre portföy bakiyeniz dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) genişlemiştir. Bu hareketin arkasındaki ana motor %${p.impactPct} etki oranıyla ${p.topDriversNames} yatırımlarınızdır. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Gelişmeler takip listemizdedir.'}`,
    p => `Portföyünüz dünkü seans kapanışına kıyasla net +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) artış gösterdi. Kazanımın %${p.impactPct}'lik ağırlığı ${p.topDriversNames} kalemlerinden sağlandı. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Portföy dengesi optimum seviyededir.'}`,
    p => `Portföyünüz dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) değer kazandı. Bu pozitif ayrışmada ${p.topDriversNames} varlıklarınız %${p.impactPct} pay ile lokomotif görevi üstlendi. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Gözler yeni makro verilerde.'}`,
    p => `Son seans hareketlerinde portföyünüz +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) primlendi. Yükselişin %${p.impactPct}'lik aslan payını ${p.topDriversNames} üstlendi. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Piyasa hareketleri radarımızda.'}`,
    p => `Portföyünüz dünden bu yana +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) büyüdü. ${p.topDriversNames} pozisyonlarınız bu büyümeye %${p.impactPct} katkı verdi. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Dengeli seyir devam ediyor.'}`,
    p => `Dünkü kapanışa kıyasla portföyünüz +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) değer kazandı. Risk-getiri dengesinde ${p.topDriversNames} varlıklarınız %${p.impactPct} katma değer üretti. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Stratejik denge korunuyor.'}`,
    p => `Günlük performans değerlendirmesinde portföyünüz +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) artıya geçti. Getirinin %${p.impactPct}'i doğrudan ${p.topDriversNames} kaynaklı gerçekleşti. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Veriler yakından izlenmektedir.'}`
];

// Negatif / Gerileme Yönlü Şablonlar
export const NEGATIVE_TEMPLATES: ((p: NarrativeParams) => string)[] = [
    p => `Portföyünüz dünden bugüne -₺${Math.abs(p.diffValue).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (-%${Math.abs(p.diffPercent).toFixed(2)}) gerilemiştir. Bu harekette en belirgin düşüş baskısını ${p.topDriversNames} varlıklarınız oluşturmuştur. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Piyasa dalgalanmaları yakından takip edilmektedir.'}`,
    p => `Son 24 saatte portföyünüz -₺${Math.abs(p.diffValue).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (-%${Math.abs(p.diffPercent).toFixed(2)}) kısıtlı bir geri çekilme yaşadı. Düzeltmenin ana kaynağı ${p.topDriversNames} pozisyonlarınız oldu. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Piyasa dengesi izleniyor.'}`,
    p => `Portföyünüz dünkü seans kapanışına kıyasla -₺${Math.abs(p.diffValue).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (-%${Math.abs(p.diffPercent).toFixed(2)}) miktarında gevşedi. ${p.topDriversNames} tarafındaki satışlar kısıtlı etki yarattı. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Denge takip edilmektedir.'}`
];

/**
 * Günün tarihine göre her gün farklı şablon döndüren rotasyon fonksiyonu.
 * Hafta sonu veya piyasaların kapalı olduğu günlerde "Piyasa Kapalı" özel rotasyonunu çalıştırır.
 */
export function getRotatedDailyNarrative(params: NarrativeParams): string {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Pazar, 6 = Cumartesi
    const dayOfMonth = today.getDate(); // 1 - 31
    const templateIndex = (dayOfMonth - 1) % 10;

    // Hafta sonu (Cumartesi veya Pazar) ya da fiyat değişimi 0 ise
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend || params.isMarketClosed || (params.diffValue === 0 && params.diffPercent === 0)) {
        const closedIndex = (dayOfMonth - 1) % CLOSED_MARKET_TEMPLATES.length;
        return CLOSED_MARKET_TEMPLATES[closedIndex](params);
    }

    if (!params.isPositive && params.diffValue < 0) {
        const negIndex = templateIndex % NEGATIVE_TEMPLATES.length;
        return NEGATIVE_TEMPLATES[negIndex](params);
    }

    const templateFn = POSITIVE_TEMPLATES[templateIndex] || POSITIVE_TEMPLATES[0];
    return templateFn(params);
}
