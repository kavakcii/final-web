import { CatalogCalendarEvent } from './calendar-catalog';
import { scrapeEconomicCalendar } from './calendar-scraper';
import { CalendarDbService } from './calendar-db-service';

export interface AdaptiveSyncStats {
    fetched_count: number;
    checked_count: number;
    changed_count: number;
    actual_released_count: number;
    inserted_count: number;
    updated_count: number;
    unchanged_count: number;
    failed_count: number;
    source_errors: number;
    duration_ms: number;
    status: 'success' | 'stale_rejected' | 'concurrency_locked' | 'failed';
}

// Concurrency Lock: Sunucuda aynı anda iki senkronizasyonun çalışmasını engeller
let isSyncingInFlight = false;
let lastSyncTimestampMs = 0;

/**
 * 2. ADAPTIVE MANTIK VE ON-DEMAND INTERVAL HESAPLAYICI
 * Yaklaşan olayların saatlerine göre dinamik kontrol sıklığı derecesi üretir.
 */
export function getAdaptiveCheckPriority(eventTimeIso: string, isReleased: boolean, impact: string): 'very_high' | 'high' | 'medium' | 'low' {
    if (isReleased) return 'low'; // Açıklanmış veriler düşük önceliklidir

    const nowMs = Date.now();
    const eventMs = new Date(eventTimeIso).getTime();
    const diffMinutes = (eventMs - nowMs) / (1000 * 60);

    // Olay henüz gerçekleşmedi (Gelecek Olay)
    if (diffMinutes > 60) return 'low';
    if (diffMinutes >= 30 && diffMinutes <= 60) return 'medium';
    if (diffMinutes >= 10 && diffMinutes < 30) return 'high';
    if (diffMinutes >= 0 && diffMinutes < 10) return 'very_high';

    // Olay zamanı geçti ama henüz actual gelmedi (T0 -> T+30 Takibi)
    const passedMinutes = Math.abs(diffMinutes);
    if (passedMinutes <= 10) return 'very_high';
    if (passedMinutes <= 30) return 'high';

    return 'low'; // 30 dakikadan uzun süre geçtiyse normal/düşük moda dön
}

/**
 * ADAPTIVE LIVE SYNC ENGINE (MERKEZİ SUNUCU SENKRONİZASYON MOTORU)
 */
export async function runAdaptiveLiveSync(): Promise<AdaptiveSyncStats> {
    const startTimeMs = performance.now();
    const nowIso = new Date().toISOString();

    // 11. Concurrency Lock Kontrolü (10 saniye içinde iki istek girerse lock uygula)
    if (isSyncingInFlight || (Date.now() - lastSyncTimestampMs < 5000)) {
        console.log("[CALENDAR ADAPTIVE SYNC] Concurrency lock active, skipping execution.");
        return {
            fetched_count: 0,
            checked_count: 0,
            changed_count: 0,
            actual_released_count: 0,
            inserted_count: 0,
            updated_count: 0,
            unchanged_count: 0,
            failed_count: 0,
            source_errors: 0,
            duration_ms: 0,
            status: 'concurrency_locked'
        };
    }

    isSyncingInFlight = true;
    lastSyncTimestampMs = Date.now();

    let fetched_count = 0;
    let checked_count = 0;
    let changed_count = 0;
    let actual_released_count = 0;
    let inserted_count = 0;
    let updated_count = 0;
    let unchanged_count = 0;
    let failed_count = 0;
    let source_errors = 0;

    try {
        // 1. Kaynaktan Canlı Verileri Çek
        const events: CatalogCalendarEvent[] = await scrapeEconomicCalendar();
        fetched_count = events.length;

        // 17. Stale Data Koruması (Normalde ~40+ event beklenir, <5 gelirse veri bozuk/eksiktir, reddet)
        if (!events || events.length < 5) {
            console.warn("[CALENDAR ADAPTIVE SYNC WARNING] Source returned abnormally small dataset. Stale data protection triggered.");
            isSyncingInFlight = false;
            return {
                fetched_count,
                checked_count: 0,
                changed_count: 0,
                actual_released_count: 0,
                inserted_count: 0,
                updated_count: 0,
                unchanged_count: 0,
                failed_count: 0,
                source_errors: 1,
                duration_ms: Math.round(performance.now() - startTimeMs),
                status: 'stale_rejected'
            };
        }

        checked_count = events.length;

        // 8. Sadece Değişen Verileri Veritabanına Güncelle (Smart DB Upsert)
        for (const ev of events) {
            const isActualReleased = ev.actual !== undefined && ev.actual !== 'Bekleniyor' && ev.actual !== '-';
            if (isActualReleased) actual_released_count++;

            const res = await CalendarDbService.saveOrUpdateEvent(ev);
            if (res.status === 'inserted') {
                inserted_count++;
                changed_count++;
            } else if (res.status === 'updated') {
                updated_count++;
                changed_count++;
            } else if (res.status === 'unchanged') {
                unchanged_count++;
            } else if (res.status === 'failed') {
                failed_count++;
            }
        }

        const duration_ms = Math.round(performance.now() - startTimeMs);
        console.log(`[CALENDAR LIVE SYNC COMPLETED in ${duration_ms}ms] Checked: ${checked_count}, Actual Released: ${actual_released_count}, Updated: ${updated_count}, Inserted: ${inserted_count}`);

        isSyncingInFlight = false;
        return {
            fetched_count,
            checked_count,
            changed_count,
            actual_released_count,
            inserted_count,
            updated_count,
            unchanged_count,
            failed_count,
            source_errors: 0,
            duration_ms,
            status: 'success'
        };
    } catch (err) {
        console.error("[CALENDAR ADAPTIVE SYNC ERROR]", err);
        isSyncingInFlight = false;
        return {
            fetched_count: 0,
            checked_count: 0,
            changed_count: 0,
            actual_released_count: 0,
            inserted_count: 0,
            updated_count: 0,
            unchanged_count: 0,
            failed_count: 1,
            source_errors: 1,
            duration_ms: Math.round(performance.now() - startTimeMs),
            status: 'failed'
        };
    }
}
