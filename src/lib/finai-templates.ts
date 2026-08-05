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
}

// Pozitif Yönlü 30 Farklı Şablon
export const POSITIVE_TEMPLATES: ((p: NarrativeParams) => string)[] = [
    // 1. Klasik Analist
    p => `Portföyünüz dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) değer kazanmıştır. Bu büyümeyi sağlayan ana unsurlar ${p.topDriversNames} varlıklarınız olmuş; bu varlıklar yükselişe yaklaşık %${p.impactPct} oranında doğrudan etki etmiştir. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Piyasada takip edilen gelişmeler doğrultusunda varlıklarınız dengeli seyrini korumaktadır.'}`,

    // 2. Özet Yönetici Bülteni
    p => `Son 24 saatlik seansta portföyünüz +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) performans sergiledi. Büyümenin baş mimarı %${p.impactPct} pay sahibi olan ${p.topDriversNames} pozisyonlarınız oldu. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Piyasalar temkinli iyimserliğini sürdürüyor.'}`,

    // 3. Trend & Momentum Fokuslu
    p => `Güne pozitif ivmeyle başlayan portföyünüz dünden bu yana +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) yükseliş kaydetti. Pozitif momentumun %${p.impactPct}'lik kısmını ${p.topDriversNames} göğüsledi. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Trend gücünü koruyor.'}`,

    // 4. Piyasa Hakemi Tonu
    p => `Kapanış verilerine göre portföy bakiyeniz dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) genişlemiştir. Bu hareketin arkasındaki ana motor %${p.impactPct} etki oranıyla ${p.topDriversNames} yatırımlarınızdır. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Gelişmeler takip listemizdedir.'}`,

    // 5. Yatırım Komitesi Stili
    p => `Portföyünüz dünkü seans kapanışına kıyasla net +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) artış gösterdi. Kazanımın %${p.impactPct}'lik ağırlığı ${p.topDriversNames} kalemlerinden sağlandı. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Portföy dengesi optimum seviyededir.'}`,

    // 6. Mikro & Makro Dengeli
    p => `Portföyünüz dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) değer kazandı. Bu pozitif ayrışmada ${p.topDriversNames} varlıklarınız %${p.impactPct} pay ile lokomotif görevi üstlendi. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Gözler yeni makro verilerde.'}`,

    // 7. Borsa Ajanı Odaklı
    p => `Son seans hareketlerinde portföyünüz +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) primlendi. Yükselişin %${p.impactPct}'lik aslan payını ${p.topDriversNames} üstlendi. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Piyasa hareketleri radarımızda.'}`,

    // 8. Kısa & Sade
    p => `Portföyünüz dünden bu yana +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) büyüdü. ${p.topDriversNames} pozisyonlarınız bu büyümeye %${p.impactPct} katkı verdi. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Dengeli seyir devam ediyor.'}`,

    // 9. Stratejik Risk & Getiri
    p => `Dünkü kapanışa kıyasla portföyünüz +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) değer kazandı. Risk-getiri dengesinde ${p.topDriversNames} varlıklarınız %${p.impactPct} katma değer üretti. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Stratejik denge korunuyor.'}`,

    // 10. Performans Raporu
    p => `Günlük performans değerlendirmesinde portföyünüz +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) artıya geçti. Getirinin %${p.impactPct}'i doğrudan ${p.topDriversNames} kaynaklı gerçekleşti. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Veriler yakından izlenmektedir.'}`,

    // 11. Dinamik Portföy Bülteni
    p => `Portföyünüzün toplam büyüklüğü dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) oranında genişledi. Artışın merkezinde %${p.impactPct} oranında ${p.topDriversNames} yer alıyor. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Gelişmeler takip ediliyor.'}`,

    // 12. FinAi Özel Değerlendirme
    p => `FinAi analizlerine göre portföyünüz son 24 saatte +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) artış kaydetti. ${p.topDriversNames} varlıklarınız %${p.impactPct} ivme sağlayarak pozitif ayrıştı. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Piyasa dengesi sağlam.'}`,

    // 13. Alfa Kazanç Odaklı
    p => `Piyasa seyrinde portföyünüz dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) değer kazanarak pozitif ayrıştı. Katkının %${p.impactPct}'i ${p.topDriversNames} pozisyonlarınızdan geldi. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Getiri potansiyeli devam ediyor.'}`,

    // 14. Güne Başlarken Raporu
    p => `Yeni seans gününde portföyünüz dünkü seviyesinin +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) üzerinde seyrediyor. %${p.impactPct} pay ile ${p.topDriversNames} yükselişte öncü oldu. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Önemli gelişmeler izleniyor.'}`,

    // 15. Portföy Radarı
    p => `Portföy radarımız dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) değer artışı işaret ediyor. Büyümenin %${p.impactPct}'ini ${p.topDriversNames} sağladı. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Seyir olumlu.'}`,

    // 16. Kapanış Sonrası Özet
    p => `Dünkü kapanış değerlerine kıyasla portföyünüz +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) değer kazandı. Bu kazançta %${p.impactPct} pay ile ${p.topDriversNames} öne çıktı. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Denge korunuyor.'}`,

    // 17. Strateji Bülteni
    p => `Portföyünüzün dünden bugüne değişimi +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) olarak gerçekleşti. Pozitif katkının %${p.impactPct}'si ${p.topDriversNames} kaynaklıdır. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Takipteyiz.'}`,

    // 18. Likidite & Varlık Analizi
    p => `Varlıklarınızın toplam değeri dünden bu yana +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) artış gösterdi. Ana destek %${p.impactPct} oranıyla ${p.topDriversNames} tarafındandır. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Piyasa dengede.'}`,

    // 19. Finansal Hakem Görüşü
    p => `Portföyünüz dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) net büyüme yakaladı. Yükselişin %${p.impactPct}'lik ağırlığını ${p.topDriversNames} oluşturdu. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Seyir takip edilmektedir.'}`,

    // 20. Piyasa Odaklı Yorum
    p => `Piyasa dinamikleri portföyünüze dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) artış olarak yansıdı. %${p.impactPct} katkıyla ${p.topDriversNames} ana sürükleyici oldu. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'İyimser hava sürüyor.'}`,

    // 21. Büyüme Endeksi Yorumu
    p => `Portföy büyüme endeksiniz dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) değer kazandı. Katkının %${p.impactPct}'ini ${p.topDriversNames} sundu. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Takibimiz sürüyor.'}`,

    // 22. Günlük Varlık Karnesi
    p => `Günlük varlık karnenizde portföyünüz +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) artış kaydetti. %${p.impactPct} oranıyla ${p.topDriversNames} ivmeyi sağladı. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Veriler stabil.'}`,

    // 23. FinAi Makro Analizi
    p => `FinAi makro takibi çerçevesinde portföyünüz dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) büyümüştür. ${p.topDriversNames} varlıklarınız %${p.impactPct} doğrudan etki yarattı. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Denge sürüyor.'}`,

    // 24. Sektör & Varlık Etkileşimi
    p => `Portföyünüzdeki varlık etkileşimi dünden bu yana +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) kazanç üretti. %${p.impactPct} etki ile ${p.topDriversNames} öne çıktı. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Takip devam ediyor.'}`,

    // 25. Piyasa Değerlemesi
    p => `Dünkü seans değerlemesine kıyasla portföyünüz +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) yükseldi. %${p.impactPct} pay ile ${p.topDriversNames} ana katkıyı verdi. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Gözler takvimde.'}`,

    // 26. Akıllı Portföy Özeti
    p => `Akıllı portföy takibinizde dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) artış kaydedildi. %${p.impactPct} katkıyı ${p.topDriversNames} sağladı. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Seyir olumlu.'}`,

    // 27. Seans Kapanış Analizi
    p => `Seans kapanış verilerine göre portföyünüz dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) artış gösterdi. %${p.impactPct} ivme ${p.topDriversNames} kaynaklıdır. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Piyasalar izleniyor.'}`,

    // 28. Varlık Dağılım Bülteni
    p => `Varlık dağılımınız dünden bu yana +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) değer kazandı. %${p.impactPct} oranında ${p.topDriversNames} liderlik etti. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Denge korunmaktadır.'}`,

    // 29. FinAi Momentum Notu
    p => `FinAi momentum notu: Portföyünüz dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) yükselmiştir. %${p.impactPct} pay sahibi olan ${p.topDriversNames} ana güç oldu. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Gelişmeler takipte.'}`,

    // 30. Genel Değerlendirme
    p => `Genel değerlendirmede portföyünüz dünden bugüne +₺${p.diffValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (+%${p.diffPercent.toFixed(2)}) değer kazanmıştır. Bu büyümeyi sağlayan ana unsurlar ${p.topDriversNames} varlıklarınız olmuş; bu varlıklar yükselişe yaklaşık %${p.impactPct} oranında doğrudan etki etmiştir. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Varlıklarınız dengeli seyrini korumaktadır.'}`
];

