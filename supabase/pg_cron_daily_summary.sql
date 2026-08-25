-- ====================================================================
-- SUPABASE PG_CRON SETUP: DAILY SUMMARY WHATSAPP NOTIFICATION
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ====================================================================

-- Step 1: Enable required extensions (pg_cron for scheduling, pg_net for HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Step 2: Unschedule any previous daily summary job to avoid duplicate triggers
SELECT cron.unschedule('daily-whatsapp-summary') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-whatsapp-summary'
);

-- Step 3: Schedule the daily summary job to run every night at 11:00 PM IST (17:30 UTC)
-- Cron expression: '30 17 * * *' (Minute 30, Hour 17 UTC = 11:00 PM IST)
-- Replace [project-ref] with your Supabase Project Reference (pxzlpugghtcvotozroiy)
-- Replace [anon-key] with your Supabase Anon/Service Key
SELECT cron.schedule(
  'daily-whatsapp-summary',
  '30 17 * * *',
  $$
  SELECT net.http_post(
    url := 'https://pxzlpugghtcvotozroiy.supabase.co/functions/v1/daily-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4emxwdWdnaHRjdm90b3pyb2l5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzY1NDczOSwiZXhwIjoyMTAzMjMwNzM5fQ.D84wHMYNe9eDCD42Kizsl_j50Lhr3rzo086bxpGIyFA'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Step 4: Verify scheduled jobs in pg_cron
SELECT jobid, jobname, schedule, active, command FROM cron.job;
