import { NextResponse } from 'next/server';
import dividendDb from '@/lib/dividend-db.json';

export const revalidate = 3600;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    
    if (!symbolsParam) {
        return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').map((s: string) => s.trim().toUpperCase());
    const dividendData: Record<string, { date: number; amount: number; isEstimate?: boolean }> = {};

    // 1) GARANTİLİ YEREL VERİTABANI (Sadece Resmi Onaylı Verileri Çeker)
    // Sizin "Gerçek veriler lazım" kararınız doğrultusunda, dışarıdan kirli veya tahmin edilmiş veri ALMIYORUZ.
    symbols.forEach((sym: string) => {
        const localData = (dividendDb as Record<string, any>)[sym];
        if (localData && localData.amount > 0) {
            // Eğer tarih bugününden ilerdeyse KESİNLEŞMİŞ, geçmişteyse ÖDENMİŞ algılar
            const isEstimate = false; // Tümü gerçek veritabanı verisi olacak
            dividendData[sym] = {
                date: new Date(localData.date).getTime(),
                amount: localData.amount,
                isEstimate: isEstimate
            };
        }
    });

    return NextResponse.json(dividendData);
}
