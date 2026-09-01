-- FinAi Web Push Notification & Indicator Following Migration
-- Creates push_subscriptions, followed_indicators, notification_preferences, notification_logs

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_push_sub_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_sub_is_active ON public.push_subscriptions(is_active);

CREATE TABLE IF NOT EXISTS public.followed_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    indicator_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_indicator UNIQUE (user_id, indicator_name)
);

CREATE INDEX IF NOT EXISTS idx_followed_ind_user_id ON public.followed_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_followed_ind_name ON public.followed_indicators(indicator_name);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    min_30_before BOOLEAN NOT NULL DEFAULT false,
    min_10_before BOOLEAN NOT NULL DEFAULT true,
    on_release BOOLEAN NOT NULL DEFAULT true,
    on_update BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notif_pref_user_id ON public.notification_preferences(user_id);

CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    title TEXT,
    body TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'sent',
    error_message TEXT,
    metadata JSONB,
    CONSTRAINT unique_user_event_type UNIQUE (user_id, event_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_notif_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_logs_event_type ON public.notification_logs(event_id, notification_type);

-- Row Level Security (RLS)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followed_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own push subscriptions') THEN
        CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own followed indicators') THEN
        CREATE POLICY "Users can manage own followed indicators" ON public.followed_indicators FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own notification preferences') THEN
        CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own notification logs') THEN
        CREATE POLICY "Users can read own notification logs" ON public.notification_logs FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;
