import { NextRequest, NextResponse } from 'next/server';
import { getKapUrl } from '@/lib/kap-member-map';

/**
 * KAP Link API Route — Sıfır maliyetli doğrudan yönlendirici
 *
 * Query params:
 *  - symbol: BIST sembolü (örn: THYAO, THYAO.IS)
 *  - type: 'financial' | 'disclosures' | 'fund' (varsayılan: 'disclosures')
 *
 * Önce statik mapping'den tam KAP sayfa URL'si arar.
 * Bulamazsa KAP bist-sirketler sayfasına yönlendirir (arama kutusu açık).
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const rawSymbol = searchParams.get('symbol') || '';
    const type = searchParams.get('type') || 'disclosures';

    // .IS uzantısını kaldır ve büyük harf yap
    const symbol = rawSymbol.replace(/\.IS$/i, '').toUpperCase().trim();

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol gerekli' }, { status: 400 });
    }

    // TEFAS fonu ise → KAP fon bildirim sayfası (ticker bazlı, ID gerekmez)
    if (type === 'fund') {
        const kapFundUrl = `https://www.kap.org.tr/tr/fon-bilgileri/bildirimler/${symbol}`;
        return NextResponse.redirect(kapFundUrl, 302);
    }

    // BIST hissesi → statik mapping'den tam KAP özet URL'si bul
    const exactUrl = getKapUrl(symbol, 'ozet');

    if (exactUrl) {
        // Mapping'de var → doğrudan şirket sayfasına yönlendir (örn: /ozet/1107-turk-hava-yollari-a-o)
        return NextResponse.redirect(exactUrl, 302);
    }

    // Mapping'de yok → KAP'ın BIST şirket listesine yönlendir (kullanıcı orada aratabilir)
    const fallbackUrl = `https://www.kap.org.tr/tr/bist-sirketler`;
    return NextResponse.redirect(fallbackUrl, 302);
}
