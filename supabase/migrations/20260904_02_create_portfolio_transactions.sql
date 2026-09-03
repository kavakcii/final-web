-- Migration: Create portfolio_transactions Append-Only Ledger Table
-- File: supabase/migrations/20260904_02_create_portfolio_transactions.sql
-- Description: Creates the financial transaction ledger table, constraints, indexes, and RLS read policy.

BEGIN;

-- 1. Create portfolio_transactions Table
CREATE TABLE IF NOT EXISTS public.portfolio_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (
        transaction_type IN (
            'BUY',
            'SELL',
            'OPENING_BALANCE',
            'CASH_DEPOSIT',
            'CASH_WITHDRAW',
            'REVERSAL'
        )
    ),
    symbol TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (
        asset_type IN (
            'STOCK',
            'FUND',
            'CRYPTO',
            'GOLD',
            'CASH'
        )
    ),
    quantity NUMERIC(18,6) NOT NULL CHECK (quantity >= 0),
    unit_price NUMERIC(18,4) NOT NULL CHECK (unit_price >= 0),
    gross_amount NUMERIC(18,4) NOT NULL CHECK (gross_amount >= 0),
    commission_fee NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (commission_fee >= 0),
    tax_fee NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (tax_fee >= 0),
    net_amount NUMERIC(18,4) NOT NULL CHECK (net_amount >= 0),
    cost_basis NUMERIC(18,4) DEFAULT NULL,
    realized_pnl NUMERIC(18,4) DEFAULT NULL,
    reversal_of_transaction_id UUID REFERENCES public.portfolio_transactions(id),
    is_reversed BOOLEAN NOT NULL DEFAULT FALSE,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 2. Unique Partial Index for One-Time Reversal Enforcement
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_tx_unique_reversal 
ON public.portfolio_transactions(reversal_of_transaction_id)
WHERE reversal_of_transaction_id IS NOT NULL;

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_tx_user_date 
ON public.portfolio_transactions(user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_tx_user_symbol_date 
ON public.portfolio_transactions(user_id, symbol, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_tx_user_type_date 
ON public.portfolio_transactions(user_id, transaction_type, transaction_date DESC);

-- 4. Row Level Security (RLS)
ALTER TABLE public.portfolio_transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to SELECT only their own transactions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'portfolio_transactions' AND policyname = 'Users can view own transactions'
    ) THEN
        CREATE POLICY "Users can view own transactions" 
        ON public.portfolio_transactions FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Append-Only Ledger Security: No client direct INSERT, UPDATE, or DELETE policies exist.
-- Writes are strictly restricted to backend SECURITY DEFINER RPCs.

COMMIT;
