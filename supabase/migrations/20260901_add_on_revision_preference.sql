-- Add on_revision column to notification_preferences table
-- Default value is true for backward compatibility and seamless user experience

ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS on_revision BOOLEAN NOT NULL DEFAULT true;
