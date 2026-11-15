-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20261113124500_create_enquiry_tables
-- Purpose  : Create the three RASAM enquiry tables with RLS policies.
--
-- Security model (explained)
-- ──────────────────────────
-- All three tables enable Row Level Security. The only allowed operations for
-- anonymous (unauthenticated) visitors are INSERT — they can submit a row but
-- they can NEVER read, modify, or delete any row, including the one they just
-- submitted. This is enforced at the database level regardless of what any
-- application code does.
--
-- Admin access is handled via Supabase's service-role key, which bypasses RLS
-- entirely. The service-role key must ONLY be used in a secure server
-- environment (e.g. a separate admin dashboard, a cron job, or the Supabase
-- Dashboard itself) — it is NEVER deployed to this Next.js app.
--
-- To grant read access to a named Supabase user/role instead of using the
-- service-role key, add a SELECT policy like:
--   CREATE POLICY "admin_read" ON public.<table>
--     FOR SELECT TO authenticated
--     USING (auth.jwt() ->> 'email' = 'admin@example.com');
-- Or use Supabase's built-in role system (custom claims / RBAC).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. business_enquiries ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.business_enquiries (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL    DEFAULT now(),

  -- Contact
  contact_person   text        NOT NULL,
  business_name    text        NOT NULL,
  business_email   text        NOT NULL,
  mobile_number    text        NOT NULL,

  -- Business details
  business_type    text        NOT NULL,
  business_location text       NOT NULL,
  website          text,
  gstin            text,

  -- Product interest stored as a JSON array:
  --   [{ id, name, category, quantity, unit }, ...]
  products         jsonb       NOT NULL DEFAULT '[]',

  -- Free-text
  message          text,

  -- Simple triage helpers (set by admin, not the submitter)
  status           text        NOT NULL DEFAULT 'new'
                               CHECK (status IN ('new', 'in_progress', 'closed'))
);

ALTER TABLE public.business_enquiries ENABLE ROW LEVEL SECURITY;

-- Public visitors may INSERT only
CREATE POLICY "anon_insert_business_enquiry"
  ON public.business_enquiries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Nobody (other than service-role) may SELECT, UPDATE, or DELETE
-- (no permissive SELECT/UPDATE/DELETE policies → access denied)

-- ── 2. general_enquiries ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.general_enquiries (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL    DEFAULT now(),

  -- Contact
  full_name      text        NOT NULL,
  company_name   text,
  email          text        NOT NULL,
  mobile_number  text        NOT NULL,

  -- Enquiry
  enquiry_type   text        NOT NULL,
  subject        text        NOT NULL,
  message        text        NOT NULL,

  -- Triage
  status         text        NOT NULL DEFAULT 'new'
                             CHECK (status IN ('new', 'in_progress', 'closed'))
);

ALTER TABLE public.general_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_general_enquiry"
  ON public.general_enquiries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ── 3. sample_requests ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sample_requests (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL    DEFAULT now(),

  -- Contact
  full_name      text        NOT NULL,
  company_name   text,
  email          text        NOT NULL,
  mobile_number  text        NOT NULL,
  customer_type  text        NOT NULL,

  -- Product samples: [{ id, name, category, quantity, unit }, ...]
  products       jsonb       NOT NULL DEFAULT '[]',

  -- Delivery address
  address        text        NOT NULL,
  city           text        NOT NULL,
  state          text        NOT NULL,
  pin_code       text        NOT NULL,
  country        text        NOT NULL,

  -- Free-text
  message        text,

  -- Triage
  status         text        NOT NULL DEFAULT 'new'
                             CHECK (status IN ('new', 'in_progress', 'closed', 'dispatched'))
);

ALTER TABLE public.sample_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_sample_request"
  ON public.sample_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ── Indexes for dashboard queries (optional but recommended) ──────────────────
CREATE INDEX IF NOT EXISTS idx_business_enquiries_created_at  ON public.business_enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_enquiries_status      ON public.business_enquiries (status);
CREATE INDEX IF NOT EXISTS idx_general_enquiries_created_at   ON public.general_enquiries  (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_general_enquiries_status       ON public.general_enquiries  (status);
CREATE INDEX IF NOT EXISTS idx_sample_requests_created_at     ON public.sample_requests    (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sample_requests_status         ON public.sample_requests    (status);
