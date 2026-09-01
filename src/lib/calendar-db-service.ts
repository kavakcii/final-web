import { createClient } from '@supabase/supabase-js';
import { CatalogCalendarEvent } from './calendar-catalog';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
);

export interface DbEconomicCalendarEvent {
    id: string;                      // Deterministik Benzersiz ID (e.g. tr_tufe_2026-09-01_1000)
    source_id?: string;               // Kaynak ID (ForexFactory)
    event_date: string;              // YYYY-MM-DD (Gerçek Tarih)
    event_time: string;              // HH:mm (TSİ)
    country_code: string;            // TR, ABD, EU, UK
    flag: string;                    // Emoji 🇹🇷, 🇺🇸, 🇪🇺, 🇬🇧
    event_name: string;              // Gösterge / Haber Adı
    impact_level: 'low' | 'medium' | 'high' | 'critical';
    previous_value?: string;
    forecast_value?: string;
    actual_value?: string | null;     // Henüz açıklanmadıysa null / 'Bekleniyor'
    is_released: boolean;             // Veri açıklandı mı?
    created_at?: string;
    updated_at?: string;
    last_checked_at?: string;
}

/**
 * 3. BENZERSİZ EKONOMİK OLAY KİMLİĞİ ÜRETİCİ
 * Aynı ülke ve aynı saatte birden fazla farklı ekonomik gösterge açıklandığında
 * (Örn: TR 10:00'da hem Aylık TÜFE, hem Yıllık Enflasyon, hem ÜFE)
 * çakışmayı önleyen deterministik ID oluşturucu.
 */
export function generateDeterministicEventId(country: string, eventName: string, dateFormatted: string, time: string): string {
    const parts = dateFormatted.split('.');
    const isoDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateFormatted;
    
    const slugName = eventName
        .toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    return `${country.toLowerCase()}_${slugName}_${isoDate}_${time.replace(':', '')}`;
}

/**
 * DD.MM.YYYY formatındaki tarihi YYYY-MM-DD formatına dönüştürür.
 */
export function formatToIsoDate(dateFormatted: string): string {
    const parts = dateFormatted.split('.');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateFormatted;
}

export const CalendarDbService = {
    /**
     * 8. VERİ GÜNCELLEME VE DUPLICATE KORUMA MANTIĞI
     * Aynı olay tekrar çekildiğinde yeni kayıt açmaz, mevcut kaydı günceller.
     * Revizyon takibi yapar (Previous/Actual değiştiğinde updated_at güncellenir).
     */
    saveOrUpdateEvent: async (event: CatalogCalendarEvent): Promise<boolean> => {
        try {
            const isoDate = formatToIsoDate(event.dateFormatted);
            const eventId = event.id && !event.id.includes('_1') ? event.id : generateDeterministicEventId(event.country, event.event, event.dateFormatted, event.time);
            
            const isReleased = event.actual !== undefined && event.actual !== 'Bekleniyor' && event.actual !== '-';
            const actualVal = isReleased ? event.actual : null;

            const nowIso = new Date().toISOString();

            const dbPayload: DbEconomicCalendarEvent = {
                id: eventId,
                event_date: isoDate,
                event_time: event.time,
                country_code: event.country,
                flag: event.flag || '🏳️',
                event_name: event.event,
                impact_level: event.impact || 'medium',
                previous_value: event.previous,
                forecast_value: event.forecast,
                actual_value: actualVal,
                is_released: isReleased,
                last_checked_at: nowIso,
                updated_at: nowIso
            };

            // 1. Mevcut kaydı kontrol et
            const { data: existing } = await supabaseAdmin
                .from('economic_calendar_events')
                .select('*')
                .eq('id', eventId)
                .maybeSingle();

            if (existing) {
                // Değişen alan var mı kontrol et (Revizyon Takibi)
                const isUpdated = existing.actual_value !== actualVal || 
                                  existing.forecast_value !== event.forecast || 
                                  existing.previous_value !== event.previous;

                if (isUpdated) {
                    await supabaseAdmin
                        .from('economic_calendar_events')
                        .update({
                            actual_value: actualVal,
                            forecast_value: event.forecast,
                            previous_value: event.previous,
                            is_released: isReleased,
                            updated_at: nowIso,
                            last_checked_at: nowIso
                        })
                        .eq('id', eventId);
                } else {
                    await supabaseAdmin
                        .from('economic_calendar_events')
                        .update({ last_checked_at: nowIso })
                        .eq('id', eventId);
                }
            } else {
                // Yeni kayıt oluştur
                await supabaseAdmin
                    .from('economic_calendar_events')
                    .insert([{ ...dbPayload, created_at: nowIso }]);
            }

            return true;
        } catch (e) {
            // Veritabanı hatası durumunda uygulamanın çökmesini engeller
            console.error("Calendar DB sync info:", e);
            return false;
        }
    },

    /**
     * Toplu Veri Senkronizasyonu
     */
    batchSaveEvents: async (events: CatalogCalendarEvent[]) => {
        for (const ev of events) {
            await CalendarDbService.saveOrUpdateEvent(ev);
        }
    },

    /**
     * 4. TARİH BAZLI VERİ SORGULAMA (28 Günlük veya Belirli Tarih Aralığı)
     */
    getEventsByDateRange: async (startDateIso: string, endDateIso: string): Promise<DbEconomicCalendarEvent[]> => {
        try {
            const { data, error } = await supabaseAdmin
                .from('economic_calendar_events')
                .select('*')
                .gte('event_date', startDateIso)
                .lte('event_date', endDateIso)
                .order('event_date', { ascending: true })
                .order('event_time', { ascending: true });

            if (error || !data) return [];
            return data;
        } catch {
            return [];
        }
    }
};
