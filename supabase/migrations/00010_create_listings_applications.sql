-- ============================================================
-- 00010: Public Listings & Rental Applications
-- ============================================================

-- 1. Add is_listed flag to units
ALTER TABLE public.units ADD COLUMN is_listed BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX idx_units_is_listed ON public.units(is_listed) WHERE is_listed = true;

-- 2. New enum for application status
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');

-- 3. Rental applications table
CREATE TABLE public.rental_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.landlords(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT,
    status application_status NOT NULL DEFAULT 'pending',
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rental_applications_unit_id ON public.rental_applications(unit_id);
CREATE INDEX idx_rental_applications_landlord_id ON public.rental_applications(landlord_id);
CREATE INDEX idx_rental_applications_status ON public.rental_applications(status);

CREATE TRIGGER rental_applications_updated_at BEFORE UPDATE ON public.rental_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. RLS
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;

-- Public can view listed vacant units (no auth required)
CREATE POLICY "units_public_listed" ON public.units
    FOR SELECT USING (is_listed = true AND status = 'vacant');

-- Public can view properties that have listed vacant units
CREATE POLICY "properties_public_listed" ON public.properties
    FOR SELECT USING (
        id IN (
            SELECT property_id FROM public.units
            WHERE is_listed = true AND status = 'vacant'
        )
    );

-- Anyone can insert applications
CREATE POLICY "applications_anon_insert" ON public.rental_applications
    FOR INSERT WITH CHECK (true);

-- Landlord full access to their applications
CREATE POLICY "applications_landlord_all" ON public.rental_applications
    FOR ALL USING (landlord_id = get_landlord_id());
