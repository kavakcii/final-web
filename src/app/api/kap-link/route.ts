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

    // 1) Eğer Statik Listemizde Varsa (Emin olduğumuz hisseler)
    const exactUrl = getKapUrl(symbol, 'ozet');
    if (exactUrl) {
        return NextResponse.redirect(exactUrl, 302);
    }

    // 2) Kapsam Dışı İse Otomatik Arama (Yedeğin Yedeği Kap Arama Yönlendirmesi)
    const fallbackUrl = `https://www.kap.org.tr/tr/arama/sirket-arama?query=${symbol}`;
    return NextResponse.redirect(fallbackUrl, 302);
}
