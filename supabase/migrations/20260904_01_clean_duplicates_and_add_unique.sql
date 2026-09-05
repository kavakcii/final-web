-- Migration: Duplicate User Portfolios Cleanup, Cash Normalization and Unique Constraint
-- File: supabase/migrations/20260904_01_clean_duplicates_and_add_unique.sql
-- Description: Normalizes all CASH variants ('TRY_CASH', 'NAKİT') into a single 'NAKİT' symbol per user, merges duplicate asset rows, and enforces unique constraint.

BEGIN;

-- ============================================================================
-- 1. CASH / NAKİT NORMALİZASYONU (TRY_CASH ve NAKİT Birleştirmesi)
-- ============================================================================
CREATE TEMP TABLE temp_merged_cash AS
SELECT 
    user_id,
    MIN(id) AS keep_id,
    SUM(quantity) AS total_quantity,
    MIN(purchase_date) AS min_purchase_date
FROM public.user_portfolios
WHERE asset_type = 'CASH' OR symbol IN ('NAKİT', 'TRY_CASH')
GROUP BY user_id;

-- Korunan nakit satırını 'NAKİT' sembolü ve birleştirilmiş toplam miktar ile güncelle
UPDATE public.user_portfolios up
SET 
    symbol = 'NAKİT',
    asset_type = 'CASH',
    quantity = tmp.total_quantity,
    avg_cost = 1.0000,
    purchase_date = tmp.min_purchase_date
FROM temp_merged_cash tmp
WHERE up.id = tmp.keep_id;

-- Diğer mükerrer/eski nakit satırlarını (TRY_CASH dahil) sil
DELETE FROM public.user_portfolios up
USING temp_merged_cash tmp
WHERE up.user_id = tmp.user_id 
  AND (up.asset_type = 'CASH' OR up.symbol IN ('NAKİT', 'TRY_CASH'))
  AND up.id != tmp.keep_id;

DROP TABLE temp_merged_cash;

-- ============================================================================
-- 2. STOCK / FUND / CRYPTO / GOLD DUPLICATE TEMİZLİĞİ
-- ============================================================================
CREATE TEMP TABLE temp_merged_assets AS
SELECT 
    user_id,
    symbol,
    asset_type,
    MIN(id) AS keep_id,
    SUM(quantity) AS total_quantity,
    CASE 
        WHEN SUM(quantity) > 0 THEN 
            ROUND(SUM(quantity * avg_cost) / NULLIF(SUM(quantity), 0), 4)
        ELSE 0.0000
    END AS new_avg_cost,
    MIN(purchase_date) AS min_purchase_date
FROM public.user_portfolios
WHERE asset_type != 'CASH' AND symbol NOT IN ('NAKİT', 'TRY_CASH')
GROUP BY user_id, symbol, asset_type
HAVING COUNT(*) > 1;

-- Ana varlık satırını ağırlıklı ortalama maliyet ve toplam miktar ile güncelle
UPDATE public.user_portfolios up
SET 
    quantity = tmp.total_quantity,
    avg_cost = tmp.new_avg_cost,
    purchase_date = tmp.min_purchase_date
FROM temp_merged_assets tmp
WHERE up.id = tmp.keep_id;

-- Korunan dışındaki mükerrer varlık satırlarını sil
DELETE FROM public.user_portfolios up
USING temp_merged_assets tmp
WHERE up.user_id = tmp.user_id 
  AND up.symbol = tmp.symbol 
  AND up.asset_type = tmp.asset_type
  AND up.id != tmp.keep_id;

DROP TABLE temp_merged_assets;

-- ============================================================================
-- 3. UNIQUE CONSTRAINT EKLENMESİ (unique_user_asset)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_asset'
    ) THEN
        ALTER TABLE public.user_portfolios 
        ADD CONSTRAINT unique_user_asset UNIQUE (user_id, symbol, asset_type);
    END IF;
END $$;

COMMIT;
