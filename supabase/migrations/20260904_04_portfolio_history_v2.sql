-- Migration: Upgrade portfolio_history Table to V2 Schema (Idempotent)
-- File: supabase/migrations/20260904_04_portfolio_history_v2.sql
-- Description: Adds financial analytics columns (cash_value, invested_value, realized_pnl, unrealized_pnl, external_cash_flow, daily_return_pct), UNIQUE(user_id, snapshot_date) index, and RLS policies for V2 portfolio snapshot system.

BEGIN;

-- 1. Create Base portfolio_history Table (If not exists)
CREATE TABLE IF NOT EXISTS public.portfolio_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_value NUMERIC(18,4) NOT NULL DEFAULT 0,
    cash_value NUMERIC(18,4) NOT NULL DEFAULT 0,
    invested_value NUMERIC(18,4) NOT NULL DEFAULT 0,
    total_cost NUMERIC(18,4) NOT NULL DEFAULT 0,
    realized_pnl NUMERIC(18,4) DEFAULT 0,
    unrealized_pnl NUMERIC(18,4) DEFAULT 0,
    external_cash_flow NUMERIC(18,4) DEFAULT 0,
    daily_return_pct NUMERIC(18,4) DEFAULT NULL,
    asset_count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Safely Add Missing V2 Columns (If table existed with legacy schema)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_history' AND column_name = 'cash_value') THEN
        ALTER TABLE public.portfolio_history ADD COLUMN cash_value NUMERIC(18,4) NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_history' AND column_name = 'invested_value') THEN
        ALTER TABLE public.portfolio_history ADD COLUMN invested_value NUMERIC(18,4) NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_history' AND column_name = 'realized_pnl') THEN
        ALTER TABLE public.portfolio_history ADD COLUMN realized_pnl NUMERIC(18,4) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_history' AND column_name = 'unrealized_pnl') THEN
        ALTER TABLE public.portfolio_history ADD COLUMN unrealized_pnl NUMERIC(18,4) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_history' AND column_name = 'external_cash_flow') THEN
        ALTER TABLE public.portfolio_history ADD COLUMN external_cash_flow NUMERIC(18,4) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_history' AND column_name = 'daily_return_pct') THEN
        ALTER TABLE public.portfolio_history ADD COLUMN daily_return_pct NUMERIC(18,4) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_history' AND column_name = 'created_at') THEN
        ALTER TABLE public.portfolio_history ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- 3. Unique Constraint & Index: Enforces exactly 1 snapshot per user per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_history_user_date 
ON public.portfolio_history(user_id, snapshot_date);

-- 4. Performance Index: Enables fast chronological queries per user
CREATE INDEX IF NOT EXISTS idx_portfolio_history_user_date_desc 
ON public.portfolio_history(user_id, snapshot_date DESC);

-- 5. Row Level Security (RLS) Policy
ALTER TABLE public.portfolio_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'portfolio_history' AND policyname = 'Users can view own portfolio history'
    ) THEN
        CREATE POLICY "Users can view own portfolio history" 
        ON public.portfolio_history FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
END $$;

COMMIT;
