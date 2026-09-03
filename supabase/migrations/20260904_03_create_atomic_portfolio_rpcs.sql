-- Migration: Create Atomic Portfolio Transactions RPCs (Revised for Cash Sell Protection & Parameter Validation)
-- File: supabase/migrations/20260904_03_create_atomic_portfolio_rpcs.sql
-- Description: Creates execute_stock_transaction and execute_cash_transaction PostgreSQL RPC stored procedures for atomic financial operations.

BEGIN;

-- ============================================================================
-- 1. EXECUTE STOCK TRANSACTION RPC (BUY, SELL, OPENING_BALANCE)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.execute_stock_transaction(
    p_transaction_type TEXT,
    p_asset_id UUID DEFAULT NULL,
    p_symbol TEXT DEFAULT NULL,
    p_asset_type TEXT DEFAULT NULL,
    p_quantity NUMERIC DEFAULT NULL,
    p_unit_price NUMERIC DEFAULT NULL,
    p_transaction_date TIMESTAMPTZ DEFAULT NOW(),
    p_commission_fee NUMERIC DEFAULT 0,
    p_tax_fee NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_symbol TEXT;
    v_asset_type TEXT;
    v_commission NUMERIC(18,4);
    v_tax NUMERIC(18,4);
    v_gross_amount NUMERIC(18,4);
    v_net_amount NUMERIC(18,4);
    v_cost_basis NUMERIC(18,4);
    v_realized_pnl NUMERIC(18,4);
    v_current_quantity NUMERIC(18,6);
    v_current_avg_cost NUMERIC(18,4);
    v_new_quantity NUMERIC(18,6);
    v_new_avg_cost NUMERIC(18,4);
    v_cash_id UUID;
    v_cash_quantity NUMERIC(18,6);
    v_transaction_id UUID;
    v_target_asset_id UUID;
BEGIN
    -- 1. Security & Authentication Check
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Yetkisiz erişim: Kullanıcı oturumu bulunamadı.';
    END IF;

    -- 2. Input Validations
    IF p_transaction_type NOT IN ('BUY', 'SELL', 'OPENING_BALANCE') THEN
        RAISE EXCEPTION 'Geçersiz işlem tipi: %', p_transaction_type;
    END IF;

    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'Geçersiz miktar: Miktar sıfırdan büyük olmalıdır.';
    END IF;

    IF p_unit_price IS NULL OR p_unit_price <= 0 THEN
        RAISE EXCEPTION 'Geçersiz birim fiyat: Fiyat sıfırdan büyük olmalıdır.';
    END IF;

    v_commission := COALESCE(p_commission_fee, 0);
    v_tax := COALESCE(p_tax_fee, 0);

    IF v_commission < 0 OR v_tax < 0 THEN
        RAISE EXCEPTION 'Komisyon ve vergi kesintileri negatif olamaz.';
    END IF;

    v_gross_amount := ROUND(p_quantity * p_unit_price, 4);

    -- ========================================================================
    -- A. BUY TRANSACTION (ALIM İŞLEMİ)
    -- Lock Order: CASH FOR UPDATE -> POSITION FOR UPDATE
    -- ========================================================================
    IF p_transaction_type = 'BUY' THEN
        IF p_symbol IS NULL OR TRIM(p_symbol) = '' OR p_asset_type IS NULL THEN
            RAISE EXCEPTION 'BUY işlemi için geçerli bir sembol ve asset_type zorunludur.';
        END IF;

        v_symbol := UPPER(TRIM(p_symbol));
        v_asset_type := UPPER(TRIM(p_asset_type));

        IF v_asset_type NOT IN ('STOCK', 'FUND', 'CRYPTO', 'GOLD') THEN
            RAISE EXCEPTION 'Varlık alımında geçersiz tür: %. CASH kabul edilmez.', v_asset_type;
        END IF;

        v_net_amount := v_gross_amount + v_commission + v_tax;
        v_cost_basis := v_net_amount;
        v_realized_pnl := NULL;

        -- Step 1: Lock & Verify Cash Balance
        SELECT up.id, up.quantity INTO v_cash_id, v_cash_quantity
        FROM public.user_portfolios up
        WHERE up.user_id = v_user_id AND up.symbol = 'NAKİT' AND up.asset_type = 'CASH'
        FOR UPDATE;

        IF v_cash_id IS NULL OR v_cash_quantity < v_net_amount THEN
            RAISE EXCEPTION 'Yetersiz nakit bakiye! Gereken: % ₺, Mevcut: % ₺', v_net_amount, COALESCE(v_cash_quantity, 0);
        END IF;

        -- Step 2: Deduct Cash
        UPDATE public.user_portfolios up SET quantity = up.quantity - v_net_amount WHERE up.id = v_cash_id;

        -- Step 3: Lock & Update/Insert Position
        SELECT up.id, up.quantity, up.avg_cost 
        INTO v_target_asset_id, v_current_quantity, v_current_avg_cost
        FROM public.user_portfolios up
        WHERE up.user_id = v_user_id AND up.symbol = v_symbol AND up.asset_type = v_asset_type
        FOR UPDATE;

        IF v_target_asset_id IS NULL THEN
            v_new_quantity := p_quantity;
            v_new_avg_cost := ROUND(v_net_amount / p_quantity, 4);

            INSERT INTO public.user_portfolios (user_id, symbol, asset_type, quantity, avg_cost, purchase_date)
            VALUES (v_user_id, v_symbol, v_asset_type, v_new_quantity, v_new_avg_cost, p_transaction_date)
            ON CONFLICT (user_id, symbol, asset_type) DO UPDATE SET
                avg_cost = ROUND(((public.user_portfolios.quantity * public.user_portfolios.avg_cost) + EXCLUDED.quantity * EXCLUDED.avg_cost) / (public.user_portfolios.quantity + EXCLUDED.quantity), 4),
                quantity = public.user_portfolios.quantity + EXCLUDED.quantity;
        ELSE
            v_new_quantity := v_current_quantity + p_quantity;
            v_new_avg_cost := ROUND(((v_current_quantity * v_current_avg_cost) + v_net_amount) / v_new_quantity, 4);

            UPDATE public.user_portfolios up SET quantity = v_new_quantity, avg_cost = v_new_avg_cost WHERE up.id = v_target_asset_id;
        END IF;

    -- ========================================================================
    -- B. SELL TRANSACTION (SATIŞ İŞLEMİ)
    -- Lock Order: CASH FOR UPDATE -> POSITION FOR UPDATE
    -- ========================================================================
    ELSIF p_transaction_type = 'SELL' THEN
        v_net_amount := v_gross_amount - v_commission - v_tax;
        IF v_net_amount <= 0 THEN
            RAISE EXCEPTION 'Komisyon ve vergi kesintisi sonrası net satış geliri sıfır veya negatif olamaz (% ₺).', v_net_amount;
        END IF;

        -- Step 1: Lock CASH Row First
        SELECT up.id INTO v_cash_id
        FROM public.user_portfolios up
        WHERE up.user_id = v_user_id AND up.symbol = 'NAKİT' AND up.asset_type = 'CASH'
        FOR UPDATE;

        -- Step 2: Lock Target Position Second
        IF p_asset_id IS NOT NULL THEN
            SELECT up.id, up.symbol, up.asset_type, up.quantity, up.avg_cost 
            INTO v_target_asset_id, v_symbol, v_asset_type, v_current_quantity, v_current_avg_cost
            FROM public.user_portfolios up WHERE up.id = p_asset_id AND up.user_id = v_user_id FOR UPDATE;
        ELSE
            IF p_symbol IS NULL OR TRIM(p_symbol) = '' OR p_asset_type IS NULL THEN
                RAISE EXCEPTION 'SELL işlemi için geçerli p_asset_id veya (p_symbol + p_asset_type) verilmelidir.';
            END IF;

            v_symbol := UPPER(TRIM(p_symbol));
            v_asset_type := UPPER(TRIM(p_asset_type));

            SELECT up.id, up.symbol, up.asset_type, up.quantity, up.avg_cost 
            INTO v_target_asset_id, v_symbol, v_asset_type, v_current_quantity, v_current_avg_cost
            FROM public.user_portfolios up WHERE up.user_id = v_user_id AND up.symbol = v_symbol AND up.asset_type = v_asset_type FOR UPDATE;
        END IF;

        IF v_target_asset_id IS NULL THEN 
            RAISE EXCEPTION 'Satılacak varlık pozisyonu bulunamadı.'; 
        END IF;

        -- KRİTİK SELL CASH ENGELİ (ONLY STOCK, FUND, CRYPTO, GOLD CAN BE SOLD)
        IF v_asset_type NOT IN ('STOCK', 'FUND', 'CRYPTO', 'GOLD') THEN
            RAISE EXCEPTION 'SELL işlemi için geçersiz varlık türü: %. Nakit (CASH) bu fonksiyon ile satılamaz.', v_asset_type;
        END IF;

        IF p_quantity > v_current_quantity THEN 
            RAISE EXCEPTION 'Yetersiz varlık miktarı! Eldeki: %, İstenen: %', v_current_quantity, p_quantity; 
        END IF;

        v_cost_basis := ROUND(p_quantity * v_current_avg_cost, 4);
        v_realized_pnl := v_net_amount - v_cost_basis;
        v_new_quantity := v_current_quantity - p_quantity;

        IF v_new_quantity <= 0 THEN
            DELETE FROM public.user_portfolios up WHERE up.id = v_target_asset_id;
        ELSE
            UPDATE public.user_portfolios up SET quantity = v_new_quantity WHERE up.id = v_target_asset_id;
        END IF;

        -- Step 3: Credit Cash
        IF v_cash_id IS NOT NULL THEN
            UPDATE public.user_portfolios up SET quantity = up.quantity + v_net_amount WHERE up.id = v_cash_id;
        ELSE
            INSERT INTO public.user_portfolios (user_id, symbol, asset_type, quantity, avg_cost, purchase_date)
            VALUES (v_user_id, 'NAKİT', 'CASH', v_net_amount, 1.0000, p_transaction_date)
            ON CONFLICT (user_id, symbol, asset_type) DO UPDATE SET quantity = public.user_portfolios.quantity + EXCLUDED.quantity;
        END IF;

    -- ========================================================================
    -- C. OPENING BALANCE (BAŞLANGIÇ BAKİYESİ / DEKLARASYON)
    -- ========================================================================
    ELSIF p_transaction_type = 'OPENING_BALANCE' THEN
        IF p_symbol IS NULL OR TRIM(p_symbol) = '' OR p_asset_type IS NULL THEN
            RAISE EXCEPTION 'OPENING_BALANCE için geçerli bir sembol ve asset_type zorunludur.';
        END IF;

        v_symbol := UPPER(TRIM(p_symbol));
        v_asset_type := UPPER(TRIM(p_asset_type));

        IF v_asset_type NOT IN ('STOCK', 'FUND', 'CRYPTO', 'GOLD') THEN
            RAISE EXCEPTION 'Varlık deklarasyonunda geçersiz tür: %. CASH kabul edilmez.', v_asset_type;
        END IF;

        v_net_amount := v_gross_amount;
        v_cost_basis := v_gross_amount;
        v_realized_pnl := NULL;

        SELECT up.id, up.quantity, up.avg_cost INTO v_target_asset_id, v_current_quantity, v_current_avg_cost
        FROM public.user_portfolios up WHERE up.user_id = v_user_id AND up.symbol = v_symbol AND up.asset_type = v_asset_type FOR UPDATE;

        IF v_target_asset_id IS NULL THEN
            INSERT INTO public.user_portfolios (user_id, symbol, asset_type, quantity, avg_cost, purchase_date)
            VALUES (v_user_id, v_symbol, v_asset_type, p_quantity, p_unit_price, p_transaction_date)
            ON CONFLICT (user_id, symbol, asset_type) DO UPDATE SET
                avg_cost = ROUND(((public.user_portfolios.quantity * public.user_portfolios.avg_cost) + (EXCLUDED.quantity * EXCLUDED.avg_cost)) / (public.user_portfolios.quantity + EXCLUDED.quantity), 4),
                quantity = public.user_portfolios.quantity + EXCLUDED.quantity;
        ELSE
            v_new_quantity := v_current_quantity + p_quantity;
            v_new_avg_cost := ROUND(((v_current_quantity * v_current_avg_cost) + v_gross_amount) / v_new_quantity, 4);
            UPDATE public.user_portfolios up SET quantity = v_new_quantity, avg_cost = v_new_avg_cost WHERE up.id = v_target_asset_id;
        END IF;
    END IF;

    -- ========================================================================
    -- INSERT TRANSACTION LEDGER ENTRY
    -- ========================================================================
    INSERT INTO public.portfolio_transactions (
        user_id, transaction_type, symbol, asset_type, quantity, unit_price, gross_amount, commission_fee, tax_fee, net_amount, cost_basis, realized_pnl, transaction_date
    ) VALUES (
        v_user_id, p_transaction_type, v_symbol, v_asset_type, p_quantity, p_unit_price, v_gross_amount, v_commission, v_tax, v_net_amount, v_cost_basis, v_realized_pnl, p_transaction_date
    ) RETURNING id INTO v_transaction_id;

    RETURN jsonb_build_object('success', true, 'transaction_id', v_transaction_id, 'transaction_type', p_transaction_type, 'symbol', v_symbol, 'asset_type', v_asset_type, 'quantity', p_quantity, 'unit_price', p_unit_price, 'gross_amount', v_gross_amount, 'net_amount', v_net_amount, 'cost_basis', v_cost_basis, 'realized_pnl', v_realized_pnl);
END;
$$;

-- ============================================================================
-- 2. EXECUTE CASH TRANSACTION RPC (CASH_DEPOSIT, CASH_WITHDRAW)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.execute_cash_transaction(
    p_transaction_type TEXT,
    p_amount NUMERIC,
    p_transaction_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_cash_id UUID;
    v_current_cash NUMERIC(18,6);
    v_new_cash NUMERIC(18,6);
    v_transaction_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Yetkisiz erişim: Kullanıcı oturumu bulunamadı.'; END IF;

    IF p_transaction_type NOT IN ('CASH_DEPOSIT', 'CASH_WITHDRAW') THEN RAISE EXCEPTION 'Geçersiz nakit işlem tipi: %', p_transaction_type; END IF;
    IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Geçersiz nakit tutarı: Tutar sıfırdan büyük olmalıdır.'; END IF;

    SELECT up.id, up.quantity INTO v_cash_id, v_current_cash
    FROM public.user_portfolios up WHERE up.user_id = v_user_id AND up.symbol = 'NAKİT' AND up.asset_type = 'CASH' FOR UPDATE;

    IF p_transaction_type = 'CASH_WITHDRAW' THEN
        IF v_cash_id IS NULL OR v_current_cash < p_amount THEN RAISE EXCEPTION 'Yetersiz nakit bakiye! Mevcut: % ₺, Çekilmek İstenen: % ₺', COALESCE(v_current_cash, 0), p_amount; END IF;
        v_new_cash := v_current_cash - p_amount;
        UPDATE public.user_portfolios up SET quantity = v_new_cash WHERE up.id = v_cash_id;
    ELSIF p_transaction_type = 'CASH_DEPOSIT' THEN
        IF v_cash_id IS NULL THEN
            v_new_cash := p_amount;
            INSERT INTO public.user_portfolios (user_id, symbol, asset_type, quantity, avg_cost, purchase_date)
            VALUES (v_user_id, 'NAKİT', 'CASH', p_amount, 1.0000, p_transaction_date)
            ON CONFLICT (user_id, symbol, asset_type) DO UPDATE SET quantity = public.user_portfolios.quantity + EXCLUDED.quantity;
        ELSE
            v_new_cash := v_current_cash + p_amount;
            UPDATE public.user_portfolios up SET quantity = v_new_cash WHERE up.id = v_cash_id;
        END IF;
    END IF;

    INSERT INTO public.portfolio_transactions (
        user_id, transaction_type, symbol, asset_type, quantity, unit_price, gross_amount, commission_fee, tax_fee, net_amount, cost_basis, realized_pnl, transaction_date
    ) VALUES (
        v_user_id, p_transaction_type, 'NAKİT', 'CASH', p_amount, 1.0000, p_amount, 0, 0, p_amount, p_amount, NULL, p_transaction_date
    ) RETURNING id INTO v_transaction_id;

    RETURN jsonb_build_object('success', true, 'transaction_id', v_transaction_id, 'transaction_type', p_transaction_type, 'symbol', 'NAKİT', 'asset_type', 'CASH', 'amount', p_amount, 'new_cash_balance', v_new_cash);
END;
$$;

-- ============================================================================
-- 3. EXECUTE PRIVILEGES & SECURITY GRANTS
-- ============================================================================
REVOKE EXECUTE ON FUNCTION public.execute_stock_transaction FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_stock_transaction TO authenticated;

REVOKE EXECUTE ON FUNCTION public.execute_cash_transaction FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_cash_transaction TO authenticated;

COMMIT;
