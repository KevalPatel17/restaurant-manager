-- ====================================================================
-- DISABLE AUTOMATIC MULTI-STAGE STATUS WEBHOOKS (ORDER READY, ETC.)
-- Ensures NO automatic spam messages when changing status in kitchen.
-- WhatsApp messages will ONLY be sent ONE TIME when you explicitly click Send.
-- ====================================================================

-- 1. Drop the automatic Order Ready update trigger
DROP TRIGGER IF EXISTS on_order_ready_webhook ON public.orders;
DROP FUNCTION IF EXISTS public.handle_order_ready_webhook();

-- 2. Drop the automatic Insert trigger (if you only want manual button click sending)
DROP TRIGGER IF EXISTS on_order_created_webhook ON public.orders;
DROP FUNCTION IF EXISTS public.handle_new_order_webhook();

-- 3. Add a whatsapp_sent flag column to orders table to track 1-time delivery
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMP WITH TIME ZONE;

-- Done! Now messages will ONLY be sent when you click Send in the app.
