-- ==============================================================================
-- FİNAİ FAZ 3: COMPREHENSIVE HISTORICAL FINANCIAL ARCHIVE & PROVENANCE SCHEMA
-- Based on FAZ 2 Data Dictionary (FAZ2_FINAI_DATA_DICTIONARY_AND_MODEL.md)
-- Supports:
-- 1. symbol_mappings (Centralized 651 BIST catalog)
-- 2. raw_source_payloads / raw_yahoo_payloads (Immutable JSONB archive with SHA-256 hash)
-- 3. financial_statement_periods (Canonical versioned multi-period statements: 54 IS, 88 BS, 49 CF)
-- 4. historical_prices (Max Daily OHLCV time-series)
-- 5. historical_dividends / dividend_events (Cash dividend events since 2000)
-- 6. split_events (Corporate action splits & capital adjustments)
-- 7. company_profiles (Rich executive & company metadata)
-- 8. ownership_snapshots (Institutional and insider holdings)
-- 9. analyst_estimates (Consensus forecasts, target prices, rating trends)
-- 10. historical_valuations (Calculated daily valuation multipliers P/E, P/B)
-- ==============================================================================

BEGIN;

-- 1. SYMBOL MAPPINGS TABLE
CREATE TABLE IF NOT EXISTS public.symbol_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finai_symbol VARCHAR(16) NOT NULL UNIQUE,
    yahoo_symbol VARCHAR(20) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(16) NOT NULL DEFAULT 'EQUITY',
    sector_category VARCHAR(32) NOT NULL DEFAULT 'INDUSTRIAL',
    yahoo_sector VARCHAR(64),
    yahoo_industry VARCHAR(64),
    bist_index VARCHAR(16) DEFAULT 'BIST ALL',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    yahoo_accessible BOOLEAN NOT NULL DEFAULT TRUE,
    last_ingested_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_symbol_mappings_active ON public.symbol_mappings(is_active, yahoo_accessible);

-- 2. RAW SOURCE PAYLOADS (Immutable Raw Archive Layer)
CREATE TABLE IF NOT EXISTS public.raw_source_payloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(64) NOT NULL,
    source_url TEXT,
    symbol VARCHAR(32) NOT NULL,
    endpoint VARCHAR(128) NOT NULL,
    response_hash VARCHAR(64) NOT NULL,
    http_status INT DEFAULT 200,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    raw_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_source_symbol_hash ON public.raw_source_payloads (symbol, source, response_hash);
CREATE INDEX IF NOT EXISTS idx_raw_source_fetched_at ON public.raw_source_payloads (fetched_at DESC);

-- View/Alias to satisfy raw_yahoo_payloads naming
CREATE OR REPLACE VIEW public.raw_yahoo_payloads AS
SELECT * FROM public.raw_source_payloads WHERE source LIKE '%YAHOO%';

