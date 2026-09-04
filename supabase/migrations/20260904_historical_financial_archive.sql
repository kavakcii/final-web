-- ==============================================================================
-- FİNAİ AŞAMA 5B: HISTORICAL FINANCIAL ARCHIVE & PROVENANCE SCHEMA
-- Source-independent, Hybrid Indexed, Versioned Financial Database Schema
-- ==============================================================================

-- 1. RAW SOURCE PAYLOADS (Provenance / Traceability Layer)
CREATE TABLE IF NOT EXISTS raw_source_payloads (
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

CREATE INDEX IF NOT EXISTS idx_raw_source_symbol_hash ON raw_source_payloads (symbol, source, response_hash);
CREATE INDEX IF NOT EXISTS idx_raw_source_fetched_at ON raw_source_payloads (fetched_at DESC);

-- 2. FINANCIAL STATEMENT PERIODS (Canonical Financial Statements)
CREATE TABLE IF NOT EXISTS financial_statement_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(32) NOT NULL,
    company_name VARCHAR(255),
    period_type VARCHAR(16) NOT NULL, -- 'QUARTERLY' | 'ANNUAL'
    period_start DATE,
    period_end DATE NOT NULL,
    fiscal_year INT NOT NULL,
    fiscal_quarter INT NOT NULL, -- 1, 2, 3, 4 (4 for Annual)
    report_date DATE,
    
    statement_type VARCHAR(32) NOT NULL DEFAULT 'CONSOLIDATED', -- 'CONSOLIDATED' | 'STANDALONE'
    consolidation_type VARCHAR(32) NOT NULL DEFAULT 'CONSOLIDATED',
    
    currency VARCHAR(16) NOT NULL DEFAULT 'TRY',
    source_currency VARCHAR(16) NOT NULL DEFAULT 'TRY',
    reported_currency VARCHAR(16),
    unit VARCHAR(16) DEFAULT 'EXACT',
    
    source VARCHAR(64) NOT NULL,
    source_url TEXT,
    
    validation_status VARCHAR(16) NOT NULL DEFAULT 'VALID', -- 'VALID' | 'WARNING' | 'INVALID' | 'CONFLICT'
    quality_score INT DEFAULT 100,
    is_restated BOOLEAN DEFAULT FALSE,
    is_current BOOLEAN DEFAULT TRUE,
    version INT DEFAULT 1,
    
    -- Fast Access Numerical Columns: Income Statement
    revenue NUMERIC(24, 4),
    cost_of_revenue NUMERIC(24, 4),
    gross_profit NUMERIC(24, 4),
    operating_income NUMERIC(24, 4),
    ebitda NUMERIC(24, 4),
    pretax_income NUMERIC(24, 4),
    tax_expense NUMERIC(24, 4),
    net_income NUMERIC(24, 4),
    net_income_to_parent NUMERIC(24, 4),
    
    -- Fast Access Numerical Columns: Balance Sheet
    cash_and_equivalents NUMERIC(24, 4),
    total_current_assets NUMERIC(24, 4),
    total_assets NUMERIC(24, 4),
    current_liabilities NUMERIC(24, 4),
    total_liabilities NUMERIC(24, 4),
    total_equity NUMERIC(24, 4),
    parent_equity NUMERIC(24, 4),
    financial_debt NUMERIC(24, 4),
    net_debt NUMERIC(24, 4),
    
    -- Fast Access Numerical Columns: Cash Flow
    operating_cash_flow NUMERIC(24, 4),
    investing_cash_flow NUMERIC(24, 4),
    financing_cash_flow NUMERIC(24, 4),
    capital_expenditures NUMERIC(24, 4),
    free_cash_flow NUMERIC(24, 4),
    dividends_paid NUMERIC(24, 4),
    net_change_in_cash NUMERIC(24, 4),
    
    -- Fast Access Numerical Columns: Per Share / Capital
    weighted_average_shares NUMERIC(20, 2),
    diluted_weighted_average_shares NUMERIC(20, 2),
    total_shares NUMERIC(20, 2),
    circulating_shares NUMERIC(20, 2),
    free_float_shares NUMERIC(20, 2),
    eps NUMERIC(16, 4),
    diluted_eps NUMERIC(16, 4),
    bvps NUMERIC(16, 4),
    paid_in_capital NUMERIC(24, 4),
    
    -- Detailed JSONB payload archives
    income_statement_details JSONB,
    balance_sheet_details JSONB,
    cash_flow_details JSONB,
    per_share_details JSONB,
    
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique Logical Key for active versioning
CREATE UNIQUE INDEX IF NOT EXISTS idx_fsp_unique_logical_version 
ON financial_statement_periods (symbol, period_type, period_end, statement_type, version);

-- Quick lookup index for current statement time-series
CREATE INDEX IF NOT EXISTS idx_fsp_symbol_current_periods 
ON financial_statement_periods (symbol, period_type, is_current, period_end DESC);

-- Analytics & sector lookup index
CREATE INDEX IF NOT EXISTS idx_fsp_period_end_current 
ON financial_statement_periods (period_end, is_current, validation_status);

-- 3. HISTORICAL DIVIDENDS
CREATE TABLE IF NOT EXISTS historical_dividends (
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
    source VARCHAR(64) NOT NULL,
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
ON historical_dividends (symbol, ex_date, source, version);

CREATE INDEX IF NOT EXISTS idx_dividend_symbol_current_date 
ON historical_dividends (symbol, is_current, ex_date DESC);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE raw_source_payloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_statement_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_dividends ENABLE ROW LEVEL SECURITY;

-- Public can read verified current statements through API
CREATE POLICY "Public read verified statements" ON financial_statement_periods
    FOR SELECT USING (is_current = true AND validation_status != 'INVALID');

CREATE POLICY "Public read current dividends" ON historical_dividends
    FOR SELECT USING (is_current = true AND validation_status != 'INVALID');

-- Service role has full CRUD capabilities for backend workers
CREATE POLICY "Service role full access on raw_source_payloads" ON raw_source_payloads
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() IS NULL);

CREATE POLICY "Service role full access on financial_statement_periods" ON financial_statement_periods
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() IS NULL);

CREATE POLICY "Service role full access on historical_dividends" ON historical_dividends
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() IS NULL);
