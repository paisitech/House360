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
