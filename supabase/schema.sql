-- ============================================================
-- ADVA CRM — Supabase Schema
-- Run this in Supabase → SQL Editor to set up all tables
-- ============================================================

-- Partners (created first — properties references it)
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  role text
);

-- Properties (leads)
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  address text NOT NULL,
  owner_name text,
  phone text,
  email text,
  notes text,
  status text DEFAULT 'lead' CHECK (status IN ('lead','active','probate','foreclosure','auction')),
  probate_date date,
  foreclosure_date date,
  auction_date date,
  next_followup date,
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  followups jsonb DEFAULT '[]',
  docs jsonb DEFAULT '[]',
  mailing_address text,
  skip_relatives text,
  image_url text,
  beds integer,
  baths numeric,
  sqft integer,
  list_price numeric
);

-- Buyers
CREATE TABLE IF NOT EXISTS public.buyers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  company text,
  areas text,
  notes text,
  max_price numeric,
  min_price numeric,
  buyer_type text DEFAULT 'cash' CHECK (buyer_type IN ('cash','flipper','landlord','realtor','wholesaler','lender')),
  prop_types jsonb DEFAULT '[]'
);

-- Money Partners
CREATE TABLE IF NOT EXISTS public.money_partners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  name text NOT NULL,
  company text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  zip text,
  mailing_address text,
  phone2 text,
  phone2_label text,
  email2 text,
  website text,
  partner_type text,
  partner_types jsonb DEFAULT '[]',
  availability text DEFAULT 'active' CHECK (availability IN ('active','paused','deployed')),
  capital_available numeric,
  total_capital numeric,
  min_deal_size numeric,
  max_deal_size numeric,
  interest_rate numeric,
  points numeric,
  term_length text,
  invest_type text,
  asset_types jsonb DEFAULT '[]',
  asset_type_custom text,
  locations text,
  notes text,
  deals jsonb DEFAULT '[]',
  comm_log jsonb DEFAULT '[]'
);

-- ============================================================
-- Migration — MLS-style listing details on properties
-- (image, beds, baths, sqft, list price) for the property card/panel.
-- Safe to re-run: CREATE TABLE above is IF NOT EXISTS, so an existing
-- table needs these added explicitly.
-- ============================================================
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS beds integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS baths numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS sqft integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS list_price numeric;

-- Enable realtime on all tables.
-- Postgres has no "ADD TABLE IF NOT EXISTS" for publications, so re-running
-- this file on a DB that already has them (i.e. every time after the first
-- setup) throws 42710 "already member of publication" and aborts whatever
-- else was in the same script. Wrapped so the whole file is safely re-runnable.
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.partners;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.buyers;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.money_partners;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