-- 3. FINANCIAL STATEMENT PERIODS (Canonical Multi-Period Statements)
CREATE TABLE IF NOT EXISTS public.financial_statement_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(32) NOT NULL,
    company_name VARCHAR(255),
    period_type VARCHAR(16) NOT NULL, -- 'QUARTERLY' | 'ANNUAL'
    period_start DATE,
    period_end DATE NOT NULL,
    fiscal_year INT NOT NULL,
    fiscal_quarter INT NOT NULL, -- 1, 2, 3, 4 (4 for Annual)
    report_date DATE,
    
    statement_type VARCHAR(32) NOT NULL DEFAULT 'CONSOLIDATED',
    consolidation_type VARCHAR(32) NOT NULL DEFAULT 'CONSOLIDATED',
    
    currency VARCHAR(16) NOT NULL DEFAULT 'TRY',
    source_currency VARCHAR(16) NOT NULL DEFAULT 'TRY',
    reported_currency VARCHAR(16),
    unit VARCHAR(16) DEFAULT 'EXACT',
    
    source VARCHAR(64) NOT NULL,
    source_url TEXT,
    
    validation_status VARCHAR(16) NOT NULL DEFAULT 'VALID',
    quality_score INT DEFAULT 100,
    is_restated BOOLEAN DEFAULT FALSE,
    is_current BOOLEAN DEFAULT TRUE,
    version INT DEFAULT 1,
    
    -- Income Statement Fast Columns
    revenue NUMERIC(24, 4),
    cost_of_revenue NUMERIC(24, 4),
    gross_profit NUMERIC(24, 4),
    operating_income NUMERIC(24, 4),
    ebitda NUMERIC(24, 4),
    pretax_income NUMERIC(24, 4),
    tax_expense NUMERIC(24, 4),
    net_income NUMERIC(24, 4),
    net_income_to_parent NUMERIC(24, 4),
    
    -- Balance Sheet Fast Columns
    cash_and_equivalents NUMERIC(24, 4),
    total_current_assets NUMERIC(24, 4),
    total_assets NUMERIC(24, 4),
    current_liabilities NUMERIC(24, 4),
    total_liabilities NUMERIC(24, 4),
    total_equity NUMERIC(24, 4),
    parent_equity NUMERIC(24, 4),
    financial_debt NUMERIC(24, 4),
    net_debt NUMERIC(24, 4),
    
    -- Cash Flow Fast Columns
    operating_cash_flow NUMERIC(24, 4),
    investing_cash_flow NUMERIC(24, 4),
    financing_cash_flow NUMERIC(24, 4),
    capital_expenditures NUMERIC(24, 4),
    free_cash_flow NUMERIC(24, 4),
    dividends_paid NUMERIC(24, 4),
    net_change_in_cash NUMERIC(24, 4),
    
    -- Per Share / Capital Fast Columns
    weighted_average_shares NUMERIC(20, 2),
    diluted_weighted_average_shares NUMERIC(20, 2),
    total_shares NUMERIC(20, 2),
    circulating_shares NUMERIC(20, 2),
    free_float_shares NUMERIC(20, 2),
    eps NUMERIC(16, 4),
    diluted_eps NUMERIC(16, 4),
    bvps NUMERIC(16, 4),
    paid_in_capital NUMERIC(24, 4),
    
    -- Detailed JSONB full raw line item payloads (54 IS, 88 BS, 49 CF)
    income_statement_details JSONB,
    balance_sheet_details JSONB,
    cash_flow_details JSONB,
    per_share_details JSONB,
    
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fsp_unique_logical_version 
ON public.financial_statement_periods (symbol, period_type, period_end, statement_type, version);

CREATE INDEX IF NOT EXISTS idx_fsp_symbol_current_periods 
ON public.financial_statement_periods (symbol, period_type, is_current, period_end DESC);

