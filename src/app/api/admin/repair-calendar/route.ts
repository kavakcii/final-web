import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scrapeEconomicCalendar } from '@/lib/calendar-scraper';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

/**
 * Geçmiş Takvim Verilerini Düzeltme & Onarım Servisi
 * Saati ve günü geçmiş ancak veritabanında/katalogda sahte "Bekleniyor" olarak kalmış
 * tüm geçmiş haberleri canlı kaynaktan çekerek gerçek açıklanan rakamlarıyla günceller.
 */
export async function GET() {
    try {
        // Canlı takvim verilerini çek
        const liveEvents = await scrapeEconomicCalendar();
        let updatedCount = 0;

        const nowTSİ = new Date().toLocaleTimeString('sv-SE', { timeZone: 'Europe/Istanbul' });
        const todayFormatted = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric' });

        for (const event of liveEvents) {
            // Saati geçmiş veya geçmiş günde kalmış ama 'Bekleniyor' olan haberler
            const isPastDay = event.dateFormatted < todayFormatted;
            const isPastTimeToday = event.dateFormatted === todayFormatted && event.time <= nowTSİ.slice(0, 5);

            if ((isPastDay || isPastTimeToday) && event.actual && event.actual !== 'Bekleniyor') {
                // Veritabanındaki ilgili kaydı güncelle
                if (event.id) {
                    const { error } = await supabaseAdmin
                        .from('economic_calendar_events')
                        .update({
                            actual: event.actual,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', event.id);

                    if (!error) updatedCount++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            updatedCount,
            totalScraped: liveEvents.length,
            message: `Geçmiş tarihlerde takılı kalmış ${updatedCount} adet haber açıklanan gerçek değerleriyle güncellendi.`
        });
    } catch (e: any) {
        console.error("Calendar repair error:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
