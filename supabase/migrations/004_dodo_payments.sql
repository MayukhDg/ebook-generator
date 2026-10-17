-- ==============================================================================
-- Migration 004: Dodo Payments Integration & Document Ingestion
-- Run this migration if you have already applied migrations 001-003.
-- ==============================================================================

-- 1. Add Dodo Payments customer & subscription tracking to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT;

-- 2. Update credit_transactions action_type check constraint to include document_ingestion
ALTER TABLE public.credit_transactions 
  DROP CONSTRAINT IF EXISTS credit_transactions_action_type_check;

ALTER TABLE public.credit_transactions 
  ADD CONSTRAINT credit_transactions_action_type_check 
  CHECK (action_type IN (
      'signup_bonus',
      'subscription_grant',
      'blueprint_generation',
      'chapter_generation',
      'chapter_revision',
      'audio_transcription',
      'document_ingestion',
      'cover_generation',
      'illustration_generation',
      'credit_purchase'
  ));