-- 4. HISTORICAL PRICES (Daily OHLCV)
CREATE TABLE IF NOT EXISTS public.historical_prices (
    symbol VARCHAR(16) NOT NULL,
    interval VARCHAR(8) NOT NULL DEFAULT '1d',
    timestamp TIMESTAMPTZ NOT NULL,
    date_istanbul DATE NOT NULL,
    open NUMERIC(18,4) NOT NULL,
    high NUMERIC(18,4) NOT NULL,
    low NUMERIC(18,4) NOT NULL,
    close NUMERIC(18,4) NOT NULL,
    adjusted_close NUMERIC(18,4) NOT NULL,
    volume BIGINT NOT NULL,
    corporate_action_applied BOOLEAN DEFAULT FALSE,
    source VARCHAR(16) DEFAULT 'YAHOO_CHART',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (symbol, interval, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_hist_prices_symbol_date ON public.historical_prices(symbol, date_istanbul DESC);

-- 5. HISTORICAL DIVIDENDS / DIVIDEND EVENTS
CREATE TABLE IF NOT EXISTS public.historical_dividends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(32) NOT NULL,
    company_name VARCHAR(255),
    ex_date DATE NOT NULL,
    record_date DATE,
    payment_date DATE,
    announcement_date DATE,
    gross_amount NUMERIC(16, 6) NOT NULL,
    net_amount NUMERIC(16, 6),
    currency VARCHAR(16) NOT NULL DEFAULT 'TRY',
    source VARCHAR(64) NOT NULL DEFAULT 'YAHOO_CHART_DIV',
    source_url TEXT,
    validation_status VARCHAR(16) NOT NULL DEFAULT 'VALID',
    is_current BOOLEAN DEFAULT TRUE,
    version INT DEFAULT 1,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dividend_symbol_exdate_source_version 
ON public.historical_dividends (symbol, ex_date, source, version);

CREATE INDEX IF NOT EXISTS idx_dividend_symbol_current_date 
ON public.historical_dividends (symbol, is_current, ex_date DESC);

-- View/Alias to satisfy dividend_events naming
CREATE OR REPLACE VIEW public.dividend_events AS
SELECT * FROM public.historical_dividends;

-- 6. SPLIT EVENTS (Corporate Action Splits & Adjustments)
CREATE TABLE IF NOT EXISTS public.split_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(16) NOT NULL,
    event_date DATE NOT NULL,
    numerator NUMERIC(12,4) NOT NULL,
    denominator NUMERIC(12,4) NOT NULL,
    split_ratio VARCHAR(16) NOT NULL,
    action_type VARCHAR(24) NOT NULL DEFAULT 'STOCK_SPLIT',
    source VARCHAR(32) DEFAULT 'YAHOO_CHART_SPLIT',
    retrieved_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_split_event UNIQUE (symbol, event_date, numerator, denominator)
);

CREATE INDEX IF NOT EXISTS idx_split_events_symbol_date ON public.split_events(symbol, event_date DESC);

-- 7. COMPANY PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(16) NOT NULL UNIQUE,
    company_name VARCHAR(255),
    sector VARCHAR(64),
    industry VARCHAR(64),
    country VARCHAR(32) DEFAULT 'Turkey',
    city VARCHAR(64),
    address TEXT,
    employee_count INT,
    website_url VARCHAR(255),
    business_summary TEXT,
    executives JSONB,
    source VARCHAR(32) DEFAULT 'YAHOO_ASSET_PROFILE',
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. OWNERSHIP SNAPSHOTS TABLE
CREATE TABLE IF NOT EXISTS public.ownership_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(16) NOT NULL UNIQUE,
    insiders_held_percent NUMERIC(8,4),
    institutions_held_percent NUMERIC(8,4),
    institutions_float_percent NUMERIC(8,4),
    institutions_count INT,
    top_institutions JSONB,
    source VARCHAR(32) DEFAULT 'YAHOO_HOLDERS',
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. ANALYST ESTIMATES TABLE
CREATE TABLE IF NOT EXISTS public.analyst_estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(16) NOT NULL UNIQUE,
    target_mean_price NUMERIC(18,4),
    target_median_price NUMERIC(18,4),
    target_high_price NUMERIC(18,4),
    target_low_price NUMERIC(18,4),
    number_of_analysts INT,
    recommendation_key VARCHAR(32),
    recommendation_trend JSONB,
    earnings_forecasts JSONB,
    source VARCHAR(32) DEFAULT 'YAHOO_ANALYSIS',
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. HISTORICAL VALUATIONS TABLE
CREATE TABLE IF NOT EXISTS public.historical_valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(16) NOT NULL,
    valuation_date DATE NOT NULL,
    market_price NUMERIC(18,4) NOT NULL,
    trailing_pe NUMERIC(12,4),
    price_to_book NUMERIC(12,4),
    price_to_sales NUMERIC(12,4),
    ev_to_ebitda NUMERIC(12,4),
    market_cap NUMERIC(20,2),
    enterprise_value NUMERIC(20,2),
    matching_period_end DATE NOT NULL,
    is_calculated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_historical_valuation UNIQUE (symbol, valuation_date)
);

CREATE INDEX IF NOT EXISTS idx_hist_val_symbol_date ON public.historical_valuations(symbol, valuation_date DESC);

-- Enable RLS across all tables
ALTER TABLE public.symbol_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_source_payloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_statement_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_dividends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ownership_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyst_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_valuations ENABLE ROW LEVEL SECURITY;