// Negatif / Gerileme Yönlü Şablonlar
export const NEGATIVE_TEMPLATES: ((p: NarrativeParams) => string)[] = [
    p => `Portföyünüz dünden bugüne -₺${Math.abs(p.diffValue).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (-%${Math.abs(p.diffPercent).toFixed(2)}) gerilemiştir. Bu harekette en belirgin düşüş baskısını ${p.topDriversNames} varlıklarınız oluşturmuştur. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Piyasa dalgalanmaları yakından takip edilmektedir.'}`,
    p => `Son 24 saatte portföyünüz -₺${Math.abs(p.diffValue).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (-%${Math.abs(p.diffPercent).toFixed(2)}) kısıtlı bir geri çekilme yaşadı. Düzeltmenin ana kaynağı ${p.topDriversNames} pozisyonlarınız oldu. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Piyasa dengesi izleniyor.'}`,
    p => `Portföyünüz dünkü seans kapanışına kıyasla -₺${Math.abs(p.diffValue).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (-%${Math.abs(p.diffPercent).toFixed(2)}) miktarında gevşedi. ${p.topDriversNames} tarafındaki satışlar kısıtlı etki yarattı. ${p.recentNewsText ? p.recentNewsText + ' ' : ''}${p.upcomingNewsText ? p.upcomingNewsText : 'Denge takip edilmektedir.'}`
];

/**
 * Günün tarihine (gün % 30) göre her gün farklı şablon döndüren rotasyon fonksiyonu.
 */
export function getRotatedDailyNarrative(params: NarrativeParams): string {
    const today = new Date();
    const dayOfMonth = today.getDate(); // 1 - 31
    const templateIndex = (dayOfMonth - 1) % 30;

    if (!params.isPositive && params.diffValue < 0) {
        const negIndex = templateIndex % NEGATIVE_TEMPLATES.length;
        return NEGATIVE_TEMPLATES[negIndex](params);
    }

    const templateFn = POSITIVE_TEMPLATES[templateIndex] || POSITIVE_TEMPLATES[0];
    return templateFn(params);
}
