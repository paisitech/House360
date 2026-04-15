-- ============================================================
-- House360 SaaS Platform - Complete Database Schema
-- Run this in Supabase SQL Editor as a single transaction
-- ============================================================

-- ==================== 1. ENUMS ====================

CREATE TYPE user_role AS ENUM ('landlord', 'tenant');
CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'mixed');
CREATE TYPE unit_status AS ENUM ('vacant', 'occupied', 'maintenance');
CREATE TYPE lease_status AS ENUM ('active', 'expired', 'terminated', 'pending');
CREATE TYPE rent_cycle_status AS ENUM ('due', 'paid', 'late', 'pending_verification', 'failed', 'partial');
CREATE TYPE payment_method AS ENUM ('bkash', 'nagad', 'rocket', 'card', 'bank_transfer', 'manual');
CREATE TYPE payment_status AS ENUM ('initiated', 'success', 'failed', 'cancelled', 'refunded');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE reminder_type AS ENUM ('upcoming_due', 'overdue', 'payment_received', 'verification_needed');
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');


-- ==================== 2. USERS & LANDLORDS ====================

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.landlords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT,
    address TEXT,
    nid_number TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'free',
    max_properties INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_landlords_user_id ON public.landlords(user_id);

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER landlords_updated_at BEFORE UPDATE ON public.landlords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ==================== 3. PROPERTIES & UNITS ====================

CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES public.landlords(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    area TEXT,
    property_type property_type NOT NULL DEFAULT 'residential',
    total_units INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.landlords(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    floor INTEGER,
    bedrooms INTEGER NOT NULL DEFAULT 1,
    bathrooms INTEGER NOT NULL DEFAULT 1,
    area_sqft NUMERIC,
    monthly_rent NUMERIC(12,2) NOT NULL,
    status unit_status NOT NULL DEFAULT 'vacant',
    is_listed BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(property_id, unit_number)
);

CREATE INDEX idx_properties_landlord_id ON public.properties(landlord_id);
CREATE INDEX idx_units_property_id ON public.units(property_id);
CREATE INDEX idx_units_landlord_id ON public.units(landlord_id);
CREATE INDEX idx_units_status ON public.units(status);
CREATE INDEX idx_units_is_listed ON public.units(is_listed) WHERE is_listed = true;

CREATE TRIGGER properties_updated_at BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER units_updated_at BEFORE UPDATE ON public.units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ==================== 4. TENANTS & LEASES ====================

CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE SET NULL,
    landlord_id UUID NOT NULL REFERENCES public.landlords(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    nid_number TEXT,
    emergency_contact TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.landlords(id) ON DELETE CASCADE,
    monthly_rent NUMERIC(12,2) NOT NULL,
    security_deposit NUMERIC(12,2) NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE,
    rent_due_day INTEGER NOT NULL DEFAULT 1 CHECK (rent_due_day BETWEEN 1 AND 28),
    advance_months INTEGER NOT NULL DEFAULT 0,
    status lease_status NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenants_landlord_id ON public.tenants(landlord_id);
CREATE INDEX idx_tenants_user_id ON public.tenants(user_id);
CREATE INDEX idx_leases_tenant_id ON public.leases(tenant_id);
CREATE INDEX idx_leases_unit_id ON public.leases(unit_id);
CREATE INDEX idx_leases_landlord_id ON public.leases(landlord_id);
CREATE INDEX idx_leases_status ON public.leases(status);

CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER leases_updated_at BEFORE UPDATE ON public.leases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ==================== 5. RENT CYCLES & PAYMENTS ====================

CREATE TABLE public.rent_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.landlords(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    amount_due NUMERIC(12,2) NOT NULL,
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    status rent_cycle_status NOT NULL DEFAULT 'due',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(lease_id, period_start)
);

CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rent_cycle_id UUID NOT NULL REFERENCES public.rent_cycles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.landlords(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    payment_method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'initiated',
    tran_id TEXT UNIQUE,
    val_id TEXT,
    bank_tran_id TEXT,
    card_type TEXT,
    card_brand TEXT,
    gateway_response JSONB,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rent_cycles_lease_id ON public.rent_cycles(lease_id);
CREATE INDEX idx_rent_cycles_tenant_id ON public.rent_cycles(tenant_id);
CREATE INDEX idx_rent_cycles_landlord_id ON public.rent_cycles(landlord_id);
CREATE INDEX idx_rent_cycles_status ON public.rent_cycles(status);
CREATE INDEX idx_rent_cycles_due_date ON public.rent_cycles(due_date);
CREATE INDEX idx_payments_rent_cycle_id ON public.payments(rent_cycle_id);
CREATE INDEX idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX idx_payments_landlord_id ON public.payments(landlord_id);
CREATE INDEX idx_payments_tran_id ON public.payments(tran_id);
CREATE INDEX idx_payments_status ON public.payments(status);

CREATE TRIGGER rent_cycles_updated_at BEFORE UPDATE ON public.rent_cycles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ==================== 6. MANUAL PAYMENTS & REMINDERS ====================

CREATE TABLE public.manual_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL UNIQUE REFERENCES public.payments(id) ON DELETE CASCADE,
    screenshot_url TEXT NOT NULL,
    transaction_reference TEXT,
    sender_number TEXT,
    verification_status verification_status NOT NULL DEFAULT 'pending',
    verified_by UUID REFERENCES public.users(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rent_cycle_id UUID NOT NULL REFERENCES public.rent_cycles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.landlords(id) ON DELETE CASCADE,
    reminder_type reminder_type NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_manual_payments_payment_id ON public.manual_payments(payment_id);
CREATE INDEX idx_manual_payments_verification_status ON public.manual_payments(verification_status);
CREATE INDEX idx_reminders_tenant_id ON public.reminders(tenant_id);
CREATE INDEX idx_reminders_landlord_id ON public.reminders(landlord_id);
CREATE INDEX idx_reminders_rent_cycle_id ON public.reminders(rent_cycle_id);

CREATE TRIGGER manual_payments_updated_at BEFORE UPDATE ON public.manual_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ==================== 6b. RENTAL APPLICATIONS ====================

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


-- ==================== 7. ROW LEVEL SECURITY ====================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's landlord_id
CREATE OR REPLACE FUNCTION get_landlord_id()
RETURNS UUID AS $$
    SELECT id FROM public.landlords WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- USERS
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- LANDLORDS
CREATE POLICY "landlords_select_own" ON public.landlords
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "landlords_update_own" ON public.landlords
    FOR UPDATE USING (user_id = auth.uid());

-- PROPERTIES
CREATE POLICY "properties_landlord_all" ON public.properties
    FOR ALL USING (landlord_id = get_landlord_id());
CREATE POLICY "properties_public_listed" ON public.properties
    FOR SELECT USING (
        id IN (
            SELECT property_id FROM public.units
            WHERE is_listed = true AND status = 'vacant'
        )
    );

-- UNITS
CREATE POLICY "units_landlord_all" ON public.units
    FOR ALL USING (landlord_id = get_landlord_id());
CREATE POLICY "units_public_listed" ON public.units
    FOR SELECT USING (is_listed = true AND status = 'vacant');
CREATE POLICY "units_tenant_select" ON public.units
    FOR SELECT USING (
        id IN (
            SELECT l.unit_id FROM public.leases l
            JOIN public.tenants t ON t.id = l.tenant_id
            WHERE t.user_id = auth.uid() AND l.status = 'active'
        )
    );

-- TENANTS
CREATE POLICY "tenants_landlord_all" ON public.tenants
    FOR ALL USING (landlord_id = get_landlord_id());
CREATE POLICY "tenants_self_select" ON public.tenants
    FOR SELECT USING (user_id = auth.uid());

-- LEASES
CREATE POLICY "leases_landlord_all" ON public.leases
    FOR ALL USING (landlord_id = get_landlord_id());
CREATE POLICY "leases_tenant_select" ON public.leases
    FOR SELECT USING (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE user_id = auth.uid()
        )
    );

-- RENT CYCLES
CREATE POLICY "rent_cycles_landlord_all" ON public.rent_cycles
    FOR ALL USING (landlord_id = get_landlord_id());
CREATE POLICY "rent_cycles_tenant_select" ON public.rent_cycles
    FOR SELECT USING (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "rent_cycles_tenant_update" ON public.rent_cycles
    FOR UPDATE USING (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE user_id = auth.uid()
        )
    );

-- PAYMENTS
CREATE POLICY "payments_landlord_all" ON public.payments
    FOR ALL USING (landlord_id = get_landlord_id());
CREATE POLICY "payments_tenant_select" ON public.payments
    FOR SELECT USING (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "payments_tenant_insert" ON public.payments
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE user_id = auth.uid()
        )
    );

-- MANUAL PAYMENTS
CREATE POLICY "manual_payments_landlord_all" ON public.manual_payments
    FOR ALL USING (
        payment_id IN (
            SELECT id FROM public.payments WHERE landlord_id = get_landlord_id()
        )
    );
CREATE POLICY "manual_payments_tenant_insert" ON public.manual_payments
    FOR INSERT WITH CHECK (
        payment_id IN (
            SELECT id FROM public.payments
            WHERE tenant_id IN (
                SELECT id FROM public.tenants WHERE user_id = auth.uid()
            )
        )
    );
CREATE POLICY "manual_payments_tenant_select" ON public.manual_payments
    FOR SELECT USING (
        payment_id IN (
            SELECT id FROM public.payments
            WHERE tenant_id IN (
                SELECT id FROM public.tenants WHERE user_id = auth.uid()
            )
        )
    );

-- REMINDERS
CREATE POLICY "reminders_landlord_all" ON public.reminders
    FOR ALL USING (landlord_id = get_landlord_id());
CREATE POLICY "reminders_tenant_select" ON public.reminders
    FOR SELECT USING (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "reminders_tenant_update" ON public.reminders
    FOR UPDATE USING (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE user_id = auth.uid()
        )
    );


-- RENTAL APPLICATIONS
CREATE POLICY "applications_anon_insert" ON public.rental_applications
    FOR INSERT WITH CHECK (true);
CREATE POLICY "applications_landlord_all" ON public.rental_applications
    FOR ALL USING (landlord_id = get_landlord_id());


-- ==================== 8. DATABASE FUNCTIONS ====================

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role_value user_role;
    user_full_name TEXT;
    role_text TEXT;
BEGIN
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
    role_text := COALESCE(NEW.raw_user_meta_data->>'role', '');

    IF role_text = 'landlord' THEN
        user_role_value := 'landlord'::user_role;
    ELSE
        user_role_value := 'tenant'::user_role;
    END IF;

    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        user_full_name,
        user_role_value
    );

    IF user_role_value = 'landlord' THEN
        INSERT INTO public.landlords (user_id) VALUES (NEW.id);
    END IF;

    IF user_role_value = 'tenant' AND NEW.email IS NOT NULL THEN
        UPDATE public.tenants
        SET user_id = NEW.id
        WHERE email = NEW.email AND user_id IS NULL;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Generate monthly rent cycles (called by cron)
CREATE OR REPLACE FUNCTION generate_rent_cycles(target_month DATE)
RETURNS INTEGER AS $$
DECLARE
    cycles_created INTEGER := 0;
    lease RECORD;
    period_s DATE;
    period_e DATE;
    due DATE;
BEGIN
    period_s := date_trunc('month', target_month)::DATE;
    period_e := (period_s + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

    FOR lease IN
        SELECT l.*
        FROM public.leases l
        WHERE l.status = 'active'
          AND l.start_date <= period_e
          AND (l.end_date IS NULL OR l.end_date >= period_s)
    LOOP
        due := period_s + (lease.rent_due_day - 1);

        IF NOT EXISTS (
            SELECT 1 FROM public.rent_cycles
            WHERE lease_id = lease.id AND period_start = period_s
        ) THEN
            INSERT INTO public.rent_cycles
                (lease_id, tenant_id, landlord_id, unit_id, period_start, period_end, due_date, amount_due)
            VALUES
                (lease.id, lease.tenant_id, lease.landlord_id, lease.unit_id, period_s, period_e, due, lease.monthly_rent);
            cycles_created := cycles_created + 1;
        END IF;
    END LOOP;

    RETURN cycles_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark overdue rent cycles
CREATE OR REPLACE FUNCTION mark_overdue_cycles()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.rent_cycles
    SET status = 'late', updated_at = now()
    WHERE status = 'due'
      AND due_date < CURRENT_DATE;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==================== 9. STORAGE BUCKETS ====================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-screenshots',
    'payment-screenshots',
    false,
    5242880,  -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

CREATE POLICY "tenants_upload_screenshots" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'payment-screenshots'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "tenants_view_own_screenshots" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-screenshots'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