-- Read policies for public/app
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'symbol_mappings' AND policyname = 'Public read symbol_mappings') THEN
        CREATE POLICY "Public read symbol_mappings" ON public.symbol_mappings FOR SELECT USING (true);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'financial_statement_periods' AND policyname = 'Public read verified statements') THEN
        CREATE POLICY "Public read verified statements" ON public.financial_statement_periods FOR SELECT USING (is_current = true AND validation_status != 'INVALID');
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historical_prices' AND policyname = 'Public read historical_prices') THEN
        CREATE POLICY "Public read historical_prices" ON public.historical_prices FOR SELECT USING (true);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historical_dividends' AND policyname = 'Public read historical_dividends') THEN
        CREATE POLICY "Public read historical_dividends" ON public.historical_dividends FOR SELECT USING (is_current = true AND validation_status != 'INVALID');
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'split_events' AND policyname = 'Public read split_events') THEN
        CREATE POLICY "Public read split_events" ON public.split_events FOR SELECT USING (true);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_profiles' AND policyname = 'Public read company_profiles') THEN
        CREATE POLICY "Public read company_profiles" ON public.company_profiles FOR SELECT USING (true);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ownership_snapshots' AND policyname = 'Public read ownership_snapshots') THEN
        CREATE POLICY "Public read ownership_snapshots" ON public.ownership_snapshots FOR SELECT USING (true);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analyst_estimates' AND policyname = 'Public read analyst_estimates') THEN
        CREATE POLICY "Public read analyst_estimates" ON public.analyst_estimates FOR SELECT USING (true);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historical_valuations' AND policyname = 'Public read historical_valuations') THEN
        CREATE POLICY "Public read historical_valuations" ON public.historical_valuations FOR SELECT USING (true);
    END IF;
END $$;

-- Backend service role full access policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'symbol_mappings' AND policyname = 'Service full access symbol_mappings') THEN
        CREATE POLICY "Service full access symbol_mappings" ON public.symbol_mappings FOR ALL USING (auth.role() = 'service_role' OR auth.role() IS NULL);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'raw_source_payloads' AND policyname = 'Service full access raw_source_payloads') THEN
        CREATE POLICY "Service full access raw_source_payloads" ON public.raw_source_payloads FOR ALL USING (auth.role() = 'service_role' OR auth.role() IS NULL);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'financial_statement_periods' AND policyname = 'Service full access financial_statement_periods') THEN
        CREATE POLICY "Service full access financial_statement_periods" ON public.financial_statement_periods FOR ALL USING (auth.role() = 'service_role' OR auth.role() IS NULL);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historical_prices' AND policyname = 'Service full access historical_prices') THEN
        CREATE POLICY "Service full access historical_prices" ON public.historical_prices FOR ALL USING (auth.role() = 'service_role' OR auth.role() IS NULL);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historical_dividends' AND policyname = 'Service full access historical_dividends') THEN
        CREATE POLICY "Service full access historical_dividends" ON public.historical_dividends FOR ALL USING (auth.role() = 'service_role' OR auth.role() IS NULL);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'split_events' AND policyname = 'Service full access split_events') THEN
        CREATE POLICY "Service full access split_events" ON public.split_events FOR ALL USING (auth.role() = 'service_role' OR auth.role() IS NULL);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_profiles' AND policyname = 'Service full access company_profiles') THEN
        CREATE POLICY "Service full access company_profiles" ON public.company_profiles FOR ALL USING (auth.role() = 'service_role' OR auth.role() IS NULL);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ownership_snapshots' AND policyname = 'Service full access ownership_snapshots') THEN
        CREATE POLICY "Service full access ownership_snapshots" ON public.ownership_snapshots FOR ALL USING (auth.role() = 'service_role' OR auth.role() IS NULL);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analyst_estimates' AND policyname = 'Service full access analyst_estimates') THEN
        CREATE POLICY "Service full access analyst_estimates" ON public.analyst_estimates FOR ALL USING (auth.role() = 'service_role' OR auth.role() IS NULL);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historical_valuations' AND policyname = 'Service full access historical_valuations') THEN
        CREATE POLICY "Service full access historical_valuations" ON public.historical_valuations FOR ALL USING (auth.role() = 'service_role' OR auth.role() IS NULL);
    END IF;
END $$;

COMMIT;
