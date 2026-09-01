import { CatalogCalendarEvent } from './calendar-catalog';

export interface CacheEntry<T> {
    data: T;
    createdAtMs: number;
    ttlMs: number;
}

export interface CacheMetrics {
    cache_hit: number;
    cache_miss: number;
    cache_age_ms: number;
    source_request: number;
    source_request_deduplicated: number;
    stale_rejected: number;
    validation_failed: number;
}

// In-Memory Storage & In-Flight Request Deduplication Map (Same Process / Instance Level)
const cacheStore = new Map<string, CacheEntry<any>>();
const inFlightPromises = new Map<string, Promise<any>>();
const MAX_CACHE_ENTRIES = 50; // Memory Safety Cap

let metrics: CacheMetrics = {
    cache_hit: 0,
    cache_miss: 0,
    cache_age_ms: 0,
    source_request: 0,
    source_request_deduplicated: 0,
    stale_rejected: 0,
    validation_failed: 0
};

/**
 * Dinamik TTL Hesaplayıcı
 * Normal veriler -> 60s TTL
 * Yaklaşan (30dk) Critical/High haberler -> 15s TTL
 * Saati dolmuş actual beklenen haberler -> 5s TTL
 */
export function calculateDynamicTTL(events?: CatalogCalendarEvent[]): number {
    if (!events || events.length === 0) return 60000;

    const nowMs = Date.now();
    let minTTL = 60000; // Varsayılan 60 Saniye

    for (const ev of events) {
        if (ev.actual && ev.actual !== 'Bekleniyor' && ev.actual !== '-') continue;

        // Tarih/Saat Kıyaslaması
        try {
            const [dayStr, monthStr, yearStr] = ev.dateFormatted.split('.').map(Number);
            const [hourStr, minStr] = ev.time.split(':').map(Number);
            const eventMs = new Date(Date.UTC(yearStr, monthStr - 1, dayStr, hourStr - 3, minStr)).getTime();
            const diffMin = (eventMs - nowMs) / (1000 * 60);

            // Saati geçmiş veya 10 dk kala critical/high haber varsa -> 5s TTL
            if (diffMin >= -30 && diffMin <= 10 && (ev.impact === 'critical' || ev.impact === 'high')) {
                return 5000;
            }
            // 30 dk kala -> 15s TTL
            if (diffMin > 10 && diffMin <= 30) {
                minTTL = Math.min(minTTL, 15000);
            }
        } catch {}
    }

    return minTTL;
}

export const CalendarCache = {
    get: <T>(key: string): T | null => {
        const entry = cacheStore.get(key);
        if (!entry) {
            metrics.cache_miss++;
            return null;
        }

        const ageMs = Date.now() - entry.createdAtMs;
        if (ageMs > entry.ttlMs) {
            // Expired cache
            cacheStore.delete(key);
            metrics.cache_miss++;
            return null;
        }

        metrics.cache_hit++;
        metrics.cache_age_ms = ageMs;
        return entry.data as T;
    },

    set: <T>(key: string, data: T, customTtlMs?: number) => {
        // Memory Leak Koruması: Sınır aşıldıysa en eski kaydı temizle
        if (cacheStore.size >= MAX_CACHE_ENTRIES) {
            const oldestKey = cacheStore.keys().next().value;
            if (oldestKey) cacheStore.delete(oldestKey);
        }

        const ttlMs = customTtlMs ?? calculateDynamicTTL(Array.isArray(data) ? data : undefined);
        cacheStore.set(key, {
            data,
            createdAtMs: Date.now(),
            ttlMs
        });
    },

    has: (key: string): boolean => {
        const entry = cacheStore.get(key);
        if (!entry) return false;
        return (Date.now() - entry.createdAtMs) <= entry.ttlMs;
    },

    invalidate: (key?: string) => {
        if (key) {
            cacheStore.delete(key);
        } else {
            cacheStore.clear();
        }
    },

    getAge: (key: string): number => {
        const entry = cacheStore.get(key);
        return entry ? Date.now() - entry.createdAtMs : -1;
    },

    // 6. IN-FLIGHT PROMISE REQUEST DEDUPLICATION (Aynı Process İçinde Eşzamanlı İstek Tekilleştirme)
    getInFlightPromise: <T>(key: string): Promise<T> | null => {
        const p = inFlightPromises.get(key);
        if (p) {
            metrics.source_request_deduplicated++;
            return p as Promise<T>;
        }
        return null;
    },

    setInFlightPromise: <T>(key: string, promise: Promise<T>): Promise<T> => {
        metrics.source_request++;
        inFlightPromises.set(key, promise);
        
        // Hata veya başarı durumunda lock garantili temizlenir
        promise.finally(() => {
            inFlightPromises.delete(key);
        });

        return promise;
    },

    clearInFlightPromise: (key: string) => {
        inFlightPromises.delete(key);
    },

    // 12. SOURCE RESPONSE VALIDATION (Anormal/Eksik Yanıt Koruması)
    validateSourceResponse: (data: any): boolean => {
        if (!Array.isArray(data)) {
            metrics.validation_failed++;
            return false;
        }
        // En az 5 haber olmalı (Anormal boş veya bozuk veriyi reddet)
        if (data.length < 5) {
            metrics.stale_rejected++;
            return false;
        }
        // Temel alan kontrolü
        const sample = data[0];
        if (!sample || !sample.event || !sample.time) {
            metrics.validation_failed++;
            return false;
        }
        return true;
    },

    getMetrics: (): CacheMetrics => ({ ...metrics })
};
