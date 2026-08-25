-- ====================================================================
-- FIX: "schema supabase_functions does not exist" & SETUP WEBHOOK TRIGGERS
-- Run this SQL in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Click Run
-- ====================================================================

-- 1. Enable the pg_net extension (required for webhooks and HTTP calls from Postgres)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Create the missing supabase_functions schema
CREATE SCHEMA IF NOT EXISTS supabase_functions;

-- 3. Create the standard Supabase HTTP request helper function
CREATE OR REPLACE FUNCTION supabase_functions.http_request(
  url text,
  method text,
  headers jsonb,
  params jsonb,
  body jsonb,
  timeout_ms integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  SELECT net.http_post(
    url := url,
    headers := headers,
    body := body,
    timeout_milliseconds := timeout_ms
  ) INTO request_id;

  RETURN jsonb_build_object('request_id', request_id);
END;
$$;

-- ====================================================================
-- 4. DIRECT DATABASE TRIGGER: NEW ORDER (INSERT) -> WAHA NOTIFICATION
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_order_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Perform asynchronous HTTP POST to Edge Function notify-new-order
  PERFORM net.http_post(
    url := 'https://pxzlpugghtcvotozroiy.supabase.co/functions/v1/notify-new-order',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4emxwdWdnaHRjdm90b3pyb2l5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzY1NDczOSwiZXhwIjoyMTAzMjMwNzM5fQ.D84wHMYNe9eDCD42Kizsl_j50Lhr3rzo086bxpGIyFA'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'orders',
      'schema', 'public',
      'record', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$;

-- Drop trigger if already exists and recreate
DROP TRIGGER IF EXISTS on_order_created_webhook ON public.orders;
CREATE TRIGGER on_order_created_webhook
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_order_webhook();


-- ====================================================================
-- 5. DIRECT DATABASE TRIGGER: ORDER READY (UPDATE) -> WAHA NOTIFICATION
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_order_ready_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only fire when status changes to 'Ready' or 'ready'
  IF (LOWER(NEW.status) = 'ready' AND LOWER(COALESCE(OLD.status, '')) != 'ready') THEN
    PERFORM net.http_post(
      url := 'https://pxzlpugghtcvotozroiy.supabase.co/functions/v1/notify-order-ready',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4emxwdWdnaHRjdm90b3pyb2l5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzY1NDczOSwiZXhwIjoyMTAzMjMwNzM5fQ.D84wHMYNe9eDCD42Kizsl_j50Lhr3rzo086bxpGIyFA'
      ),
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'orders',
        'schema', 'public',
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if already exists and recreate
DROP TRIGGER IF EXISTS on_order_ready_webhook ON public.orders;
CREATE TRIGGER on_order_ready_webhook
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_ready_webhook();

-- Done!
