-- Add daily_morning_summary column to notification_preferences table
-- Default is true for 08:00 TSİ Daily Morning Summary Web Push notifications

ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS daily_morning_summary BOOLEAN NOT NULL DEFAULT true;

-- CRON_SECRET production environment active

